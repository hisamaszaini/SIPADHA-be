import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getDashboardSummary() {
        try {
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


            // pengajuan per status + jenis
            const countPengajuanRaw = await this.prisma.pengajuanSurat.groupBy({
                by: ['statusSurat', 'jenis'],
                _count: { _all: true },
            });

            // mapping ke bentuk lebih rapi
            const countPengajuan = countPengajuanRaw.map((row) => ({
                status: row.statusSurat,
                jenis: row.jenis,
                total: row._count._all,
            }));

            // agregasi untuk distribusi status
            const distribusiStatus: Record<string, number> = {};
            countPengajuan.forEach((row) => {
                distribusiStatus[row.status] =
                    (distribusiStatus[row.status] || 0) + row.total;
            });

            // agregasi untuk jenis surat populer
            const distribusiJenis: Record<string, number> = {};
            countPengajuan.forEach((row) => {
                distribusiJenis[row.jenis] =
                    (distribusiJenis[row.jenis] || 0) + row.total;
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
                    },
                },
            };
        } catch (error) {
            throw new Error(`Gagal ambil summary: ${error}`);
        }
    }

    async getDemographicSummary() {

    }
}
