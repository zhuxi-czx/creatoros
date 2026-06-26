import { IsString, IsNotEmpty } from 'class-validator';

export class AddSignupDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
