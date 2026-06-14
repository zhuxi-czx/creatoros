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
   * 解密支付结果回调。
   *
   * APIv3 回调的 resource 使用 APIv3 密钥做 AES-256-GCM「认证加密」：
   * 解密成功（GCM 标签校验通过）本身即证明报文来自微信、未被篡改，
   * 只有持有 APIv3 密钥的微信与本商户能产生有效密文。
   *
   * 因此这里不依赖「平台证书」做 RSA 验签（新商户常拉不到平台证书，
   * verifySign 会报「拉取平台证书失败」），改为直接 GCM 解密。
   * 解密失败 → 报文不可信 → 返回 null。
   *
   * @returns 解密后的资源对象；解密失败返回 null。
   */
  async verifyAndDecryptNotify(
    _headers: Record<string, any>,
    rawBody: string,
  ): Promise<NotifyResource | null> {
    try {
      const client = this.client();
      const body = JSON.parse(rawBody);
      const { ciphertext, associated_data, nonce } = body.resource;
      return client.decipher_gcm<NotifyResource>(
        ciphertext,
        associated_data,
        nonce,
        this.apiV3Key,
      );
    } catch (e: any) {
      this.logger.warn(`支付回调解密失败: ${e?.message ?? e}`);
      return null;
    }
  }

  /**
   * 主动查单（兜底）。用商户证书向微信查询订单真实状态，
   * 不依赖平台证书/APIv3 密钥，回调丢失或解密失败时也能确认收款。
   * @returns { tradeState, transactionId }；查询失败返回 null。
   */
  async queryOrderState(
    outTradeNo: string,
  ): Promise<{ tradeState: string; transactionId: string } | null> {
    try {
      const res: any = await this.client().query({ out_trade_no: outTradeNo });
      const p = res?.data ?? res;
      if (!p || !p.trade_state) {
        this.logger.warn(`查单无结果: ${outTradeNo} ${JSON.stringify(res?.error ?? '')}`);
        return null;
      }
      return { tradeState: p.trade_state, transactionId: p.transaction_id ?? '' };
    } catch (e: any) {
      this.logger.warn(`查单异常 ${outTradeNo}: ${e?.message ?? e}`);
      return null;
    }
  }

  /**
   * 申请退款（原路退回）。金额单位为分；全额退款时 refund=total=原订单金额。
   * @returns { status }；status: SUCCESS(已退) / PROCESSING(处理中) / CLOSED / ABNORMAL。
   *          调用异常或微信拒绝返回 null。
   */
  async refund(opts: {
    outTradeNo: string;
    outRefundNo: string;
    amount: number;
    reason?: string;
  }): Promise<{ status: string; refundId: string } | null> {
    try {
      const res: any = await this.client().refunds({
        out_trade_no: opts.outTradeNo,
        out_refund_no: opts.outRefundNo,
        reason: opts.reason,
        amount: { refund: opts.amount, total: opts.amount, currency: 'CNY' },
      });
      const p = res?.data ?? res;
      if (!p || !p.status) {
        this.logger.error(`退款失败: ${JSON.stringify(res?.error ?? res)}`);
        return null;
      }
      return { status: p.status, refundId: p.refund_id ?? '' };
    } catch (e: any) {
      this.logger.error(`退款异常 ${opts.outRefundNo}: ${e?.message ?? e}`);
      return null;
    }
  }

  /** Date → RFC3339（+08:00），微信 time_expire 要求格式。 */
  private toRfc3339(d: Date): string {
    const tzMs = 8 * 60 * 60 * 1000;
    const s = new Date(d.getTime() + tzMs).toISOString().replace('Z', '+08:00');
    return s;
  }
}
