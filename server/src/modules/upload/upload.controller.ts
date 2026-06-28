import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import * as path from 'path';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(JwtAuthGuard)
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: path.join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('仅支持 JPG、PNG、GIF、WebP 格式的图片'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type?: string,
  ) {
    if (!file) {
      throw new BadRequestException('请上传图片文件');
    }

    const { mainPath, thumbPath } = await this.uploadService.processImage(
      file.path,
      type || 'default',
    );

    const mainFilename = path.basename(mainPath);
    const thumbFilename = path.basename(thumbPath);

    return {
      url: this.uploadService.getFileUrl(mainFilename),
      thumbUrl: this.uploadService.getFileUrl(thumbFilename),
      filename: mainFilename,
      originalName: file.originalname,
      size: file.size,
      mimeType: 'image/webp',
    };
  }

  /** 分享卡片专用 JPG（微信分享不渲染 WebP）。按需把 webp 转 jpg 返回。 */
  @Get('share-jpg/:name')
  async shareJpg(@Param('name') name: string, @Res() res: Response) {
    const jpg = await this.uploadService.getShareJpg(name);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.sendFile(jpg);
  }
}
