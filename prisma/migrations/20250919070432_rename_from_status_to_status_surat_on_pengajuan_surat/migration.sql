/*
  Warnings:

  - You are about to drop the column `status` on the `PengajuanSurat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."PengajuanSurat" DROP COLUMN "status",
ADD COLUMN     "statusSurat" "public"."StatusSurat" NOT NULL DEFAULT 'PENDING';
