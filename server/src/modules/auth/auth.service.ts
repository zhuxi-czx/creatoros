import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { WxLoginDto } from './dto/wx-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

interface WxSession {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async wxLogin(wxLoginDto: WxLoginDto) {
    const { code } = wxLoginDto;

    const appId = process.env.WX_APP_ID;
    const appSecret = process.env.WX_APP_SECRET;

    if (!appId || !appSecret) {
      throw new InternalServerErrorException('WeChat app credentials not configured');
    }

    // Call WeChat API to exchange code for openId
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

    let wxSession: WxSession;
    try {
      const response = await fetch(url);
      wxSession = (await response.json()) as WxSession;
    } catch (error) {
      throw new InternalServerErrorException('Failed to connect to WeChat API');
    }

    if (wxSession.errcode) {
      throw new BadRequestException(`WeChat login failed: ${wxSession.errmsg}`);
    }

    if (!wxSession.openid) {
      throw new BadRequestException('Failed to get openId from WeChat');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { openId: wxSession.openid },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          openId: wxSession.openid,
          unionId: wxSession.unionid || null,
        },
      });
    } else if (wxSession.unionid && !user.unionId) {
      // Update unionId if we now have it
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { unionId: wxSession.unionid },
      });
    }

    if (user.status === 'DISABLED') {
      throw new UnauthorizedException('User account is disabled');
    }

    const token = this.generateToken(user.id, user.role);

    return {
      accessToken: token,
      user: this.sanitizeUser(user),
    };
  }

  async adminLogin(adminLoginDto: AdminLoginDto) {
    const { username, password } = adminLoginDto;

    const adminUsername = 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username !== adminUsername || password !== adminPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Find or create admin user
    let adminUser = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      adminUser = await this.prisma.user.create({
        data: {
          openId: `admin_${Date.now()}`,
          nickname: 'Admin',
          role: 'ADMIN',
        },
      });
    }

    const token = this.generateToken(adminUser.id, adminUser.role);

    return {
      accessToken: token,
      user: this.sanitizeUser(adminUser),
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  private generateToken(userId: string, role: string): string {
    const payload = { sub: userId, role };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    const { openId, unionId, ...rest } = user;
    return rest;
  }
}
