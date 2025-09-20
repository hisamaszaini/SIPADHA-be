-- AlterTable
ALTER TABLE "public"."Penduduk" ADD COLUMN     "kewargaan" TEXT NOT NULL DEFAULT 'WNI';

-- CreateTable
CREATE TABLE "public"."Setting" (
    "id" SERIAL NOT NULL,
    "namaKepdes" TEXT NOT NULL,
    "nikKepdes" TEXT NOT NULL,
    "jenisKelaminKepdes" TEXT NOT NULL,
    "alamatKepdes" TEXT NOT NULL,
    "tempatLahirKepdes" TEXT NOT NULL,
    "tanggalLahirKepdes" TIMESTAMP(3) NOT NULL,
    "endPointWa" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);
