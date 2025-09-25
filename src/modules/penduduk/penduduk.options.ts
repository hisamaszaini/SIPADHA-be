// Mapping status & pendidikan
export const statusMapping: Record<string, string> = {
    'KAWIN': 'Kawin',
    'BLM.KAWIN': 'Belum Kawin',
    'CERAI MATI': 'Cerai Mati',
    'CERAI HIDUP': 'Cerai Hidup'
};

export const pendidikanMapping: Record<string, string> = {
    'SLTA/SEDERAJAT': 'SMA/SMK',
    'SLTP/SEDERAJAT': 'SMP',
    'TDK/BLM. SEKOLAH': 'Tidak/Belum Sekolah',
    'TAMAT SD/SDRJT': 'SD',
    'BLM. TAMAT SD/SDRJT': 'Tidak/Belum Sekolah',
    'DIPL.IV/S1': 'D4/S1',
    'AKDM/DIPL.III/SRJN, MUDA': 'D3'
};

export const jkMapping: Record<string, string> = {
    'LK': 'Laki-laki',
    'PR': 'Perempuan'
};

export const agamaMapping: Record<string, string> = {
    'ISLAM': 'Islam',
    'KRISTEN': 'Kristen'
};

export const shdkMapping: Record<string, string> = {
    'KEP. KELUARGA': 'Kepala Keluarga',
    'ISTRI': 'Istri',
    'ANAK': 'Anak',
    'FAMILI LAIN': 'Famili Lain',
    'CUCU': 'Cucu',
    'ORANG TUA': 'Orang Tua',
    'MERTUA': 'Mertua',
    'MENANTU': 'Menantu',
    'LAINNYA': 'Lainnya',
};