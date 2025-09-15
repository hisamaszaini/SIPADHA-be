/*
  Warnings:

  - Added the required column `alamat` to the `KepalaKeluarga` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."KepalaKeluarga" ADD COLUMN     "alamat" TEXT NOT NULL;
