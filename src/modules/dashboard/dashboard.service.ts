import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getDashboardSummary() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // user & kartu keluarga
            const countUser = await this.prisma.user.count();
            const countKk = await this.prisma.kartuKeluarga.count();

            // penduduk per jenis kelamin
            const countPendudukRaw = await this.prisma.penduduk.groupBy({
                by: ['jenisKelamin'],
                _count: { _all: true },
            });
            const countPenduduk = countPendudukRaw.reduce((acc, curr) => {
                const key = curr.jenisKelamin.replace(/\s|-/g, "_");
                acc[key] = curr._count._all;
                return acc;
            }, {} as Record<string, number>);

            // pengajuan total per status dan jenisSurat
            const countPengajuanRaw = await this.prisma.pengajuanSurat.groupBy({
                by: ['statusSurat', 'jenisSuratId'],
                _count: { _all: true },
            });

            // ambil semua jenisSurat untuk mapping nama
            const jenisSuratList = await this.prisma.jenisSurat.findMany({
                select: { id: true, namaSurat: true },
            });
            const jenisSuratMap = Object.fromEntries(
                jenisSuratList.map(j => [j.id, j.namaSurat])
            );

            const countPengajuan = countPengajuanRaw.map(row => ({
                status: row.statusSurat,
                jenis: jenisSuratMap[row.jenisSuratId] || 'Tidak Diketahui',
                total: row._count._all,
            }));

            // distribusi status total
            const distribusiStatus: Record<string, number> = {};
            countPengajuan.forEach(row => {
                distribusiStatus[row.status] =
                    (distribusiStatus[row.status] || 0) + row.total;
            });

            // distribusi jenis total
            const distribusiJenis: Record<string, number> = {};
            countPengajuan.forEach(row => {
                distribusiJenis[row.jenis] =
                    (distribusiJenis[row.jenis] || 0) + row.total;
            });

            // pengajuan hari ini
            const pengajuanHariIni = await this.prisma.pengajuanSurat.count({
                where: { createdAt: { gte: today } },
            });

            // pengajuan kemarin
            const pengajuanKemarin = await this.prisma.pengajuanSurat.count({
                where: { createdAt: { gte: yesterday, lt: today } },
            });

            return {
                message: 'Data dashboard berhasil diambil',
                data: {
                    stats: {
                        countUser,
                        countKk,
                        totalPenduduk: Object.values(countPenduduk).reduce((a, b) => a + b, 0),
                    },
                    penduduk: countPenduduk,
                    pengajuan: {
                        distribusiStatus,
                        distribusiJenis,
                        detail: countPengajuan,
                        perbandingan: {
                            hariIni: pengajuanHariIni,
                            kemarin: pengajuanKemarin,
                        },
                    },
                },
            };
        } catch (error) {
            throw new Error(`Gagal ambil summary: ${error}`);
        }
    }

    async getDashboardWarga(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                penduduk: {
                    include: {
                        kartuKeluarga: {
                            include: {
                                kepalaKeluarga: true,
                                anggotaKeluarga: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user || !user.penduduk) {
            throw new Error('Penduduk tidak ditemukan untuk user ini');
        }

        const penduduk = user.penduduk;

        const kk = penduduk.kartuKeluarga
            ? {
                nomor: penduduk.kartuKeluarga.noKk,
                alamat: penduduk.kartuKeluarga.alamat,
                kepalaKeluarga: penduduk.kartuKeluarga.kepalaKeluarga?.nama || null,
                anggota: penduduk.kartuKeluarga.anggotaKeluarga.map((a) => ({
                    nama: a.nama,
                    hubungan: a.hubunganDalamKeluarga,
                    usia: Math.floor(
                        (new Date().getTime() - new Date(a.tanggalLahir).getTime()) /
                        (1000 * 60 * 60 * 24 * 365),
                    ),
                })),
            }
            : null;

        // Ambil semua anggota KK
        const anggotaKKIds = [penduduk.id, ...penduduk.kartuKeluarga?.anggotaKeluarga.map(a => a.id) || []];

        const pengajuanDariKK = await this.prisma.pengajuanSurat.findMany({
            where: { pendudukId: { in: anggotaKKIds } },
            include: {
                penduduk: { select: { nama: true } },
                jenisSurat: { select: { namaSurat: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const pengajuanSummary: Record<string, number> = {};
        pengajuanDariKK.forEach((p) => {
            pengajuanSummary[p.statusSurat] = (pengajuanSummary[p.statusSurat] || 0) + 1;
        });

        return {
            message: 'Dashboard warga berhasil diambil',
            data: {
                profil: {
                    nama: penduduk.nama,
                    nik: penduduk.nik,
                    jenisKelamin: penduduk.jenisKelamin,
                    tanggalLahir: penduduk.tanggalLahir,
                    tempatLahir: penduduk.tempatLahir,
                    agama: penduduk.agama,
                    statusPerkawinan: penduduk.statusPerkawinan,
                    pendidikan: penduduk.pendidikan,
                    pekerjaan: penduduk.pekerjaan,
                    kewargaan: penduduk.kewargaan,
                },
                kk,
                pengajuan: {
                    total: pengajuanDariKK.length,
                    perStatus: pengajuanSummary,
                    detail: pengajuanDariKK.map((p) => ({
                        id: p.id,
                        jenis: p.jenisSurat?.namaSurat || '—',
                        status: p.statusSurat,
                        tanggal: p.createdAt,
                        dibuatOleh: p.penduduk.nama,
                    })),
                },
            },
        };
    }

    async getDemographicSummary() {

    }
}
