import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { NotifyLog, NotifyLogDocument } from './notify-log.schema';
import { UserService } from '../user/user.service';
import { QuotaService } from '../quota/quota.service';
import { WechatService } from '../wechat/wechat.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { AnchorService } from '../anchor/anchor.service';
import { LiveSessionDocument } from '../live/live-session.schema';
export type NotifySkipReason = 'subscription_disabled' | 'user_banned' | 'notify_disabled' | 'dnd' | 'student_mode' | 'large_account_only' | 'cooldown' | 'duplicate' | 'template_unauthorized' | 'quota_insufficient' | 'ok';
export declare class NotifyService {
    private readonly notifyLogModel;
    private readonly sessionModel;
    private readonly userService;
    private readonly quotaService;
    private readonly wechatService;
    private readonly subscriptionService;
    private readonly anchorService;
    private readonly config;
    private readonly logger;
    private holidayCache;
    constructor(notifyLogModel: Model<NotifyLogDocument>, sessionModel: Model<LiveSessionDocument>, userService: UserService, quotaService: QuotaService, wechatService: WechatService, subscriptionService: SubscriptionService, anchorService: AnchorService, config: ConfigService);
    validateChain(params: {
        userId: string;
        sessionId: string;
        anchorId: string;
        templateId: string;
        isLargeAccount?: boolean;
    }): Promise<{
        pass: boolean;
        reason: NotifySkipReason;
    }>;
    inDnd(start: string, end: string, now?: Date): boolean;
    isStudentAllowedNow(): Promise<boolean>;
    getHolidayDays(year: number): Promise<Set<string>>;
    sendForUser(params: {
        userId: string;
        sessionId: string;
        anchorId: string;
    }): Promise<{
        skipped?: string;
        sent?: boolean;
    }>;
    listForUser(userId: string, page?: number, pageSize?: number): Promise<{
        items: (import("mongoose").Document<unknown, {}, NotifyLog, {}, import("mongoose").DefaultSchemaOptions> & NotifyLog & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    testNotify(userId: string): Promise<{
        message: string;
        hint: string;
    }>;
}
