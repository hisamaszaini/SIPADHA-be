import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateJenisSuratDto, UpdateJenisSuratDto } from './dto/jenis-surat.dto';
import { PrismaService } from 'prisma/prisma.service';
import { deleteFileFromDisk, handleUpload, handleUploadAndUpdate } from '@/common/utils/file';

@Injectable()
export class JenisSuratService {
  private readonly UPLOAD_PATH = 'jenisSurat';

  constructor(private prisma: PrismaService) { }

  async create(dto: CreateJenisSuratDto, file: Express.Multer.File) {

    let relativePath;

    try {

      const exists = await this.prisma.jenisSurat.findFirst({
        where: { kode: dto.kode },
      });

      if (exists) {
        throw new ConflictException(`Jenis surat dengan kode ${dto.kode} sudah ada!`);
      }

      if (!file) {
        throw new BadRequestException('File template wajib diunggah');
      }

      relativePath = await handleUpload({
        file,
        uploadSubfolder: this.UPLOAD_PATH,
      });

      const data = { ...dto, templateFile: relativePath };

      const jenisSurat = await this.prisma.jenisSurat.create({ data: data });

      return {
        message: 'Jenis surat berhasil dibuat',
        data: jenisSurat,
      };
    } catch (error) {
      if (relativePath) {
        await deleteFileFromDisk(relativePath);
      }
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Gagal membuat jenis surat');
    }
  }

  async findAll(queryParams: FindAllQueryParams): Promise<PaginatedResult<any>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'id',
        sortOrder = 'asc',
      } = queryParams;

      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException('Parameter pagination tidak valid');
      }

      const where: any = {};
      if (search) {
        where.OR = [
          { namaSurat: { contains: search, mode: 'insensitive' } },
          { kode: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, data] = await Promise.all([
        this.prisma.jenisSurat.count({ where }),
        this.prisma.jenisSurat.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        meta: { total, page, limit, totalPages },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Gagal mengambil data jenis surat');
    }
  }

  async findOne(id: number) {
    try {
      const jenisSurat = await this.prisma.jenisSurat.findUnique({ where: { id } });
      if (!jenisSurat) {
        throw new NotFoundException('Jenis surat tidak ditemukan');
      }

      return {
        message: 'Data jenis surat berhasil diambil',
        data: jenisSurat,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Gagal mengambil data jenis surat');
    }
  }

  async update(id: number, dto: UpdateJenisSuratDto, file?: Express.Multer.File) {
    try {

      const existing = await this.prisma.jenisSurat.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Jenis surat tidak ditemukan');

      console.log('Incoming DTO:', dto);
      console.log('Incoming file:', file?.originalname, file?.mimetype, file?.size);
      console.log('Old filePath:', existing.templateFile);

      // Cek kode unik
      if (dto.kode && dto.kode !== existing.kode) {
        const exists = await this.prisma.jenisSurat.findFirst({ where: { kode: dto.kode } });
        if (exists) throw new ConflictException('Kode jenis surat sudah digunakan');
      }

      let filePath = existing.templateFile;

      // hanya ganti file kalau ada upload baru
      if (file) {
        filePath = await handleUploadAndUpdate({
          file,
          oldFilePath: existing.templateFile ?? undefined,
          uploadSubfolder: this.UPLOAD_PATH,
        });
      }

      const updated = await this.prisma.jenisSurat.update({
        where: { id },
        data: {
          ...dto,
          templateFile: filePath, // kalau tidak ada file baru, tetap pakai file lama
        },
      });

      return {
        message: 'Jenis surat berhasil diperbarui',
        data: updated,
      };
    } catch (error) {
      console.error('Update jenis surat error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal memperbarui jenis surat');
    }
  }


  async remove(id: number) {
    try {
      const exists = await this.prisma.jenisSurat.findUnique({ where: { id } });
      if (!exists) throw new NotFoundException('Jenis surat tidak ditemukan');

      if (exists.templateFile) {
        await deleteFileFromDisk(exists.templateFile);
      }

      await this.prisma.jenisSurat.delete({ where: { id } });

      return {
        message: 'Jenis surat berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Gagal menghapus jenis surat');
    }
  }
}