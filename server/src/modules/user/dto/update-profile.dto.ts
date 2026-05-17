import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';

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
}
