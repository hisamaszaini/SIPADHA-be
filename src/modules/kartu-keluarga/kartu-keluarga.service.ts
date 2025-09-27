import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateKartuKeluargaWithPendudukDto, CreateKkFromExistingPendudukDto, updateKartuKeluargaWithPendudukDto } from './dto/kartu-keluarga.dto';
import { PrismaService } from 'prisma/prisma.service';
import { parse } from 'date-fns';
import { agamaMapping, jkMapping, pendidikanMapping, shdkMapping, statusMapping } from '../penduduk/penduduk.options';

@Injectable()
export class KartuKeluargaService {

  constructor(private prisma: PrismaService) { }

  async create(dto: CreateKartuKeluargaWithPendudukDto) {
    const existingKk = await this.prisma.kartuKeluarga.findUnique({ where: { noKk: dto.noKk } });
    if (existingKk) {
      throw new ConflictException('Nomor KK sudah terdaftar');
    }

    const existingNik = await this.prisma.penduduk.findUnique({ where: { nik: dto.nik } });
    if (existingNik) {
      throw new ConflictException('NIK sudah terdaftar');
    }

    await this.validateWilayahHierarchy(dto.rtId, dto.rwId, dto.dukuhId);

    const result = await this.prisma.$transaction(async (prisma) => {
      const kepalaKeluarga = await prisma.penduduk.create({
        data: {
          nik: dto.nik,
          nama: dto.nama,
          tempatLahir: dto.tempatLahir,
          tanggalLahir: dto.tanggalLahir,
          jenisKelamin: dto.jenisKelamin,
          agama: dto.agama,
          statusPerkawinan: dto.statusPerkawinan,
          pendidikan: dto.pendidikan,
          pekerjaan: dto.pekerjaan,
          hubunganDalamKeluarga: 'Kepala Keluarga',
          kartuKeluarga: {
            create: {
              noKk: dto.noKk,
              alamat: dto.alamat,
              dukuhId: dto.dukuhId,
              rwId: dto.rwId,
              rtId: dto.rtId,
            }
          }
        },
        select: {
          id: true,
          kartuKeluargaId: true,
        }
      });

      const kartuKeluarga = await prisma.kartuKeluarga.update({
        where: {
          id: kepalaKeluarga.kartuKeluargaId,
        },
        data: {
          kepalaPendudukId: kepalaKeluarga.id,
        },
        include: {
          kepalaKeluarga: {
            select: { nama: true, nik: true }
          },
          rt: { include: { rw: { include: { dukuh: true } } } },
        }
      });

      return kartuKeluarga;
    });

    return {
      message: 'Kartu Keluarga dan Kepala Keluarga berhasil dibuat',
      data: result
    };
  }

  async createFromExistingPenduduk(dto: CreateKkFromExistingPendudukDto) {
    if (!dto.kepalaPendudukId) {
      throw new BadRequestException('ID Kepala Penduduk (kepalaPendudukId) wajib diisi untuk skenario ini.');
    }

    const existingPenduduk = await this.prisma.penduduk.findUnique({
      where: { id: dto.kepalaPendudukId },
    });
    if (!existingPenduduk) {
      throw new NotFoundException(`Penduduk dengan ID ${dto.kepalaPendudukId} tidak ditemukan.`);
    }

    const existingKk = await this.prisma.kartuKeluarga.findUnique({ where: { noKk: dto.noKk } });
    if (existingKk) {
      throw new ConflictException('Nomor KK sudah terdaftar');
    }

    await this.validateWilayahHierarchy(dto.rtId, dto.rwId, dto.dukuhId);

    const result = await this.prisma.$transaction(async (prisma) => {
      const newKartuKeluarga = await prisma.kartuKeluarga.create({
        data: {
          noKk: dto.noKk,
          alamat: dto.alamat,
          dukuhId: dto.dukuhId,
          rwId: dto.rwId,
          rtId: dto.rtId,
          kepalaPendudukId: dto.kepalaPendudukId,
        },
      });

      await prisma.penduduk.update({
        where: {
          id: dto.kepalaPendudukId,
        },
        data: {
          kartuKeluargaId: newKartuKeluarga.id,
          hubunganDalamKeluarga: 'Kepala Keluarga',
        },
      });

      return prisma.kartuKeluarga.findUnique({
        where: { id: newKartuKeluarga.id },
        include: {
          kepalaKeluarga: {
            select: { nama: true, nik: true }
          },
          rt: { include: { rw: { include: { dukuh: true } } } },
        }
      });
    });

    return {
      message: 'Kartu Keluarga baru berhasil dibuat dan penduduk telah dipindahkan',
      data: result,
    };
  }

