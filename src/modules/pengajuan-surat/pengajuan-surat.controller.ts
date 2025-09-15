import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PengajuanSuratService } from './pengajuan-surat.service';

@Controller('pengajuan-surat')
export class PengajuanSuratController {
  constructor(private readonly pengajuanSuratService: PengajuanSuratService) {}

}
