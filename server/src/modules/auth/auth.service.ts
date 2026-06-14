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

// access_token 进程内缓存（微信 access_token 有效期 ~7200s）
let accessTokenCache: { token: string; expireAt: number } | null = null;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /** 生成 11 位随机数字 UID（首位非 0）。 */
  private genUid(): string {
    let s = String(1 + Math.floor(Math.random() * 9));
    for (let i = 0; i < 10; i++) s += Math.floor(Math.random() * 10);
    return s;
  }

  /** 创建用户并分配全局唯一 UID；遇唯一冲突自动重试。 */
  private async createUser(data: any) {
    for (let i = 0; i < 6; i++) {
      try {
        return await this.prisma.user.create({
          data: { ...data, uid: this.genUid() },
        });
      } catch (e: any) {
        // P2002 = 唯一约束冲突（uid 撞号），重试
        if (e?.code === 'P2002' && i < 5) continue;
        throw e;
      }
    }
    // 理论不可达
    throw new InternalServerErrorException('生成用户编号失败');
  }

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
      user = await this.createUser({
        openId: wxSession.openid,
        unionId: wxSession.unionid || null,
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

  // 手机号快捷登录：wx.login 拿 openId + getPhoneNumber 的 code 换真实手机号
  async phoneLogin(loginCode: string, phoneCode: string) {
    const session = await this.jscode2session(loginCode);
    if (session.errcode || !session.openid) {
      throw new BadRequestException(`微信登录失败: ${session.errmsg || ''}`);
    }

    const accessToken = await this.getAccessToken();
    let phone: string | undefined;
    try {
      const resp = await fetch(
        `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: phoneCode }),
        },
      );
      const data: any = await resp.json();
      if (data.errcode === 0 && data.phone_info) {
        phone = data.phone_info.purePhoneNumber;
      } else {
        throw new BadRequestException(`获取手机号失败: ${data.errmsg || data.errcode}`);
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new InternalServerErrorException('获取手机号失败');
    }

    let user = await this.prisma.user.findUnique({ where: { openId: session.openid } });
    if (!user) {
      user = await this.createUser({
        openId: session.openid,
        unionId: session.unionid || null,
        phone,
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          phone,
          ...(session.unionid && !user.unionId ? { unionId: session.unionid } : {}),
        },
      });
    }

    if (user.status === 'DISABLED') {
      throw new UnauthorizedException('User account is disabled');
    }

    const token = this.generateToken(user.id, user.role);
    return { accessToken: token, user: this.sanitizeUser(user) };
  }

  private async jscode2session(code: string): Promise<WxSession> {
    const appId = process.env.WX_APP_ID;
    const appSecret = process.env.WX_APP_SECRET;
    if (!appId || !appSecret) {
      throw new InternalServerErrorException('WeChat app credentials not configured');
    }
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
    try {
      const response = await fetch(url);
      return (await response.json()) as WxSession;
    } catch (error) {
      throw new InternalServerErrorException('Failed to connect to WeChat API');
    }
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (accessTokenCache && accessTokenCache.expireAt > now) {
      return accessTokenCache.token;
    }
    const appId = process.env.WX_APP_ID;
    const appSecret = process.env.WX_APP_SECRET;
    const resp = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`,
    );
    const data: any = await resp.json();
    if (!data.access_token) {
      throw new InternalServerErrorException(`获取 access_token 失败: ${data.errmsg || data.errcode}`);
    }
    accessTokenCache = {
      token: data.access_token,
      expireAt: now + (data.expires_in - 300) * 1000,
    };
    return data.access_token;
  }

  async adminLogin(adminLoginDto: AdminLoginDto) {
    const { username, password } = adminLoginDto;

    const adminUsername = 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) throw new Error('ADMIN_PASSWORD must be set');

    if (username !== adminUsername || password !== adminPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Find or create admin user
    let adminUser = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      adminUser = await this.createUser({
        openId: `admin_${Date.now()}`,
        nickname: 'Admin',
        role: 'ADMIN',
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
