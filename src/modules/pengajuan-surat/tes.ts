import { fullCreatePengajuanSuratSchema } from './dto/pengajuan-surat.dto'; // Sesuaikan path ke file DTO Anda

// Data yang seharusnya GAGAL validasi
const dataGagal = {
  pendudukId: '1', // Ingat, input awal adalah string
  jenis: 'KETERANGAN_USAHA',
  pertanian: '',
  perdagangan: '',
  peternakan: '',
  perindustrian: '',
  jasa: '',
  lain: '',
};

// Data yang seharusnya LOLOS validasi
const dataLolos = {
    pendudukId: '2',
    jenis: 'KETERANGAN_USAHA',
    pertanian: '',
    perdagangan: 'Ada isinya', // Salah satu diisi
    peternakan: '',
    perindustrian: '',
    jasa: '',
    lain: '',
};

console.log('--- Menguji Data yang Seharusnya GAGAL ---');
const hasilGagal = fullCreatePengajuanSuratSchema.safeParse(dataGagal);
if (!hasilGagal.success) {
  console.log('✅ BERHASIL GAGAL! Skema bekerja dengan benar.');
  console.log(hasilGagal.error.flatten());
} else {
  console.log('❌ KESALAHAN! Skema seharusnya gagal tapi malah lolos.');
}

console.log('\n--- Menguji Data yang Seharusnya LOLOS ---');
const hasilLolos = fullCreatePengajuanSuratSchema.safeParse(dataLolos);
if (hasilLolos.success) {
  console.log('✅ BERHASIL LOLOS! Skema bekerja dengan benar.');
  console.log('Data yang divalidasi:', hasilLolos.data);
} else {
  console.log('❌ KESALAHAN! Skema seharusnya lolos tapi malah gagal.');
  console.log(hasilLolos.error.flatten());
}