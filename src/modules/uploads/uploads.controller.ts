import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MAX_UPLOAD_SIZE, UploadsService } from './uploads.service';
import type { StoredFile, UploadedFileMetadata } from './uploads.service';
import { UploadedFileResponseDto } from './dto/uploaded-file-response.dto';

const imageStorage = memoryStorage();

@ApiTags('Uploads')
@ApiBearerAuth('JWT')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @ApiOperation({
    summary: 'Uploader une image',
    description:
      'Enregistre une image (JPEG, PNG, WebP, GIF) et retourne son URL publique. ' +
      `Taille maximale : ${MAX_UPLOAD_SIZE / 1024 / 1024} Mo. ` +
      'Authentification JWT requise.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier image à uploader',
        },
      },
    },
  })
  @ApiCreatedResponse({
    type: UploadedFileResponseDto,
    description: 'Fichier enregistré avec succès',
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT manquant ou invalide' })
  @ApiBadRequestResponse({
    description: 'Fichier absent, type non autorisé ou taille dépassée',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: imageStorage,
      limits: { fileSize: MAX_UPLOAD_SIZE },
    }),
  )
  async uploadImage(
    @UploadedFile() file: StoredFile | undefined,
  ): Promise<UploadedFileMetadata> {
    return this.uploadsService.store(file);
  }
}
