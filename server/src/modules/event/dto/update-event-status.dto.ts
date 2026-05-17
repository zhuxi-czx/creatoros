import { IsEnum } from 'class-validator';

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  FULL = 'FULL',
  ONGOING = 'ONGOING',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export class UpdateEventStatusDto {
  @IsEnum(EventStatus)
  status: EventStatus;
}
