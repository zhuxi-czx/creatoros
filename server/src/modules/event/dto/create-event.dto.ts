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
  @IsString()
  priceNote?: string; // 费用说明文案（解释价格包含什么）

  @IsOptional()
  @IsInt()
  @Min(0)
  earlyBirdPrice?: number; // 早鸟价（分），与 earlyBirdQuota 同时配置才生效

  @IsOptional()
  @IsInt()
  @Min(0)
  earlyBirdQuota?: number; // 早鸟名额（前 X 名）

  @IsOptional()
  @IsBoolean()
  featured?: boolean; // 社区精选

  @IsOptional()
  @IsString()
  categoryId?: string; // 分类

  @IsOptional()
  @IsBoolean()
  isPlanfExclusive?: boolean; // PlanF 专享

  @IsOptional()
  @IsBoolean()
  isGuestShare?: boolean; // 大咖分享

  @IsOptional()
  @IsString()
  guestName?: string; // 大咖名称
}
