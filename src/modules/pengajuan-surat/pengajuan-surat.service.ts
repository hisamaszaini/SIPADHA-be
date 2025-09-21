import { BadRequestException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { fullCreatePengajuanSuratDto, UpdatePengajuanSuratDto, UpdateStatusSuratDto } from './dto/pengajuan-surat.dto';
import { PrismaService } from 'prisma/prisma.service';
import { FindAllPengajuanSuratQueryParams, jenisSuratOptions } from './pengajuan-surat.types';
import { Prisma } from '@prisma/client';
import { KartuKeluarga } from '../kartu-keluarga/entities/kartu-keluarga.entity';
import { sendTextMessage } from '@/common/utils/wa';

@Injectable()
export class PengajuanSuratService {
  constructor(private prisma: PrismaService) { }

  async create(
    user: { userId: number, role: string },
    data: fullCreatePengajuanSuratDto
  ) {
    try {
      const { statusSurat, ...payload } = data;

      let pendudukId: number;

      console.log(user);

      if (user.role === 'WARGA') {
        const penduduk = await this.prisma.penduduk.findUnique({
          where: { userId: user.userId },
          select: { id: true, kartuKeluargaId: true },
        });

        if (!penduduk) {
          throw new ForbiddenException('Data penduduk tidak ditemukan untuk user ini');
        }

        console.log(`[CREATE] USER KkId: ${penduduk.kartuKeluargaId}`)


        // Validasi pendudukId
        const pendudukCheck = await this.prisma.penduduk.findFirst({
          where: {
            id: payload.pendudukId,
            kartuKeluargaId: penduduk.kartuKeluargaId,
          },
        });

        console.log(`[CREATE] userId: ${user.userId}`);
        console.log(`[CREATE] pendudukId: ${payload.pendudukId}`);

        if (!pendudukCheck) {
          throw new ForbiddenException('Penduduk yang dipilih bukan satu KK dengan user ini');
        }

        if ('targetId' in payload && payload.targetId) {
          const targetCheck = await this.prisma.penduduk.findFirst({
            where: {
              id: payload.targetId,
              kartuKeluargaId: penduduk.kartuKeluargaId,
            },
          });

          if (!targetCheck) {
            throw new ForbiddenException('Target bukan satu KK dengan user ini');
          }
        }

        pendudukId = payload.pendudukId;
      } else {
        if (!payload.pendudukId) {
          throw new BadRequestException('pendudukId wajib diisi untuk role non-WARGA');
        }
        pendudukId = payload.pendudukId;

        const penduduk = await this.prisma.penduduk.findUnique({
          where: { id: user.userId },
          select: { id: true },
        });

        if (!penduduk) {
          throw new NotFoundException('Data penduduk tidak ditemukan');
        }
      }

      // const jenisSurat = await this.prisma.jenisSurat.findUnique({
      //   where: { id: jenisSuratId },
      //   select: { id: true },
      // });

      // if (!jenisSurat) {
      //   throw new BadRequestException('jenisSuratId tidak valid');
      // }

      const { pendudukId: _, jenis, ...safePayload } = payload;
      const targetId = 'targetId' in safePayload ? safePayload.targetId : null;

      if (targetId) {
        const targetExist = await this.prisma.penduduk.findUnique({
          where: { id: targetId }
        });

        if (!targetExist) {
          throw new NotFoundException('Data penduduk tidak ditemukan');
        }
      }

      const pengajuan = await this.prisma.pengajuanSurat.create({
        data: {
          pendudukId,
          createdById: user.userId,
          jenis,
          statusSurat,
          targetId: 'targetId' in safePayload ? safePayload.targetId : null,
          dataPermohonan: safePayload,
        },
      });

      return {
        success: true,
        message: "Pengajuan surat berhasil dibuat",
        data: pengajuan,
      };
    } catch (error) {
      console.error("Gagal membuat pengajuan surat:", error);
      throw new InternalServerErrorException('Terjadi kesalahan saat mengajukan surat');
    }
  }

  async findAll(
    user: { userId: number; role: string },
    queryParams: FindAllPengajuanSuratQueryParams
  ): Promise<PaginatedResult<any>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        statusSurat,
        sortBy = 'id',
        sortOrder = 'asc',
      } = queryParams;

      const skip = (page - 1) * limit;

      const where: any = {};

      // Jika WARGA, hanya boleh lihat pengajuan miliknya
      if (user.role === 'WARGA') {
        const penduduk = await this.prisma.penduduk.findUnique({
          where: { userId: user.userId },
          select: { kartuKeluargaId: true },
        });

        if (!penduduk) {
          throw new ForbiddenException('Penduduk tidak ditemukan');
        }

        const anggotaKK = await this.prisma.penduduk.findMany({
          where: { kartuKeluargaId: penduduk.kartuKeluargaId },
          select: { id: true },
        });

        const pendudukIds = anggotaKK.map(a => a.id);

        where.pendudukId = { in: pendudukIds };
      }

      // Filter statusSurat
      if (statusSurat) {
        where.statusSurat = statusSurat;
      }

      // Search (jenis, nama penduduk pemohon, nama target)
      if (search) {
        where.OR = [
          { jenis: { contains: search, mode: 'insensitive' } },
          { penduduk: { nama: { contains: search, mode: 'insensitive' } } },
          { target: { nama: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [total, data] = await this.prisma.$transaction([
        this.prisma.pengajuanSurat.count({ where }),
        this.prisma.pengajuanSurat.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            penduduk: {
              select: { id: true, nama: true, nik: true },
            },
            target: {
              select: { id: true, nama: true, nik: true },
            },
          },
        }),
      ]);

      return {
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        data,
      };
    } catch (error) {
      console.error('Gagal mengambil data pengajuan surat:', error);
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException(
          'Terjadi kesalahan saat mengambil data pengajuan surat',
        );
    }
  }

  async findOne(id: number, user: { userId: number; role: string }) {
    try {
      const [pengajuan, setting] = await Promise.all([
        this.prisma.pengajuanSurat.findUnique({
          where: { id },
          include: {
            penduduk: {
              include: {
                kartuKeluarga: {
                  include: {
                    rt: {
                      include: {
                        rw: {
                          include: { dukuh: true },
                        }
                      }
                    }
                  }
                }
              }
            },
            target: true,
            jenisSurat: true,
            createdBy: {
              select: {
                id: true,
                noHp: true,
                email: true,
                username: true,
                role: true,
              },
            },
          },
        }),
        this.prisma.setting.findFirst({
          select: {
            namaKepdes: true,
            nikKepdes: true,
            alamatKepdes: true,
          },
        }),
      ]);

      if (!pengajuan) {
        throw new NotFoundException(
          `Pengajuan surat dengan ID ${id} tidak ditemukan`,
        );
      }

      return {
        success: true,
        message: "Detail pengajuan surat berhasil ditemukan",
        data: { ...pengajuan, setting },
      };
    } catch (error) {
      console.error("Gagal mengambil detail pengajuan surat:", error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Terjadi kesalahan tidak diketahui');
    }
  }

  async update(
    id: number,
    user: { userId: number; role: string },
    data: UpdatePengajuanSuratDto,
  ) {
    try {
      const existing = await this.prisma.pengajuanSurat.findUnique({
        where: { id },
        include: { penduduk: { select: { userId: true } } },
      });

      if (!existing) {
        throw new NotFoundException(
          `Pengajuan surat dengan id ${id} tidak ditemukan`,
        );
      }

      // WARGA hanya boleh update satu KK
      if (user.role === 'WARGA') {
        const pendudukLogin = await this.prisma.penduduk.findUnique({
          where: { userId: user.userId },
          select: { id: true, kartuKeluargaId: true },
        });

        if (!pendudukLogin) {
          throw new ForbiddenException('Penduduk tidak ditemukan');
        }

        const pendudukPemilik = await this.prisma.penduduk.findUnique({
          where: { id: existing.pendudukId },
          select: { kartuKeluargaId: true },
        });

        if (
          !pendudukPemilik ||
          pendudukLogin.kartuKeluargaId !== pendudukPemilik.kartuKeluargaId
        ) {
          throw new ForbiddenException(
            'Anda tidak memiliki akses untuk mengubah pengajuan ini',
          );
        }
      }

      const { jenisSuratId, statusSurat, pendudukId: pendudukIdFromPayload, ...payload } = data;

      let pendudukId = existing.pendudukId;
      if (user.role !== 'WARGA' && pendudukIdFromPayload) {
        pendudukId = pendudukIdFromPayload;
      }

      // safePayload dijamin object
      const safePayload: Record<string, unknown> = { ...payload };
      delete safePayload['pendudukId'];

      const updated = await this.prisma.pengajuanSurat.update({
        where: { id },
        data: {
          pendudukId,
          jenis: (safePayload['jenis'] as string) ?? existing.jenis,
          jenisSuratId: jenisSuratId ?? existing.jenisSuratId,
          statusSurat:
            user.role === 'WARGA'
              ? existing.statusSurat
              : statusSurat ?? existing.statusSurat,
          targetId:
            'targetId' in safePayload
              ? (safePayload['targetId'] as number)
              : existing.targetId,
          dataPermohonan: Object.keys(safePayload).length > 0
            ? ({
              ...(existing.dataPermohonan as Record<string, unknown>),
              ...safePayload,
            } as Prisma.InputJsonValue)
            : (existing.dataPermohonan as Prisma.InputJsonValue),
        },
      });

      return {
        success: true,
        message: 'Pengajuan surat berhasil diperbarui',
        data: updated,
      };
    } catch (error) {
      console.error('Gagal memperbarui pengajuan surat:', error);
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException(
          'Terjadi kesalahan saat memperbarui pengajuan surat',
        );
    }
  }

  async validate(
    id: number,
    user: { userId: number; role: string },
    data: UpdateStatusSuratDto,
  ) {
    try {
      const surat = await this.prisma.pengajuanSurat.findUnique({
        where: { id },
        include: {
          penduduk: {
            include: {
              user: true,
              kartuKeluarga: {
                include: {
                  anggotaKeluarga: { include: { user: true } },
                },
              },
            },
          },
        },
      });

      if (!surat) throw new NotFoundException('Surat tidak ditemukan');

      const updateData: Prisma.PengajuanSuratUpdateInput = {
        statusSurat: data.statusSurat,
        catatan: data.catatan ?? null,
        validatedBy: { connect: { id: user.userId } },
      };

      if (data.statusSurat === 'DIPROSES') {
        updateData.processAt = new Date();
      } else {
        updateData.processEnd = new Date();
      }

      const updated = await this.prisma.pengajuanSurat.update({
        where: { id },
        data: updateData,
      });

      let noHp: string | null = null;

      if (surat?.penduduk?.user?.noHp) {
        noHp = surat.penduduk.user.noHp;
      } else if (surat?.penduduk?.kartuKeluarga?.anggotaKeluarga?.length) {
        const anggotaDenganUser = surat.penduduk.kartuKeluarga.anggotaKeluarga.find(
          (a) => a.userId && a.user?.noHp
        );
        if (anggotaDenganUser) noHp = anggotaDenganUser.user!.noHp;
      }

      // Kirim notifikasi WA
      const jenisSuratLabel =
        jenisSuratOptions.find((j) => j.value === surat.jenis)?.label || surat.jenis;

      const namaPenduduk = surat.penduduk.nama || '';
      const sapaan =
        surat.penduduk.jenisKelamin === 'Laki-laki' ? 'Bapak' :
          surat.penduduk.jenisKelamin === 'Perempuan' ? 'Ibu' :
            'Bapak/Ibu';

      const jam = new Date().getHours();
      let salam = 'Selamat Pagi';
      if (jam >= 11 && jam < 15) {
        salam = 'Selamat Siang';
      } else if (jam >= 15 && jam < 18) {
        salam = 'Selamat Sore';
      } else if (jam >= 18 || jam < 4) {
        salam = 'Selamat Malam';
      }

      if (noHp) {
        if (data.statusSurat === 'DITOLAK') {
          await sendTextMessage(
            noHp,
            `${salam} ${sapaan} ${namaPenduduk},\n\n` +
            `Pengajuan ${jenisSuratLabel} Anda *ditolak* oleh pihak desa.` +
            `\nAlasan: ${data.catatan ?? '-'}` +
            `\n\nSilakan mengajukan kembali jika diperlukan.`
          );
        } else if (data.statusSurat === 'SELESAI') {
          await sendTextMessage(
            noHp,
            `${salam} ${sapaan} ${namaPenduduk},\n\n` +
            `Pengajuan ${jenisSuratLabel} Anda telah *selesai diproses*.` +
            `\nSilakan mengambil surat secara langsung di kantor desa, karena terdapat *tanda tangan basah* dari Kepala Desa.` +
            `\n\nTerima kasih atas perhatian Anda.`
          );
        }
      }

      return {
        success: true,
        message: `Surat berhasil diperbarui menjadi ${data.statusSurat}`,
        data: updated,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new BadRequestException(error.message || 'Terjadi kesalahan saat memvalidasi surat');
    }
  }

  async remove(id: number, user: { userId: number; role: string }) {
    try {
      const existing = await this.prisma.pengajuanSurat.findUnique({
        where: { id },
        select: { pendudukId: true },
      });

      if (!existing) {
        throw new NotFoundException(
          `Pengajuan surat dengan ID ${id} tidak ditemukan`,
        );
      }

      if (user.role === 'WARGA') {
        const checkWarga = await this.prisma.penduduk.findUnique({
          where: { userId: user.userId },
          select: { id: true },
        });

        if (!checkWarga || !checkWarga.id) {
          throw new ForbiddenException('Akun warga tidak valid');
        }

        if (existing.pendudukId !== checkWarga.id) {
          throw new ForbiddenException(
            'Anda tidak boleh menghapus pengajuan surat milik orang lain',
          );
        }
      }

      await this.prisma.pengajuanSurat.delete({
        where: { id },
      });

      return {
        message: `Pengajuan surat dengan ID ${id} berhasil dihapus`,
      };
    } catch (error) {
      console.error('Gagal menghapus pengajuan surat:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Terjadi kesalahan saat menghapus pengajuan surat',
      );
    }
  }
}
