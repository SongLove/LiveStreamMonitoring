import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import { NotifyLog, NotifyLogDocument } from './notify-log.schema';
import { UserService } from '../user/user.service';
import { QuotaService } from '../quota/quota.service';
import { WechatService } from '../wechat/wechat.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { AnchorService } from '../anchor/anchor.service';
import { LiveSession, LiveSessionDocument } from '../live/live-session.schema';

export type NotifySkipReason =
  | 'subscription_disabled'
  | 'user_banned'
  | 'notify_disabled'
  | 'dnd'
  | 'student_mode'
  | 'large_account_only'
  | 'cooldown'
  | 'duplicate'
  | 'template_unauthorized'
  | 'quota_insufficient'
  | 'ok';

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);
  private holidayCache: { year: number; days: Set<string>; loadedAt: number } | null = null;

  constructor(
    @InjectModel(NotifyLog.name) private readonly notifyLogModel: Model<NotifyLogDocument>,
    @InjectModel(LiveSession.name) private readonly sessionModel: Model<LiveSessionDocument>,
    private readonly userService: UserService,
    private readonly quotaService: QuotaService,
    private readonly wechatService: WechatService,
    private readonly subscriptionService: SubscriptionService,
    private readonly anchorService: AnchorService,
    private readonly config: ConfigService,
  ) {}

  async validateChain(params: {
    userId: string;
    sessionId: string;
    anchorId: string;
    templateId: string;
    isLargeAccount?: boolean;
  }): Promise<{ pass: boolean; reason: NotifySkipReason }> {
    const sub = await this.subscriptionService.findActive(params.userId, params.anchorId);
    if (!sub || !sub.enabled) return { pass: false, reason: 'subscription_disabled' };

    const user = await this.userService.findById(params.userId);
    if (user.status === 'banned' || user.status === 'deleting') {
      return { pass: false, reason: 'user_banned' };
    }
    if (!user.settings.notifyEnabled) return { pass: false, reason: 'notify_disabled' };
    if (user.settings.dndEnabled && this.inDnd(user.settings.dndStart, user.settings.dndEnd)) {
      return { pass: false, reason: 'dnd' };
    }
    if (user.settings.studentMode && !(await this.isStudentAllowedNow())) {
      return { pass: false, reason: 'student_mode' };
    }
    if (user.settings.largeAccountOnly && !params.isLargeAccount) {
      return { pass: false, reason: 'large_account_only' };
    }
    if (user.settings.cooldownMinutes > 0) {
      const since = new Date(Date.now() - user.settings.cooldownMinutes * 60_000);
      const recent = await this.notifyLogModel.findOne({
        userId: new Types.ObjectId(params.userId),
        state: { $in: ['sent', 'success'] },
        createdAt: { $gte: since },
      });
      if (recent) return { pass: false, reason: 'cooldown' };
    }

    const dup = await this.notifyLogModel.findOne({
      userId: new Types.ObjectId(params.userId),
      sessionId: new Types.ObjectId(params.sessionId),
      templateId: params.templateId,
      state: { $in: ['sent', 'success', 'pending'] },
    });
    if (dup) return { pass: false, reason: 'duplicate' };

    const auth = user.templateAuth?.[params.templateId];
    if (auth === 'reject') return { pass: false, reason: 'template_unauthorized' };

    const snap = await this.quotaService.getSnapshot(params.userId);
    if (snap.balance <= 0) return { pass: false, reason: 'quota_insufficient' };

    return { pass: true, reason: 'ok' };
  }

  inDnd(start: string, end: string, now = new Date()): boolean {
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };
    const cur = now.getHours() * 60 + now.getMinutes();
    const s = toMin(start);
    const e = toMin(end);
    if (s === e) return false;
    if (s < e) return cur >= s && cur < e;
    return cur >= s || cur < e;
  }

  async isStudentAllowedNow(): Promise<boolean> {
    // Student mode: only notify on weekends / holidays (third-party calendar)
    const now = new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) return true;
    const days = await this.getHolidayDays(now.getFullYear());
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return days.has(key);
  }

  async getHolidayDays(year: number): Promise<Set<string>> {
    if (this.holidayCache && this.holidayCache.year === year && Date.now() - this.holidayCache.loadedAt < 86400_000) {
      return this.holidayCache.days;
    }
    const set = new Set<string>();
    try {
      const base = this.config.get<string>('holidayApiUrl');
      const { data } = await axios.get(`${base}/${year}`, { timeout: 8000 });
      const holiday = data?.holiday || {};
      for (const [k, v] of Object.entries(holiday)) {
        if ((v as any)?.holiday) set.add(k.length === 5 ? `${year}-${k}` : k);
      }
    } catch (e) {
      this.logger.warn(`Holiday API failed: ${(e as Error).message}`);
    }
    this.holidayCache = { year, days: set, loadedAt: Date.now() };
    return set;
  }

  async sendForUser(params: {
    userId: string;
    sessionId: string;
    anchorId: string;
  }): Promise<{ skipped?: string; sent?: boolean }> {
    const templateId =
      this.config.get<string>('wechat.subscribeTemplateId') || 'TMPL_LIVE_NOTIFY';
    const anchor = await this.anchorService.findById(params.anchorId);
    const check = await this.validateChain({
      ...params,
      templateId,
      isLargeAccount: (anchor.followerCount || 0) >= 100000,
    });

    if (!check.pass) {
      try {
        await this.notifyLogModel.create({
          userId: new Types.ObjectId(params.userId),
          sessionId: new Types.ObjectId(params.sessionId),
          anchorId: new Types.ObjectId(params.anchorId),
          templateId,
          state: 'skipped',
          skipReason: check.reason,
        });
      } catch (err: any) {
        if (err?.code !== 11000) throw err;
      }
      return { skipped: check.reason };
    }

    const deductKey = `deduct:${params.userId}:${params.sessionId}:${templateId}`;
    const deducted = await this.quotaService.deduct(params.userId, deductKey);
    if (!deducted) {
      await this.notifyLogModel.create({
        userId: new Types.ObjectId(params.userId),
        sessionId: new Types.ObjectId(params.sessionId),
        anchorId: new Types.ObjectId(params.anchorId),
        templateId,
        state: 'skipped',
        skipReason: 'quota_insufficient',
      });
      return { skipped: 'quota_insufficient' };
    }

    const user = await this.userService.findById(params.userId);
    const title = this.wechatService.truncateField(anchor.nickname || '主播', 20);
    const room = this.wechatService.truncateField(anchor.liveTitle || '正在直播', 20);
    const page = `pages/live/detail?sessionId=${params.sessionId}`;

    let log: NotifyLogDocument;
    try {
      log = await this.notifyLogModel.create({
        userId: new Types.ObjectId(params.userId),
        sessionId: new Types.ObjectId(params.sessionId),
        anchorId: new Types.ObjectId(params.anchorId),
        templateId,
        state: 'pending',
        payload: { page, title, room },
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        await this.quotaService.refund(params.userId, `refund:dup:${deductKey}`, 'duplicate_notify');
        return { skipped: 'duplicate' };
      }
      throw err;
    }

    const result = await this.wechatService.sendSubscribeMessage({
      openid: user.openid,
      templateId,
      page,
      data: {
        thing1: { value: title },
        thing2: { value: room },
        time3: { value: new Date().toISOString().slice(0, 19).replace('T', ' ') },
      },
    });

    if (result.errcode === 0) {
      log.state = 'sent';
      log.wxMsgId = String(result.msgid || '');
      await log.save();
      return { sent: true };
    }

    if (this.wechatService.shouldRefundError(result.errcode)) {
      await this.quotaService.refund(
        params.userId,
        `refund:wx:${params.userId}:${params.sessionId}:${result.errcode}`,
        `wx_${result.errcode}`,
      );
      if (result.errcode === 43101) {
        await this.userService.setTemplateAuth(params.userId, templateId, 'reject');
      }
    }

    log.state = 'failed';
    log.skipReason = `wx_${result.errcode}`;
    await log.save();
    return { sent: false };
  }

  async listForUser(userId: string, page = 1, pageSize = 20) {
    const filter = { userId: new Types.ObjectId(userId) };
    const [items, total] = await Promise.all([
      this.notifyLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.notifyLogModel.countDocuments(filter),
    ]);
    return { items, total, page, pageSize };
  }

  async testNotify(userId: string) {
    // Uses a synthetic session path for manual milestone test
    return {
      message: 'Use admin/manual tool or create live session first',
      hint: 'POST with real session after live confirm',
    };
  }
}
