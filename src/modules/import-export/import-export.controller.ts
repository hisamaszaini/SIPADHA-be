import {
    BadRequestException,
    Controller,
    HttpCode,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    Logger,
    HttpStatus,
    Get,
    Param
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('import-export')
export class ImportExportController {
    private readonly logger = new Logger(ImportExportController.name);
    private readonly queue: Queue;

    constructor() {
        const connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });
        this.queue = new Queue('import-excel', { connection });
    }

    @Roles('ADMIN', 'PENGURUS')
    @Post()
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
        fileFilter: (req, file, cb) => {
            if (file.mimetype.includes('sheet') || file.originalname.match(/\.(xlsx|xls)$/)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('File harus berformat Excel (.xlsx atau .xls)'), false);
            }
        }
    }))
    @HttpCode(HttpStatus.OK)
    async enqueueImport(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File tidak ditemukan');

        const uploadDir = path.join(process.cwd(), 'uploads', 'tmp');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const filename = `${uuidv4()}_${file.originalname}`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, file.buffer);

        const job = await this.queue.add('import-job', { filePath }, {
            removeOnComplete: true,
            removeOnFail: true
        });

        return { jobId: job.id, message: 'Import job telah diantrikan' };
    }

    // @Post()
    // @UseInterceptors(FileInterceptor('file', {
    //     limits: { fileSize: 50 * 1024 * 1024 },
    //     fileFilter: (req, file, cb) => {
    //         if (file.mimetype.includes('sheet') || file.mimetype.includes('excel') ||
    //             file.originalname.match(/\.(xlsx|xls)$/)) {
    //             cb(null, true);
    //         } else {
    //             cb(new BadRequestException('File harus berformat Excel (.xlsx atau .xls)'), false);
    //         }
    //     }
    // }))
    // @HttpCode(HttpStatus.OK)
    // async enqueueImport(@UploadedFile() file: Express.Multer.File) {
    //     if (!file) {
    //         throw new BadRequestException('File tidak ditemukan');
    //     }

    //     this.logger.log(`📥 File diterima: ${file.originalname}, size: ${file.size} bytes`);

    //     const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    //     const sheetName = workbook.SheetNames[0];
    //     if (!sheetName) throw new BadRequestException('File Excel tidak memiliki sheet');

    //     const worksheet = workbook.Sheets[sheetName];
    //     const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'dd-mm-yyyy' });
    //     if (!data || data.length === 0) throw new BadRequestException('File Excel kosong');

    //     this.logger.log(`Excel parsed: ${data.length} rows`);

    //     const job = await this.queue.add('import-job', { rows: data }, {
    //         removeOnComplete: 3,
    //         removeOnFail: 3,
    //     });

    //     return { jobId: job.id, message: 'Import job telah diantrikan' };
    // }

    @Get()
    async getJobHistory() {
        const completed = await this.queue.getJobs(['completed'], 0, 2, false);
        const failed = await this.queue.getJobs(['failed'], 0, 2, false);

        const jobs = [...completed, ...failed]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 3)
            .map(job => ({
                id: job.id,
                state: job.finishedOn ? 'completed' : job.failedReason ? 'failed' : 'active',
                progress: job.progress,
                result: job.returnvalue,
                failedReason: job.failedReason,
                timestamp: job.timestamp,
            }));

        return { success: true, data: jobs };
    }

    @Get(':jobId/status')
    async getJobStatus(@Param('jobId') jobId: string) {
        const job = await this.queue.getJob(jobId);
        if (!job) return { status: 'not_found' };

        const state = await job.getState();
        return {
            id: job.id,
            state,
            progress: job.progress,
            result: job.returnvalue,
            failedReason: job.failedReason,
        };
    }
}
