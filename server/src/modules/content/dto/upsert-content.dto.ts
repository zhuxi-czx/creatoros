import { IsString, IsOptional, IsNotEmpty, IsIn } from 'class-validator';

export class UpsertContentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string; // 富文本 HTML

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsString()
  @IsNotEmpty()
  creatorId: string; // 对谈对象（必关联 Creator）

  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED'])
  status?: 'DRAFT' | 'PUBLISHED';
}
