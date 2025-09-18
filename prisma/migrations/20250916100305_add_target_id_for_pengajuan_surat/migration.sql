/*
  Warnings:

  - Added the required column `jenis` to the `PengajuanSurat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."PengajuanSurat" DROP CONSTRAINT "PengajuanSurat_jenisSuratId_fkey";

-- AlterTable
ALTER TABLE "public"."PengajuanSurat" ADD COLUMN     "jenis" TEXT NOT NULL,
ADD COLUMN     "targetId" INTEGER,
ALTER COLUMN "jenisSuratId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."PengajuanSurat" ADD CONSTRAINT "PengajuanSurat_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "public"."Penduduk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PengajuanSurat" ADD CONSTRAINT "PengajuanSurat_jenisSuratId_fkey" FOREIGN KEY ("jenisSuratId") REFERENCES "public"."JenisSurat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
