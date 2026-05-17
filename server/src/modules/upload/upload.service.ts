import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Ensure the uploads directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getFileUrl(filename: string): string {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    return `${baseUrl}/uploads/${filename}`;
  }
}
