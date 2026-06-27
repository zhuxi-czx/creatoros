import { IsArray, IsString } from 'class-validator';

export class SetStatusesDto {
  @IsArray()
  @IsString({ each: true })
  statuses: string[];
}
