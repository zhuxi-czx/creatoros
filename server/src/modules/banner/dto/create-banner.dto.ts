import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, IsArray, Min } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];

  @IsOptional()
  @IsBoolean()
  autoplay?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1000)
  interval?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
