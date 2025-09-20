import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { settingDto } from './dto/setting.dto';

@Injectable()
export class SettingService {
    constructor(private prisma: PrismaService) { }

    async find() {
        const setting = await this.prisma.setting.findFirst();
        if (!setting) {
            throw new NotFoundException('Data setting belum ada');
        }
        return setting;
    }

    async update(data: settingDto) {
        const setting = await this.prisma.setting.findFirst();

        if (!setting) {
            throw new NotFoundException('Data setting belum ada');
        }

        return this.prisma.setting.update({
            where: { id: setting.id },
            data: {
                ...data,
                tanggalLahirKepdes: new Date(data.tanggalLahirKepdes),
            },
        });
    }

}
