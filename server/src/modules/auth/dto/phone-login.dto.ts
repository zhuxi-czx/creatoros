import { IsString, IsNotEmpty } from 'class-validator';

export class PhoneLoginDto {
  @IsString()
  @IsNotEmpty()
  loginCode: string; // wx.login 的 code（换 openId）

  @IsString()
  @IsNotEmpty()
  phoneCode: string; // getPhoneNumber 按钮回调的 code（换手机号）
}
