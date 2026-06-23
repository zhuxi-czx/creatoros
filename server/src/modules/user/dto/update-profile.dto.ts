import { IsString, IsOptional, IsInt, Min, Max, IsArray } from 'class-validator';

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
  @IsInt()
  @Min(0)
  @Max(2)
  gender?: number;

  @IsOptional()
  @IsString()
  mbti?: string;

  @IsOptional()
  @IsString()
  zodiac?: string;

  @IsOptional()
  @IsString()
  generation?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // —— Creator 资料（仅 isCreator 用户填写生效）——
  @IsOptional()
  @IsString()
  creatorTitle?: string;

  @IsOptional()
  @IsString()
  creatorTagline?: string;

  @IsOptional()
  @IsString()
  creatorIntro?: string;

  @IsOptional()
  @IsString()
  creatorCoverUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  creatorTags?: string[];
}
