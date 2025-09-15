import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DukuhModule } from './modules/dukuh/dukuh.module';
import { RwModule } from './modules/rw/rw.module';
import { RtModule } from './modules/rt/rt.module';
import { PendudukModule } from './modules/penduduk/penduduk.module';
import { JenisSuratModule } from './modules/jenis-surat/jenis-surat.module';
import { PengajuanSuratModule } from './modules/pengajuan-surat/pengajuan-surat.module';
import { PrismaModule } from 'prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { KartuKeluargaModule } from './modules/kartu-keluarga/kartu-keluarga.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    PrismaModule,
    AuthModule,
    UsersModule,
    DukuhModule,
    RwModule,
    RtModule,
    PendudukModule,
    JenisSuratModule,
    PengajuanSuratModule,
    KartuKeluargaModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
