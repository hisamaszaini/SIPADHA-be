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

    console.log('✅ Seeding selesai: admin & pengurus');
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
