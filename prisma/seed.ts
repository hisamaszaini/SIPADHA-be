import { PrismaClient } from '@prisma/client';
import { hash } from '../src/modules/auth/auth.util';

const prisma = new PrismaClient();

async function main() {
    const hashedPasswordAdmin = await hash("admin123");
    const hashedPasswordPengurus = await hash("pengurus123");

    // Seeder Admin
    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            noHp: '+6285755557114',
            email: 'admin@example.com',
            username: 'admin',
            password: hashedPasswordAdmin,
            role: 'ADMIN',
        },
    });

    // Seeder Pengurus
    await prisma.user.upsert({
        where: { email: 'pengurus@example.com' },
        update: {},
        create: {
            noHp: '+6285755557113',
            email: 'pengurus@example.com',
            username: 'pengurus',
            password: hashedPasswordPengurus,
            role: 'PENGURUS',
        },
    });

    console.log('✅ Seeding: admin & pengurus');

    const setting = await prisma.setting.findFirst();

    if (!setting) {
        await prisma.setting.create({
            data: {
                namaKepdes: "Nama Default",
                nikKepdes: "3509010101010001",
                jenisKelaminKepdes: "Laki-laki",
                alamatKepdes: "Jl. Raya Desa",
                tempatLahirKepdes: "Ponorogo",
                tanggalLahirKepdes: new Date("1970-01-01"),
                endPointWa: "http://localhost:3000/api/wa",
            },
        });
        console.log("✅ Default Setting berhasil dibuat");
    } else {
        console.log("⚠️ Setting sudah ada, skip seeding");
    }

    await prisma.dukuh.create({
        data: {
            nama: 'Jati',
        }
    });

    await prisma.rw.create({
        data: {
            nomor: "01",
            dukuhId: 1,
        }
    });

    await prisma.rt.create({
        data: {
            nomor: "01",
            rwId: 1,
        }
    });

    const jenisSurat = [
        {
            kode: "KETERANGAN_USAHA",
            namaSurat: "Surat Keterangan Usaha",
            deskripsi: "Surat keterangan usaha yang dikeluarkan oleh desa.",
            deletable: false,
            templateFile: "keterangan_usaha.docx",
        },
        {
            kode: "KETERANGAN_TIDAK_MAMPU_SEKOLAH",
            namaSurat: "Surat Keterangan Tidak Mampu (Sekolah)",
            deskripsi: "Surat keterangan tidak mampu untuk keperluan sekolah.",
            deletable: false,
            templateFile: "ktm_sekolah.docx",
        },
        {
            kode: "KETERANGAN_SUAMI_ISTRI_KELUAR_NEGERI",
            namaSurat: "Surat Keterangan Suami/Istri Keluar Negeri",
            deskripsi: "Surat keterangan suami/istri untuk keperluan administrasi.",
            deletable: false,
            templateFile: "suami_istri_keluar_negeri.docx",
        },
        {
            kode: "KETERANGAN_TIDAK_MEMILIKI_MOBIL",
            namaSurat: "Surat Keterangan Tidak Memiliki Mobil",
            deskripsi: "Surat keterangan untuk menyatakan tidak memiliki mobil.",
            deletable: false,
            templateFile: "tidak_memiliki_mobil.docx",
        },
        {
            kode: "KETERANGAN_PROFESI",
            namaSurat: "Surat Keterangan Profesi",
            deskripsi: "Surat keterangan terkait profesi warga.",
            deletable: false,
            templateFile: "profesi.docx",
        },
        {
            kode: "KETERANGAN_DOMISILI",
            namaSurat: "Surat Keterangan Domisili",
            deskripsi: "Surat keterangan domisili tempat tinggal.",
            deletable: false,
            templateFile: "domisili.docx",
        },
    ];

    for (const surat of jenisSurat) {
        await prisma.jenisSurat.upsert({
            where: { kode: surat.kode },
            update: surat,
            create: surat,
        });
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
