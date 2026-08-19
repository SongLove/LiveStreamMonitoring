import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHash } from 'crypto';
import { WechatTokenService } from './wechat-token.service';
import { normalizeWechatList } from '../../common/utils/normalize';
import { QuotaService } from '../quota/quota.service';
import { UserService } from '../user/user.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotifyLog, NotifyLogDocument } from '../notify/notify-log.schema';

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly tokenService: WechatTokenService,
    private readonly quotaService: QuotaService,
    private readonly userService: UserService,
    @InjectModel(NotifyLog.name) private readonly notifyLogModel: Model<NotifyLogDocument>,
  ) {}

  isMockMode(): boolean {
    return !(this.config.get<string>('wechat.appId') || '');
  }

  async code2Session(code: string): Promise<{ openid: string; session_key?: string }> {
    if (this.isMockMode()) {
      return { openid: `mock_openid_${code || 'dev'}` };
    }
    const appId = this.config.get<string>('wechat.appId');
    const secret = this.config.get<string>('wechat.secret');
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    const { data } = await axios.get(url, { timeout: 10000 });
    if (!data.openid) {
      throw new UnauthorizedException(`Invalid wechat code: ${data.errcode}`);
    }
    return { openid: data.openid, session_key: data.session_key };
  }

  verifyCallbackSignature(query: {
    signature?: string;
    timestamp?: string;
    nonce?: string;
    echostr?: string;
  }): boolean {
    const token = this.config.get<string>('wechat.token') || '';
    if (this.isMockMode() || !token) return true;
    const { signature, timestamp, nonce } = query;
    if (!signature || !timestamp || !nonce) return false;
    const arr = [token, timestamp, nonce].sort();
    const hash = createHash('sha1').update(arr.join('')).digest('hex');
    return hash === signature;
  }

  async handleSubscribeCallback(body: any): Promise<{ processed: number }> {
    const events = normalizeWechatList(body?.List || body?.list || body);
    let processed = 0;
    for (const item of events) {
      const openid = item.OpenId || item.openid || body.FromUserName || body.fromUserName;
      const templateId = item.TemplateId || item.templateId;
      const status = (item.SubscribeStatusString || item.status || '').toLowerCase();
      const createTime = String(item.PopupScene || item.createTime || Date.now());
      if (!openid || !templateId) continue;

      if (status === 'reject' || status === 'reject_with_no_dialog') {
        await this.userService.setTemplateAuthByOpenId(openid, templateId, 'reject');
        processed += 1;
        continue;
      }

      if (status === 'accept') {
        await this.userService.setTemplateAuthByOpenId(openid, templateId, 'accept');
        const user = await this.userService.findByOpenId(openid);
        if (user) {
          const idempotencyKey = `grant:${openid}:${templateId}:${createTime}`;
          await this.quotaService.grantFromWechatCallback({
            userId: user.id,
            templateId,
            idempotencyKey,
            meta: { source: 'wechat_callback' },
          });
        }
        processed += 1;
      }
    }
    return { processed };
  }

  async handleNotifyResultCallback(body: any): Promise<void> {
    const list = normalizeWechatList(body?.List || body?.list || body);
    for (const item of list) {
      const msgId = item.MsgID || item.msgId;
      const status = item.Status || item.status;
      if (!msgId) continue;
      const log = await this.notifyLogModel.findOne({ wxMsgId: String(msgId) });
      if (!log) continue;
      const failed = String(status).toLowerCase().includes('failed');
      log.finalStatus = failed ? 'failed' : 'success';
      log.receipt = item;
      await log.save();
      if (failed && this.shouldRefundError(Number(item.ErrorCode || item.errcode || 0))) {
        await this.quotaService.refund(
          String(log.userId),
          `refund:receipt:${log.id}`,
          'async_receipt_refund',
        );
      }
    }
  }

  shouldRefundError(errcode: number): boolean {
    return [43101, 47003, 41030].includes(errcode);
  }

  async sendSubscribeMessage(params: {
    openid: string;
    templateId: string;
    page: string;
    data: Record<string, { value: string }>;
  }): Promise<{ errcode: number; errmsg: string; msgid?: string }> {
    if (this.isMockMode()) {
      return { errcode: 0, errmsg: 'ok', msgid: `mock_${Date.now()}` };
    }
    const accessToken = await this.tokenService.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;
    const { data } = await axios.post(
      url,
      {
        touser: params.openid,
        template_id: params.templateId,
        page: params.page,
        miniprogram_state: this.config.get('wechat.miniProgramState'),
        lang: 'zh_CN',
        data: params.data,
      },
      { timeout: 10000 },
    );
    if (data.errcode === 40001) {
      await this.tokenService.getAccessToken(true);
    }
    return data;
  }

  truncateField(value: string, max = 20): string {
    const s = String(value || '');
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }
}
