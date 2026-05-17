import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsBoolean,
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
  coverUrl?: string;

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
