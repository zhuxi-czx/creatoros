import { IsString, IsOptional, IsNumber, IsArray, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateVenueDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsBoolean()
  autoplay?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1000)
  interval?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
