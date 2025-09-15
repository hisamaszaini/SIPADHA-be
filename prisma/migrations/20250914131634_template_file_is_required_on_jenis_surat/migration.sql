/*
  Warnings:

  - Made the column `templateFile` on table `JenisSurat` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."JenisSurat" ALTER COLUMN "templateFile" SET NOT NULL;
