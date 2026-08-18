import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MAX_UPLOAD_SIZE, UploadsService } from './uploads.service';
import type { StoredFile, UploadedFileMetadata } from './uploads.service';

const imageStorage = memoryStorage();

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: imageStorage,
      limits: { fileSize: MAX_UPLOAD_SIZE },
    }),
  )
  uploadImage(
    @UploadedFile() file: StoredFile | undefined,
  ): UploadedFileMetadata {
    return this.uploadsService.store(file);
  }
}
