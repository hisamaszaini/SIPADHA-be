-- AlterTable
ALTER TABLE "public"."PengajuanSurat" ADD COLUMN     "validatedById" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."PengajuanSurat" ADD CONSTRAINT "PengajuanSurat_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
