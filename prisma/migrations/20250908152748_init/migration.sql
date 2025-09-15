-- CreateEnum
CREATE TYPE "public"."StatusSurat" AS ENUM ('PENDING', 'DIPROSES', 'SELESAI', 'DITOLAK');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'PENGURUS', 'WARGA');

-- CreateEnum
CREATE TYPE "public"."StatusUser" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'WARGA',
    "statusUser" "public"."StatusUser" NOT NULL DEFAULT 'ACTIVE',
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Dukuh" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dukuh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Rw" (
    "id" SERIAL NOT NULL,
    "nomor" TEXT NOT NULL,
    "dukuhId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Rt" (
    "id" SERIAL NOT NULL,
    "nomor" TEXT NOT NULL,
    "rwId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KepalaKeluarga" (
    "id" SERIAL NOT NULL,
    "noKk" TEXT NOT NULL,
    "dukuhId" INTEGER NOT NULL,
    "rwId" INTEGER NOT NULL,
    "rtId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KepalaKeluarga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Penduduk" (
    "id" SERIAL NOT NULL,
    "nik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tempatLahir" TEXT NOT NULL,
    "tanggalLahir" TIMESTAMP(3) NOT NULL,
    "jenisKelamin" TEXT NOT NULL,
    "agama" TEXT NOT NULL,
    "statusPerkawinan" TEXT NOT NULL,
    "pendidikan" TEXT,
    "pekerjaan" TEXT,
    "hubunganDalamKeluarga" TEXT NOT NULL,
    "kepalaKeluargaId" INTEGER NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Penduduk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JenisSurat" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "namaSurat" TEXT NOT NULL,
    "deskripsi" TEXT,
    "templateFile" TEXT,

    CONSTRAINT "JenisSurat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PengajuanSurat" (
    "id" SERIAL NOT NULL,
    "pendudukId" INTEGER NOT NULL,
    "jenisSuratId" INTEGER NOT NULL,
    "status" "public"."StatusSurat" NOT NULL DEFAULT 'PENDING',
    "catatan" TEXT,
    "dataPermohonan" JSONB NOT NULL,
    "fileHasil" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processAt" TIMESTAMP(3),
    "processEnd" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PengajuanSurat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "KepalaKeluarga_noKk_key" ON "public"."KepalaKeluarga"("noKk");

-- CreateIndex
CREATE UNIQUE INDEX "Penduduk_nik_key" ON "public"."Penduduk"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "Penduduk_userId_key" ON "public"."Penduduk"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JenisSurat_kode_key" ON "public"."JenisSurat"("kode");

-- AddForeignKey
ALTER TABLE "public"."Rw" ADD CONSTRAINT "Rw_dukuhId_fkey" FOREIGN KEY ("dukuhId") REFERENCES "public"."Dukuh"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rt" ADD CONSTRAINT "Rt_rwId_fkey" FOREIGN KEY ("rwId") REFERENCES "public"."Rw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KepalaKeluarga" ADD CONSTRAINT "KepalaKeluarga_dukuhId_fkey" FOREIGN KEY ("dukuhId") REFERENCES "public"."Dukuh"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KepalaKeluarga" ADD CONSTRAINT "KepalaKeluarga_rwId_fkey" FOREIGN KEY ("rwId") REFERENCES "public"."Rw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KepalaKeluarga" ADD CONSTRAINT "KepalaKeluarga_rtId_fkey" FOREIGN KEY ("rtId") REFERENCES "public"."Rt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Penduduk" ADD CONSTRAINT "Penduduk_kepalaKeluargaId_fkey" FOREIGN KEY ("kepalaKeluargaId") REFERENCES "public"."KepalaKeluarga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Penduduk" ADD CONSTRAINT "Penduduk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PengajuanSurat" ADD CONSTRAINT "PengajuanSurat_pendudukId_fkey" FOREIGN KEY ("pendudukId") REFERENCES "public"."Penduduk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PengajuanSurat" ADD CONSTRAINT "PengajuanSurat_jenisSuratId_fkey" FOREIGN KEY ("jenisSuratId") REFERENCES "public"."JenisSurat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PengajuanSurat" ADD CONSTRAINT "PengajuanSurat_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
