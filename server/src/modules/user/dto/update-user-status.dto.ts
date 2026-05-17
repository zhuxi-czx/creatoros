import { IsEnum } from 'class-validator';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}
