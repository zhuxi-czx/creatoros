import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import sharp = require('sharp');

// Recommended aspect ratios
const ASPECT_RATIOS = {
  banner: { width: 16, height: 9, maxWidth: 1200 },
  event: { width: 16, height: 9, maxWidth: 1200 },
  venue: { width: 4, height: 3, maxWidth: 800 },
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

  async processImage(filePath: string, type: string = 'default'): Promise<string> {
    const ratio = ASPECT_RATIOS[type] || ASPECT_RATIOS.default;
    const targetRatio = ratio.width / ratio.height;
    const maxWidth = ratio.maxWidth;

    const image = sharp(filePath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return filePath;
    }

    const currentRatio = metadata.width / metadata.height;
    let pipeline = sharp(filePath);

    // Center crop if aspect ratio differs by more than 5%
    if (Math.abs(currentRatio - targetRatio) / targetRatio > 0.05) {
      let cropWidth: number;
      let cropHeight: number;

      if (currentRatio > targetRatio) {
        // Image is too wide, crop width
        cropHeight = metadata.height;
        cropWidth = Math.round(metadata.height * targetRatio);
      } else {
        // Image is too tall, crop height
        cropWidth = metadata.width;
        cropHeight = Math.round(metadata.width / targetRatio);
      }

      pipeline = pipeline.resize(cropWidth, cropHeight, {
        fit: 'cover',
        position: 'centre',
      });
    }

    // Resize if too large
    if (metadata.width > maxWidth) {
      pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
    }

    // Compress and output as JPEG
    const outputPath = filePath.replace(/\.\w+$/, '.jpg');
    await pipeline
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(outputPath + '.tmp');

    // Replace original
    fs.unlinkSync(filePath);
    if (outputPath !== filePath && fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    fs.renameSync(outputPath + '.tmp', outputPath);

    return outputPath;
  }
}
