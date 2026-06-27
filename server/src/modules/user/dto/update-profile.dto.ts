import { IsString, IsOptional, IsArray, ArrayMaxSize, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  gender?: string; // 男 / 女 / 其他（2.0）

  @IsOptional()
  @IsString()
  mbti?: string;

  @IsOptional()
  @IsString()
  zodiac?: string;

  @IsOptional()
  @IsString()
  generation?: string;

  // phone 不在此处更新：仅通过微信换码登录(phoneLogin)绑定，避免被任意篡改

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(30, { each: true })
  tags?: string[]; // 自定义个性标签（2.0）

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(30, { each: true })
  statuses?: string[]; // 用户状态（多选）
}
