import { ApiProperty } from '@nestjs/swagger';

export class UploadedFileResponseDto {
  @ApiProperty({
    example: '/uploads/1724678400000-a1b2c3d4e5f6.jpg',
    description: 'URL publique du fichier uploadé',
  })
  url: string;

  @ApiProperty({ example: 'restaurant-cover.jpg' })
  originalName: string;

  @ApiProperty({ example: 245_760, description: 'Taille en octets' })
  size: number;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;
}