  async findAll(queryParams: FindAllQueryParams): Promise<PaginatedResult<any>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'id',
        sortOrder = 'desc',
        rtId,
        rwId,
        dukuhId,
      } = queryParams;

      console.log(`Dukuh: ${dukuhId}, RW: ${rwId}, RT: ${rtId}`);

      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException('Parameter pagination tidak valid');
      }

      const where: any = {};
      let orderBy: any;

      if (search) {
        where.OR = [
          { noKk: { contains: search, mode: 'insensitive' } },
          { alamat: { contains: search, mode: 'insensitive' } },
          { kepalaKeluarga: { nama: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (rtId) {
        where.rtId = rtId;
      }

      if (rwId) {
        where.rt = {
          ...(where.rt || {}),
          rwId,
        };
      }

      if (dukuhId) {
        where.rt = {
          ...(where.rt || {}),
          rw: {
            ...(where.rt?.rw || {}),
            dukuhId,
          },
        };
      }

      if (sortBy === 'kepalaKeluarga') {
        orderBy = {
          kepalaKeluarga: {
            nama: sortOrder,
          },
        };
      } else if (sortBy === 'anggotaKeluarga') {
        orderBy = {
          anggotaKeluarga: {
            _count: sortOrder,
          },
        };
      } else {
        orderBy = {
          [sortBy]: sortOrder
        };
      }

      const [total, kartuKeluargas] = await Promise.all([
        this.prisma.kartuKeluarga.count({ where }),
        this.prisma.kartuKeluarga.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: orderBy,
          include: {
            rt: {
              include: {
                rw: {
                  include: {
                    dukuh: true,
                  },
                },
              },
            },
            kepalaKeluarga: {
              select: { nama: true, nik: true }
            },
            _count: {
              select: {
                anggotaKeluarga: true,
              },
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: kartuKeluargas,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal mengambil data kepala keluarga');
    }
  }

  async findKk(noKk: string) {
    const kk = await this.prisma.kartuKeluarga.findUnique({
      where: { noKk },
      include: {
        //   rt: { include: { rw: { include: { dukuh: true } } } },
        kepalaKeluarga: { select: { nik: true, nama: true } }
        //   // anggotaKeluarga: true
      }
    });

    if (!kk) {
      throw new NotFoundException('KK tidak ditemukan');
    }

    return {
      data: kk,
      message: 'KK ditemukan'
    };
  }

  async findOne(id: number) {
    try {
      const kartuKeluarga = await this.prisma.kartuKeluarga.findUnique({
        where: { id },
        include: {
          rt: {
            include: {
              rw: {
                include: {
                  dukuh: true,
                },
              },
            },
          },
          kepalaKeluarga: true,
          anggotaKeluarga: {
            orderBy: {
              hubunganDalamKeluarga: 'asc',
            },
          },
        },
      });

      if (!kartuKeluarga) {
        throw new NotFoundException('Kartu keluarga tidak ditemukan');
      }

      return {
        message: 'Data kartu keluarga berhasil diambil',
        data: kartuKeluarga,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal mengambil data kartu keluarga');
    }
  }

  async updateKartuKeluarga(
    id: number,
    dto: updateKartuKeluargaWithPendudukDto
  ) {
    const kk = await this.prisma.kartuKeluarga.findUnique({
      where: { id },
      include: { anggotaKeluarga: true, kepalaKeluarga: true },
    });

    if (!kk) throw new NotFoundException('Kartu Keluarga tidak ditemukan');

    let kepalaBaruId: number = kk.kepalaPendudukId!;

    await this.prisma.$transaction(async (prisma) => {
      // --- Tangani NIK baru ---
      if (dto.nik) {
        let penduduk = await prisma.penduduk.findUnique({
          where: { nik: dto.nik },
          include: { kepalaDariKeluarga: true }
        });

        if (penduduk) {
          // Cek apakah penduduk sudah jadi kepala KK lain
          if (penduduk.kepalaDariKeluarga && penduduk.kepalaDariKeluarga.id !== kk.id) {
            throw new BadRequestException('Penduduk ini sudah menjadi kepala KK lain');
          }

          kepalaBaruId = penduduk.id;

          // Update hubungan dalam keluarga & pastikan anggota KK ini
          await prisma.penduduk.update({
            where: { id: penduduk.id },
            data: {
              hubunganDalamKeluarga: 'Kepala Keluarga',
              kartuKeluargaId: kk.id,
            },
          });

        } else {
          // Buat penduduk baru
          const newPenduduk = await prisma.penduduk.create({
            data: {
              nik: dto.nik,
              nama: dto.nama!,
              tempatLahir: dto.tempatLahir!,
              tanggalLahir: dto.tanggalLahir!,
              jenisKelamin: dto.jenisKelamin!,
              agama: dto.agama!,
              statusPerkawinan: dto.statusPerkawinan!,
              pendidikan: dto.pendidikan || null,
              pekerjaan: dto.pekerjaan || null,
              hubunganDalamKeluarga: 'Kepala Keluarga',
              kartuKeluargaId: kk.id,
            },
          });

          kepalaBaruId = newPenduduk.id;
        }
      }

      // --- Update kepala lama menjadi Lainnya ---
      if (kk.kepalaPendudukId && kk.kepalaPendudukId !== kepalaBaruId) {
        await prisma.penduduk.update({
          where: { id: kk.kepalaPendudukId },
          data: { hubunganDalamKeluarga: 'Famili Lain' },
        });
      }

      // --- Update Kartu Keluarga ---
      await prisma.kartuKeluarga.update({
        where: { id },
        data: {
          noKk: dto.noKk ?? kk.noKk,
          alamat: dto.alamat ?? kk.alamat,
          dukuhId: dto.dukuhId ?? kk.dukuhId,
          rwId: dto.rwId ?? kk.rwId,
          rtId: dto.rtId ?? kk.rtId,
          kepalaPendudukId: kepalaBaruId,
        },
      });
    });

    // --- Return data terbaru ---
    return this.prisma.kartuKeluarga.findUnique({
      where: { id },
      include: {
        kepalaKeluarga: true,
        anggotaKeluarga: true,
        rt: { include: { rw: { include: { dukuh: true } } } },
      },
    });
  }

  // async update(id: number, dto: updateKartuKeluargaWithPendudukDto) {
  //   const kk = await this.prisma.kartuKeluarga.findUnique({
  //     where: { id },
  //     include: { anggotaKeluarga: true },
  //   });

  //   if (!kk) {
  //     throw new NotFoundException('Kartu Keluarga tidak ditemukan');
  //   }

  //   if (dto.noKk && dto.noKk !== kk.noKk) {
  //     const existing = await this.prisma.kartuKeluarga.findUnique({
  //       where: { noKk: dto.noKk },
  //     });
  //     if (existing) {
  //       throw new ConflictException('Nomor KK sudah terdaftar');
  //     }
  //   }

  //   if (dto.nik) {
  //     const existingNik = await this.prisma.penduduk.findUnique({
  //       where: { nik: dto.nik },
  //     });
  //     if (existingNik && existingNik.id !== kk.kepalaPendudukId) {
  //       throw new ConflictException('NIK sudah terdaftar');
  //     }
  //   }

  //   const result = await this.prisma.$transaction(async (prisma) => {
  //     const updatedKK = await prisma.kartuKeluarga.update({
  //       where: { id },
  //       data: {
  //         noKk: dto.noKk ?? kk.noKk,
  //         alamat: dto.alamat ?? kk.alamat,
  //         dukuhId: dto.dukuhId ?? kk.dukuhId,
  //         rwId: dto.rwId ?? kk.rwId,
  //         rtId: dto.rtId ?? kk.rtId,
  //       },
  //     });

  //     if (kk.kepalaPendudukId) {
  //       await prisma.penduduk.update({
  //         where: { id: kk.kepalaPendudukId },
  //         data: {
  //           nik: dto.nik,
  //           nama: dto.nama,
  //           tempatLahir: dto.tempatLahir,
  //           tanggalLahir: dto.tanggalLahir,
  //           jenisKelamin: dto.jenisKelamin,
  //           agama: dto.agama,
  //           statusPerkawinan: dto.statusPerkawinan,
  //           pendidikan: dto.pendidikan,
  //           pekerjaan: dto.pekerjaan,
  //         },
  //       });
  //     }

  //     if (dto.kepalaPendudukId && dto.kepalaPendudukId !== kk.kepalaPendudukId) {
  //       const anggotaValid = kk.anggotaKeluarga.find(a => a.id === dto.kepalaPendudukId);
  //       if (!anggotaValid) {
  //         throw new BadRequestException('Penduduk bukan anggota dari KK ini');
  //       }

  //       await prisma.kartuKeluarga.update({
  //         where: { id },
  //         data: { kepalaPendudukId: dto.kepalaPendudukId },
  //       });
  //     }

  //     return prisma.kartuKeluarga.findUnique({
  //       where: { id },
  //       include: {
  //         kepalaKeluarga: { select: { id: true, nik: true, nama: true } },
  //         anggotaKeluarga: { select: { id: true, nik: true, nama: true } },
  //         rt: { include: { rw: { include: { dukuh: true } } } },
  //       },
  //     });
  //   });

  //   return {
  //     message: 'Kartu Keluarga berhasil diperbarui',
  //     data: result,
  //   };
  // }

  async remove(id: number) {
    try {
      // Check if KK exists
      const kartuKeluarga = await this.prisma.kartuKeluarga.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              anggotaKeluarga: true,
            },
          },
        },
      });

      if (!kartuKeluarga) {
        throw new NotFoundException('Kartu keluarga tidak ditemukan');
      }

      // Check if KK has anggota
      if (kartuKeluarga._count.anggotaKeluarga > 0) {
        throw new ConflictException('Tidak dapat menghapus kartu keluarga yang masih memiliki anggota');
      }

      // Delete KK
      await this.prisma.kartuKeluarga.delete({
        where: { id },
      });

      return {
        message: 'Kartu keluarga berhasil dihapus',
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Kartu keluarga tidak ditemukan');
      }

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Gagal menghapus kartu keluarga');
    }
  }

  private async validateWilayahHierarchy(rtId: number, rwId?: number, dukuhId?: number) {
    // Get RT details
    const rt = await this.prisma.rt.findUnique({
      where: { id: rtId },
      include: {
        rw: {
          include: {
            dukuh: true,
          },
        },
      },
    });

    if (!rt) {
      throw new BadRequestException('RT tidak valid');
    }

    // Validate RW if provided
    if (rwId && rt.rwId !== rwId) {
      throw new BadRequestException('RT tidak termasuk dalam RW yang dipilih');
    }

    // Validate Dukuh if provided
    if (dukuhId && rt.rw.dukuhId !== dukuhId) {
      throw new BadRequestException('RW tidak termasuk dalam Dukuh yang dipilih');
    }
  }

  private excelDateToJSDate(excelDate: number): Date {
    return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  }

  private parseTanggalLahir(value: string | number | Date): Date {
    if (value instanceof Date) return value;

    if (typeof value === 'number') {
      // Excel serial date
      return new Date(Math.round((value - 25569) * 86400 * 1000));
    }

    if (typeof value === 'string') {
      // Coba format 'DD-MM-YYYY'
      const parsed = parse(value, 'dd-MM-yyyy', new Date());
      if (!isNaN(parsed.getTime())) return parsed;

      // fallback ke 'YYYY-MM-DD' atau Date default
      const fallback = new Date(value);
      if (!isNaN(fallback.getTime())) return fallback;
    }

    throw new Error(`Format tanggal tidak valid: ${value}`);
  }


  async importKartuKeluargaFromExcel(data: any[], dukuhId: number) {
    const rwMap: Record<string, number> = {};
    const rtMap: Record<string, number> = {};
    const kkMap: Record<string, number> = {}; // noKk -> kkId

    const parseTanggalLahir = (value: string | number | Date): Date => {
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

    for (const row of data) {
      const noRw = row.NO_RW.toString().padStart(2, '0');
      const noRt = row.NO_RT.toString().padStart(2, '0');
      const noKk = row.NO_KK;

      // Resolve RW
      let rwId = rwMap[noRw];
      if (!rwId) {
        const rw = await this.prisma.rw.upsert({
          where: { nomor_dukuhId: { nomor: noRw, dukuhId } },
          create: { nomor: noRw, dukuhId },
          update: {},
        });
        rwId = rw.id;
        rwMap[noRw] = rwId;
      }

      // Resolve RT
      const rtKey = `${noRw}-${noRt}`;
      let rtId = rtMap[rtKey];
      if (!rtId) {
        const rt = await this.prisma.rt.upsert({
          where: { nomor_rwId: { nomor: noRt, rwId } },
          create: { nomor: noRt, rwId },
          update: {},
        });
        rtId = rt.id;
        rtMap[rtKey] = rtId;
      }

      // Parse tanggal lahir
      let tanggalLahir: Date;
      try {
        tanggalLahir = parseTanggalLahir(row.TGL_LHR);
      } catch (err) {
        console.error(`Gagal parsing tanggal lahir untuk NIK ${row.NIK}:`, err.message);
        continue;
      }

      // Alamat otomatis
      const alamat = `RT ${noRt} RW ${noRw} Dukuh Jati Desa Cepoko`;

      // Ambil semua anggota KK
      const anggotaKk = data.filter(d => d.NO_KK === noKk);

      // Cek KK
      let kartuKeluargaId = kkMap[noKk];
      if (!kartuKeluargaId) {
        const existingKK = await this.prisma.kartuKeluarga.findUnique({ where: { noKk } });
        if (existingKK) kartuKeluargaId = existingKK.id;
      }

      // Insert KK jika belum ada
      if (!kartuKeluargaId) {
        const kepala = anggotaKk[0];
        await this.prisma.$transaction(async (prisma) => {
          const kepalaKeluarga = await prisma.penduduk.create({
            data: {
              nik: kepala.NIK,
              nama: kepala.NAMA,
              tempatLahir: kepala.TMPT_LHR,
              tanggalLahir,
              jenisKelamin: jkMapping[kepala.JK] ?? kepala.JK,
              agama: agamaMapping[kepala.AGAMA] ?? kepala.AGAMA,
              statusPerkawinan: statusMapping[kepala.STATUS] ?? kepala.STATUS,
              pendidikan: pendidikanMapping[kepala.PDDK_AKHR] ?? kepala.PDDK_AKHR,
              pekerjaan: kepala.PEKERJAAN,
              hubunganDalamKeluarga: shdkMapping[kepala.SHDK] ?? 'Famili Lain',
              kartuKeluarga: {
                create: {
                  noKk,
                  alamat,
                  dukuhId,
                  rwId,
                  rtId,
                }
              }
            }
          });

          await prisma.kartuKeluarga.update({
            where: { id: kepalaKeluarga.kartuKeluargaId },
            data: { kepalaPendudukId: kepalaKeluarga.id }
          });

          kartuKeluargaId = kepalaKeluarga.kartuKeluargaId;
          kkMap[noKk] = kartuKeluargaId;

          // Insert anggota lain
          for (const anggota of anggotaKk.slice(1)) {
            await prisma.penduduk.create({
              data: {
                nik: anggota.NIK,
                nama: anggota.NAMA,
                tempatLahir: anggota.TMPT_LHR,
                tanggalLahir,
                jenisKelamin: jkMapping[anggota.JK] ?? anggota.JK,
                agama: agamaMapping[anggota.AGAMA] ?? anggota.AGAMA,
                statusPerkawinan: statusMapping[anggota.STATUS] ?? anggota.STATUS,
                pendidikan: pendidikanMapping[anggota.PDDK_AKHR] ?? anggota.PDDK_AKHR,
                pekerjaan: anggota.PEKERJAAN,
                hubunganDalamKeluarga: shdkMapping[anggota.SHDK] ?? 'Famili Lain',
                kartuKeluargaId,
              }
            });
          }
        });
      }
    }

    return { message: 'Import Kartu Keluarga berhasil' };
  }

}
