import { IsString, IsOptional, IsInt, IsBoolean, IsNotEmpty } from 'class-validator';

export class UpsertCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  intro?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  memberFreeMonthly?: boolean; // 「群友聚会」类：会员每月免费 1 场
}
