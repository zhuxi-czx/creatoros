import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import * as fs from 'fs';
import WxPay from 'wechatpay-node-v3';

/**
 * 微信支付 APIv3 封装（JSAPI / 小程序支付）。
 *
 * 懒加载：商户号未配置时不初始化、不报错，保证服务正常启动。
 * 仅当真正发起支付/验签时才校验配置，缺失则抛 503，免费报名链路完全不受影响。
 *
 * 依赖环境变量（见 docs/wechat-pay-design.md §8，商户号下来后填）：
 *   WX_APP_ID                小程序 appid（复用登录用的）
 *   WX_PAY_MCH_ID            商户号
 *   WX_PAY_API_V3_KEY        APIv3 密钥
 *   WX_PAY_SERIAL_NO         商户证书序列号
 *   WX_PAY_CERT_PATH         商户证书 apiclient_cert.pem 路径
 *   WX_PAY_PRIVATE_KEY_PATH  商户私钥 apiclient_key.pem 路径
 *   WX_PAY_NOTIFY_URL        支付结果回调（必须 HTTPS 已备案域名）
 */
export interface JsapiPayParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
}

export interface NotifyResource {
  out_trade_no: string;
  transaction_id: string;
  trade_state: string;
  [key: string]: any;
}

@Injectable()
export class WechatPayService {
  private readonly logger = new Logger(WechatPayService.name);
  private pay: WxPay | null = null;
  private apiV3Key = '';
  private notifyUrl = '';

  isConfigured(): boolean {
    return !!(
      process.env.WX_APP_ID &&
      process.env.WX_PAY_MCH_ID &&
      process.env.WX_PAY_API_V3_KEY &&
      process.env.WX_PAY_SERIAL_NO &&
      process.env.WX_PAY_CERT_PATH &&
      process.env.WX_PAY_PRIVATE_KEY_PATH &&
      process.env.WX_PAY_NOTIFY_URL
    );
  }

  /** 懒加载客户端；缺配置时抛 503（不影响服务启动与免费报名）。 */
  private client(): WxPay {
    if (this.pay) return this.pay;
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('微信支付尚未配置（商户号待审核）');
    }
    this.apiV3Key = process.env.WX_PAY_API_V3_KEY!;
    this.notifyUrl = process.env.WX_PAY_NOTIFY_URL!;
    this.pay = new WxPay({
      appid: process.env.WX_APP_ID!,
      mchid: process.env.WX_PAY_MCH_ID!,
      serial_no: process.env.WX_PAY_SERIAL_NO!,
      publicKey: fs.readFileSync(process.env.WX_PAY_CERT_PATH!),
      privateKey: fs.readFileSync(process.env.WX_PAY_PRIVATE_KEY_PATH!),
      key: this.apiV3Key,
    });
    return this.pay;
  }

  /**
   * JSAPI 下单，返回小程序 wx.requestPayment 所需参数。
   * @param amount 金额（分）
   * @param expiresAt 订单过期时间（用于 time_expire，超时微信侧自动失效）
   */
  async createJsapiOrder(opts: {
    description: string;
    outTradeNo: string;
    amount: number;
    openId: string;
    expiresAt: Date;
  }): Promise<JsapiPayParams> {
    const res: any = await this.client().transactions_jsapi({
      description: opts.description,
      out_trade_no: opts.outTradeNo,
      notify_url: this.notifyUrl,
      time_expire: this.toRfc3339(opts.expiresAt),
      amount: { total: opts.amount, currency: 'CNY' },
      payer: { openid: opts.openId },
    });
    // 库把支付参数放在 res.data（兼容个别版本直接平铺）
    const p = res?.data ?? res;
    if (!p || !p.paySign) {
      this.logger.error(`JSAPI 下单失败: ${JSON.stringify(res?.error ?? res)}`);
      throw new ServiceUnavailableException('微信下单失败，请稍后重试');
    }
    return {
      appId: p.appId,
      timeStamp: p.timeStamp,
      nonceStr: p.nonceStr,
      package: p.package,
      signType: p.signType,
      paySign: p.paySign,
    };
  }

  /**
   * 验签 + 解密支付结果回调。
   * @returns 解密后的资源对象；验签失败返回 null。
   */
  async verifyAndDecryptNotify(
    headers: Record<string, any>,
    rawBody: string,
  ): Promise<NotifyResource | null> {
    const client = this.client();
    const timestamp = headers['wechatpay-timestamp'];
    const nonce = headers['wechatpay-nonce'];
    const signature = headers['wechatpay-signature'];
    const serial = headers['wechatpay-serial'];

    const ok = await client.verifySign({
      timestamp,
      nonce,
      signature,
      serial,
      body: rawBody,
      apiSecret: this.apiV3Key,
    });
    if (!ok) {
      this.logger.warn('支付回调验签失败');
      return null;
    }

    const body = JSON.parse(rawBody);
    const { ciphertext, associated_data, nonce: dataNonce } = body.resource;
    return client.decipher_gcm<NotifyResource>(
      ciphertext,
      associated_data,
      dataNonce,
      this.apiV3Key,
    );
  }

  /** Date → RFC3339（+08:00），微信 time_expire 要求格式。 */
  private toRfc3339(d: Date): string {
    const tzMs = 8 * 60 * 60 * 1000;
    const s = new Date(d.getTime() + tzMs).toISOString().replace('Z', '+08:00');
    return s;
  }
}
