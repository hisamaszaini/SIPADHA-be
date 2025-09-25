/*
  Warnings:

  - A unique constraint covering the columns `[nama]` on the table `Dukuh` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nomor,rwId]` on the table `Rt` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nomor,dukuhId]` on the table `Rw` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Dukuh_nama_key" ON "public"."Dukuh"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Rt_nomor_rwId_key" ON "public"."Rt"("nomor", "rwId");

-- CreateIndex
CREATE UNIQUE INDEX "Rw_nomor_dukuhId_key" ON "public"."Rw"("nomor", "dukuhId");
