/*
  Warnings:

  - You are about to drop the column `kepalaKeluargaId` on the `Penduduk` table. All the data in the column will be lost.
  - You are about to drop the `KepalaKeluarga` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `kartuKeluargaId` to the `Penduduk` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."KepalaKeluarga" DROP CONSTRAINT "KepalaKeluarga_dukuhId_fkey";

-- DropForeignKey
ALTER TABLE "public"."KepalaKeluarga" DROP CONSTRAINT "KepalaKeluarga_rtId_fkey";

-- DropForeignKey
ALTER TABLE "public"."KepalaKeluarga" DROP CONSTRAINT "KepalaKeluarga_rwId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Penduduk" DROP CONSTRAINT "Penduduk_kepalaKeluargaId_fkey";

-- AlterTable
ALTER TABLE "public"."Penduduk" DROP COLUMN "kepalaKeluargaId",
ADD COLUMN     "kartuKeluargaId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."KepalaKeluarga";

-- CreateTable
CREATE TABLE "public"."KartuKeluarga" (
    "id" SERIAL NOT NULL,
    "noKk" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "dukuhId" INTEGER NOT NULL,
    "rwId" INTEGER NOT NULL,
    "rtId" INTEGER NOT NULL,
    "kepalaPendudukId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KartuKeluarga_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KartuKeluarga_noKk_key" ON "public"."KartuKeluarga"("noKk");

-- CreateIndex
CREATE UNIQUE INDEX "KartuKeluarga_kepalaPendudukId_key" ON "public"."KartuKeluarga"("kepalaPendudukId");

-- AddForeignKey
ALTER TABLE "public"."KartuKeluarga" ADD CONSTRAINT "KartuKeluarga_dukuhId_fkey" FOREIGN KEY ("dukuhId") REFERENCES "public"."Dukuh"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KartuKeluarga" ADD CONSTRAINT "KartuKeluarga_rwId_fkey" FOREIGN KEY ("rwId") REFERENCES "public"."Rw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KartuKeluarga" ADD CONSTRAINT "KartuKeluarga_rtId_fkey" FOREIGN KEY ("rtId") REFERENCES "public"."Rt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KartuKeluarga" ADD CONSTRAINT "KartuKeluarga_kepalaPendudukId_fkey" FOREIGN KEY ("kepalaPendudukId") REFERENCES "public"."Penduduk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Penduduk" ADD CONSTRAINT "Penduduk_kartuKeluargaId_fkey" FOREIGN KEY ("kartuKeluargaId") REFERENCES "public"."KartuKeluarga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
