import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  highlights?: string;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsString()
  notes?: string;

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

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  venueId: string;

  @IsOptional()
  @IsString()
  hostName?: string;

  @IsInt()
  @Min(1)
  maxCapacity: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
