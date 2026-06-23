import { Controller, Get, Param } from '@nestjs/common';
import { CreatorService } from './creator.service';

@Controller()
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  /** 主推 Creator 列表（首页 / Creator 频道页）。 */
  @Get('api/creators')
  async listCreators() {
    return this.creatorService.listCreators();
  }

  /** Creator 详情 + 其内容列表（人物详情页）。 */
  @Get('api/creators/:id')
  async getCreator(@Param('id') id: string) {
    return this.creatorService.getCreator(id);
  }
}
