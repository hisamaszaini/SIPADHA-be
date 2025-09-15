-- DropForeignKey
ALTER TABLE "public"."KartuKeluarga" DROP CONSTRAINT "KartuKeluarga_kepalaPendudukId_fkey";

-- AlterTable
ALTER TABLE "public"."KartuKeluarga" ALTER COLUMN "kepalaPendudukId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."KartuKeluarga" ADD CONSTRAINT "KartuKeluarga_kepalaPendudukId_fkey" FOREIGN KEY ("kepalaPendudukId") REFERENCES "public"."Penduduk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
