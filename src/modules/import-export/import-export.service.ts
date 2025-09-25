import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'date-fns';
import { PrismaService } from 'prisma/prisma.service';
import { agamaMapping, jkMapping, pendidikanMapping, shdkMapping, statusMapping } from '../penduduk/penduduk.options';

export interface ImportResult {
    success: boolean;
    totalRecords: number;
    successCount: number;
    failedCount: number;
    errors: Array<{
        row: number;
        nik?: string;
        nama?: string;
        error: string;
        data?: any;
    }>;
    processedAt: Date;
    duration: number;
}

export interface BatchResult {
    success: number;
    failed: number;
    errors: Array<{
        row: number;
        nik?: string;
        nama?: string;
        error: string;
        data?: any;
    }>;
}

@Injectable()
export class ImportExportService {
    private readonly logger = new Logger(ImportExportService.name);
    private readonly BATCH_SIZE = 200;

    constructor(private prisma: PrismaService) { }

    private parseTanggalLahir = (value: string | number | Date): Date => {
        if (value instanceof Date) return value;

        if (typeof value === 'number') {
            return new Date(Math.round((value - 25569) * 86400 * 1000));
        }

        if (typeof value === 'string') {
            const parsed = parse(value, 'dd-MM-yyyy', new Date());
            if (!isNaN(parsed.getTime())) return parsed;

            const fallback = new Date(value);
            if (!isNaN(fallback.getTime())) return fallback;
        }

        throw new Error(`Format tanggal tidak valid: ${value}`);
    };

