import { Controller, Get, Param, Query, Res, Header } from '@nestjs/common';
import type { Response } from 'express';
import { listIconNames, iconSvg } from '../../common/lucide-icons';

@Controller()
export class IconController {
  /** 全量图标名列表（后台搜索选择用）。 */
  @Get('api/icons')
  @Header('Cache-Control', 'public, max-age=86400')
  list() {
    return listIconNames();
  }

  /** 单个图标 SVG（后台预览用），可传 color。 */
  @Get('api/icon/:name')
  icon(
    @Param('name') name: string,
    @Query('color') color: string,
    @Res() res: Response,
  ) {
    try {
      const svg = iconSvg(name.replace(/\.svg$/, ''), color || '#666');
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(svg);
    } catch {
      res.status(404).send('');
    }
  }
}
