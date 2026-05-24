import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import sharp = require('sharp');

const ASPECT_RATIOS = {
  banner: { width: 16, height: 9, maxWidth: 1200 },
  event: { width: 16, height: 9, maxWidth: 1200 },
  venue: { width: 4, height: 3, maxWidth: 900 },
  avatar: { width: 1, height: 1, maxWidth: 400 },
  default: { width: 16, height: 9, maxWidth: 1200 },
};

@Injectable()
export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getFileUrl(filename: string): string {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    return `${baseUrl}/uploads/${filename}`;
  }

  async processImage(filePath: string, type: string = 'default'): Promise<{ mainPath: string; thumbPath: string }> {
    try {
      const ratio = ASPECT_RATIOS[type] || ASPECT_RATIOS.default;
      const targetRatio = ratio.width / ratio.height;
      const maxWidth = ratio.maxWidth;

      const metadata = await sharp(filePath).metadata();

      if (!metadata.width || !metadata.height) {
        return { mainPath: filePath, thumbPath: filePath };
      }

      // Build crop+resize pipeline
      const currentRatio = metadata.width / metadata.height;
      let cropWidth = metadata.width;
      let cropHeight = metadata.height;

      if (Math.abs(currentRatio - targetRatio) / targetRatio > 0.05) {
        if (currentRatio > targetRatio) {
          cropHeight = metadata.height;
          cropWidth = Math.round(metadata.height * targetRatio);
        } else {
          cropWidth = metadata.width;
          cropHeight = Math.round(metadata.width / targetRatio);
        }
      }

      const baseName = path.basename(filePath).replace(/\.\w+$/, '');

      // Main image: WebP format, quality 78
      const mainFile = path.join(this.uploadDir, `${baseName}.webp`);
      await sharp(filePath)
        .resize(cropWidth, cropHeight, { fit: 'cover', position: 'centre' })
        .resize(maxWidth, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(mainFile);

      // Thumbnail: 20px wide, blurred, WebP, ~1-2KB
      const thumbFile = path.join(this.uploadDir, `${baseName}_thumb.webp`);
      await sharp(filePath)
        .resize(cropWidth, cropHeight, { fit: 'cover', position: 'centre' })
        .resize(20, null, { withoutEnlargement: true })
        .blur(2)
        .webp({ quality: 50 })
        .toFile(thumbFile);

      // Remove original
      fs.unlinkSync(filePath);

      return { mainPath: mainFile, thumbPath: thumbFile };
    } catch (error) {
      console.error('Image processing failed, using original file:', error);
      return { mainPath: filePath, thumbPath: filePath };
    }
  }
}