    private cleanDukuhName(raw: string): string {
        const prefixes = ['DUKUH ', 'DUSUN ', 'DUKU '];
        let result = raw.trim().toUpperCase();
        for (const prefix of prefixes) {
            if (result.startsWith(prefix)) {
                result = result.replace(prefix, '');
            }
        }
        return result.trim();
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    private validateRowData(row: any, index: number): string[] {
        const errors: string[] = [];

        if (!row.NIK) errors.push('NIK tidak boleh kosong');
        if (!row.NAMA) errors.push('Nama tidak boleh kosong');
        if (!row.NO_KK) errors.push('No KK tidak boleh kosong');
        if (!row.ALAMAT) errors.push('Dukuh tidak boleh kosong');
        if (!row.NO_RW) errors.push('No RW tidak boleh kosong');
        if (!row.NO_RT) errors.push('No RT tidak boleh kosong');
        if (!row.TGL_LHR) errors.push('Tanggal lahir tidak boleh kosong');

        // Validate NIK length
        if (row.NIK && row.NIK.toString().length !== 16) {
            errors.push('NIK harus 16 digit');
        }

        return errors;
    }

    private async preloadReferenceData() {
        const [dukuhs, rws, rts] = await Promise.all([
            this.prisma.dukuh.findMany(),
            this.prisma.rw.findMany(),
            this.prisma.rt.findMany()
        ]);

        return {
            dukuhMap: new Map(dukuhs.map(d => [d.nama, d.id])),
            rwMap: new Map(rws.map(r => [`${r.nomor}-${r.dukuhId}`, r.id])),
            rtMap: new Map(rts.map(r => [`${r.nomor}-${r.rwId}`, r.id])),
        };
    }

    private async processBatch(
        batch: any[],
        batchIndex: number,
        referenceMaps: any
    ): Promise<BatchResult> {
        const result: BatchResult = {
            success: 0,
            failed: 0,
            errors: []
        };

        const kkGroups = new Map<string, any[]>();

        // Group by KK
        batch.forEach((row, index) => {
            const globalIndex = batchIndex * this.BATCH_SIZE + index;

            // Validate row data
            const validationErrors = this.validateRowData(row, globalIndex);
            if (validationErrors.length > 0) {
                result.failed++;
                result.errors.push({
                    row: globalIndex + 1,
                    nik: row.NIK,
                    nama: row.NAMA,
                    error: validationErrors.join(', '),
                    data: row
                });
                return;
            }

            const noKk = row.NO_KK.toString();
            if (!kkGroups.has(noKk)) {
                kkGroups.set(noKk, []);
            }
            kkGroups.get(noKk)!.push({ ...row, originalIndex: globalIndex });
        });

        // Process each KK group
        for (const [noKk, anggotaKk] of kkGroups.entries()) {
            try {
                await this.processKartuKeluarga(noKk, anggotaKk, referenceMaps);
                result.success += anggotaKk.length;
            } catch (error) {
                result.failed += anggotaKk.length;
                anggotaKk.forEach(anggota => {
                    result.errors.push({
                        row: anggota.originalIndex + 1,
                        nik: anggota.NIK,
                        nama: anggota.NAMA,
                        error: error.message || 'Error tidak diketahui',
                        data: anggota
                    });
                });
            }
        }

        return result;
    }

    private async processKartuKeluarga(noKk: string, anggotaKk: any[], referenceMaps: any) {
        if (anggotaKk.length === 0) return;

        const kepala = anggotaKk[0];
        const namaDukuh = this.cleanDukuhName(kepala.ALAMAT);
        const noRw = kepala.NO_RW.toString().padStart(2, '0');
        const noRt = kepala.NO_RT.toString().padStart(2, '0');

        // Resolve Dukuh
        let dukuhId = referenceMaps.dukuhMap.get(namaDukuh);
        if (!dukuhId) {
            const dukuh = await this.prisma.dukuh.upsert({
                where: { nama: namaDukuh },
                create: { nama: namaDukuh },
                update: {},
            });
            dukuhId = dukuh.id;
            referenceMaps.dukuhMap.set(namaDukuh, dukuhId);
        }

        // Resolve RW
        const rwKey = `${noRw}-${dukuhId}`;
        let rwId = referenceMaps.rwMap.get(rwKey);
        if (!rwId) {
            const rw = await this.prisma.rw.upsert({
                where: { nomor_dukuhId: { nomor: noRw, dukuhId } },
                create: { nomor: noRw, dukuhId },
                update: {},
            });
            rwId = rw.id;
            referenceMaps.rwMap.set(rwKey, rwId);
        }

        // Resolve RT
        const rtKey = `${noRt}-${rwId}`;
        let rtId = referenceMaps.rtMap.get(rtKey);
        if (!rtId) {
            const rt = await this.prisma.rt.upsert({
                where: { nomor_rwId: { nomor: noRt, rwId } },
                create: { nomor: noRt, rwId },
                update: {},
            });
            rtId = rt.id;
            referenceMaps.rtMap.set(rtKey, rtId);
        }

        const alamat = `RT ${noRt} RW ${noRw} Dukuh ${namaDukuh} Desa Cepoko`;

        // Cek KK di map
        let kartuKeluargaId = referenceMaps.kkMap?.[noKk];
        if (!kartuKeluargaId) {
            const existingKK = await this.prisma.kartuKeluarga.findUnique({ where: { noKk } });
            if (existingKK) kartuKeluargaId = existingKK.id;
        }

        await this.prisma.$transaction(async (prisma) => {
            // 1. Upsert KK
            const kk = await prisma.kartuKeluarga.upsert({
                where: { noKk },
                update: { alamat, dukuhId, rwId, rtId },
                create: { noKk, alamat, dukuhId, rwId, rtId },
            });
            kartuKeluargaId = kk.id;
            referenceMaps.kkMap = referenceMaps.kkMap || {};
            referenceMaps.kkMap[noKk] = kartuKeluargaId;

            // 2. Upsert kepala keluarga
            const tanggalLahirKepala = this.parseTanggalLahirStrict(kepala.TGL_LHR, kepala.NIK);
            const kepalaKeluarga = await prisma.penduduk.upsert({
                where: { nik: kepala.NIK.toString() },
                update: {
                    nama: kepala.NAMA,
                    tempatLahir: kepala.TMPT_LHR,
                    tanggalLahir: tanggalLahirKepala,
                    jenisKelamin: jkMapping[kepala.JK] ?? kepala.JK,
                    agama: agamaMapping[kepala.AGAMA] ?? kepala.AGAMA,
                    statusPerkawinan: statusMapping[kepala.STATUS] ?? kepala.STATUS,
                    pendidikan: pendidikanMapping[kepala.PDDK_AKHR] ?? kepala.PDDK_AKHR,
                    pekerjaan: kepala.PEKERJAAN,
                    hubunganDalamKeluarga: shdkMapping[kepala.SHDK] ?? 'Kepala Keluarga',
                    kartuKeluargaId: kk.id,
                },
                create: {
                    nik: kepala.NIK.toString(),
                    nama: kepala.NAMA,
                    tempatLahir: kepala.TMPT_LHR,
                    tanggalLahir: tanggalLahirKepala,
                    jenisKelamin: jkMapping[kepala.JK] ?? kepala.JK,
                    agama: agamaMapping[kepala.AGAMA] ?? kepala.AGAMA,
                    statusPerkawinan: statusMapping[kepala.STATUS] ?? kepala.STATUS,
                    pendidikan: pendidikanMapping[kepala.PDDK_AKHR] ?? kepala.PDDK_AKHR,
                    pekerjaan: kepala.PEKERJAAN,
                    hubunganDalamKeluarga: shdkMapping[kepala.SHDK] ?? 'Kepala Keluarga',
                    kartuKeluargaId: kk.id,
                },
            });

            // 3. Update KK kepala
            await prisma.kartuKeluarga.update({
                where: { id: kk.id },
                data: { kepalaPendudukId: kepalaKeluarga.id },
            });

            // 4. Upsert anggota lain
            for (const anggota of anggotaKk.slice(1)) {
                const tanggalLahirAnggota = this.parseTanggalLahirStrict(anggota.TGL_LHR, anggota.NIK);
                await prisma.penduduk.upsert({
                    where: { nik: anggota.NIK.toString() },
                    update: {
                        nama: anggota.NAMA,
                        tempatLahir: anggota.TMPT_LHR,
                        tanggalLahir: tanggalLahirAnggota,
                        jenisKelamin: jkMapping[anggota.JK] ?? anggota.JK,
                        agama: agamaMapping[anggota.AGAMA] ?? anggota.AGAMA,
                        statusPerkawinan: statusMapping[anggota.STATUS] ?? anggota.STATUS,
                        pendidikan: pendidikanMapping[anggota.PDDK_AKHR] ?? anggota.PDDK_AKHR,
                        pekerjaan: anggota.PEKERJAAN,
                        hubunganDalamKeluarga: shdkMapping[anggota.SHDK] ?? 'Famili Lain',
                        kartuKeluargaId: kk.id,
                    },
                    create: {
                        nik: anggota.NIK.toString(),
                        nama: anggota.NAMA,
                        tempatLahir: anggota.TMPT_LHR,
                        tanggalLahir: tanggalLahirAnggota,
                        jenisKelamin: jkMapping[anggota.JK] ?? anggota.JK,
                        agama: agamaMapping[anggota.AGAMA] ?? anggota.AGAMA,
                        statusPerkawinan: statusMapping[anggota.STATUS] ?? anggota.STATUS,
                        pendidikan: pendidikanMapping[anggota.PDDK_AKHR] ?? anggota.PDDK_AKHR,
                        pekerjaan: anggota.PEKERJAAN,
                        hubunganDalamKeluarga: shdkMapping[anggota.SHDK] ?? 'Famili Lain',
                        kartuKeluargaId: kk.id,
                    },
                });
            }
        });
    }

    async importFromExcel(data: any[]): Promise<ImportResult> {
        const startTime = Date.now();
        const result: ImportResult = {
            success: true,
            totalRecords: data.length,
            successCount: 0,
            failedCount: 0,
            errors: [],
            processedAt: new Date(),
            duration: 0
        };

        this.logger.log(`Starting import of ${data.length} records`);

        try {
            const referenceMaps = await this.preloadReferenceData();

            const batches = this.chunkArray(data, this.BATCH_SIZE);

            for (let i = 0; i < batches.length; i++) {
                this.logger.log(`Processing batch ${i + 1}/${batches.length}`);

                const batchResult = await this.processBatch(batches[i], i, referenceMaps);

                result.successCount += batchResult.success;
                result.failedCount += batchResult.failed;
                result.errors.push(...batchResult.errors);

                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            result.success = result.failedCount === 0;
            result.duration = Date.now() - startTime;

            this.logger.log(`Import completed: ${result.successCount} success, ${result.failedCount} failed, Duration: ${result.duration}ms`);

            return result;

        } catch (error) {
            this.logger.error('Fatal error during import:', error);
            result.success = false;
            result.failedCount = data.length;
            result.errors.push({
                row: 0,
                error: `Fatal error: ${error.message}`,
                data: null
            });
            result.duration = Date.now() - startTime;

            return result;
        }
    }

    private parseTanggalLahirStrict(value: string | number | Date, nik: string): Date {
        try {
            return this.parseTanggalLahir(value);
        } catch (err) {
            throw new Error(`Tanggal lahir tidak valid untuk NIK ${nik}: ${value}`);
        }
    }

}