import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { AppConfig } from '../../config/configuration';

export interface UploadedFileMetadata {
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export interface StoredFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 Mo

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;
  private readonly publicUrl: string;
  private readonly cloudinaryConfig: AppConfig['uploads']['cloudinary'];

  constructor(configService: ConfigService) {
    const uploads = configService.getOrThrow<AppConfig['uploads']>('uploads');
    this.uploadDir = uploads.directory;
    this.publicUrl = uploads.publicUrl;
    this.cloudinaryConfig = uploads.cloudinary;

    if (this.cloudinaryConfig.enabled) {
      cloudinary.config({
        cloud_name: this.cloudinaryConfig.cloudName,
        api_key: this.cloudinaryConfig.apiKey,
        api_secret: this.cloudinaryConfig.apiSecret,
      });
      this.logger.log('Cloudinary upload enabled');
    }
  }

  onModuleInit(): void {
    if (!this.cloudinaryConfig.enabled) {
      this.ensureUploadDir();
    }
  }

  ensureUploadDir(): void {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory created: ${this.uploadDir}`);
    }
  }

  isAllowedMimeType(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.has(mimeType);
  }

  async store(file: StoredFile | undefined): Promise<UploadedFileMetadata> {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu (champ "file")');
    }

    if (!this.isAllowedMimeType(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé : ${file.mimetype}. ` +
          'Types acceptés : jpeg, png, webp, gif.',
      );
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      throw new BadRequestException(
        `Fichier trop volumineux (max ${MAX_UPLOAD_SIZE / 1024 / 1024} Mo)`,
      );
    }

    if (this.cloudinaryConfig.enabled) {
      return this.storeOnCloudinary(file);
    }

    return this.storeOnDisk(file);
  }

  private storeOnDisk(file: StoredFile): UploadedFileMetadata {
    this.ensureUploadDir();

    const extension = EXTENSIONS[file.mimetype] ?? '.bin';
    const filename = `${Date.now()}-${randomBytes(6).toString('hex')}${extension}`;

    writeFileSync(join(this.uploadDir, filename), file.buffer);

    return {
      url: `${this.publicUrl}/${filename}`,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  private storeOnCloudinary(file: StoredFile): Promise<UploadedFileMetadata> {
    const extension = EXTENSIONS[file.mimetype] ?? '';
    const publicId = `${Date.now()}-${randomBytes(6).toString('hex')}${extension}`;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: this.cloudinaryConfig.folder,
          public_id: publicId,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new BadRequestException(
                error?.message ?? 'Échec de l’upload Cloudinary',
              ),
            );
            return;
          }

          resolve({
            url: result.secure_url,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
          });
        },
      );

      stream.end(file.buffer);
    });
  }
}
