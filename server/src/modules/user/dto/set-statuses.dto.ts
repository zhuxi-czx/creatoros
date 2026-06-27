import { IsArray, IsString, ArrayMaxSize, MaxLength } from 'class-validator';

export class SetStatusesDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  statuses: string[];
}
