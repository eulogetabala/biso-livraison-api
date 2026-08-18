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
  'image/svg+xml',
]);

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 Mo

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;
  private readonly publicUrl: string;

  constructor(configService: ConfigService) {
    const uploads = configService.getOrThrow<AppConfig['uploads']>('uploads');
    this.uploadDir = uploads.directory;
    this.publicUrl = uploads.publicUrl;
  }

  onModuleInit(): void {
    this.ensureUploadDir();
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

  /**
   * Enregistre le fichier sur disque et retourne l'URL publique.
   * Le nom de fichier est généré de façon aléatoire (pas de confiance
   * dans le nom original fourni par le client).
   */
  store(file: StoredFile | undefined): UploadedFileMetadata {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu (champ "file")');
    }

    if (!this.isAllowedMimeType(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé : ${file.mimetype}. ` +
          'Types acceptés : jpeg, png, webp, gif, svg.',
      );
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      throw new BadRequestException(
        `Fichier trop volumineux (max ${MAX_UPLOAD_SIZE / 1024 / 1024} Mo)`,
      );
    }

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
}
