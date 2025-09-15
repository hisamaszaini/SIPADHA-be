import { Injectable } from '@nestjs/common';

@Injectable()
export class PengajuanSuratService {
  create() {
    return 'This action adds a new pengajuanSurat';
  }

  findAll() {
    return `This action returns all pengajuanSurat`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pengajuanSurat`;
  }

  update(id: number) {
    return `This action updates a #${id} pengajuanSurat`;
  }

  remove(id: number) {
    return `This action removes a #${id} pengajuanSurat`;
  }
}
