import { ConfigService } from '@nestjs/config';
import { WechatTokenService } from './wechat-token.service';
import { QuotaService } from '../quota/quota.service';
import { UserService } from '../user/user.service';
import { Model } from 'mongoose';
import { NotifyLogDocument } from '../notify/notify-log.schema';
export declare class WechatService {
    private readonly config;
    private readonly tokenService;
    private readonly quotaService;
    private readonly userService;
    private readonly notifyLogModel;
    private readonly logger;
    constructor(config: ConfigService, tokenService: WechatTokenService, quotaService: QuotaService, userService: UserService, notifyLogModel: Model<NotifyLogDocument>);
    isMockMode(): boolean;
    code2Session(code: string): Promise<{
        openid: string;
        session_key?: string;
    }>;
    verifyCallbackSignature(query: {
        signature?: string;
        timestamp?: string;
        nonce?: string;
        echostr?: string;
    }): boolean;
    handleSubscribeCallback(body: unknown): Promise<{
        processed: number;
    }>;
    mockGrantAccept(userId: string, templateId: string): Promise<{
        granted: boolean;
        balance: number;
    }>;
    handleNotifyResultCallback(body: any): Promise<void>;
    shouldRefundError(errcode: number): boolean;
    sendSubscribeMessage(params: {
        openid: string;
        templateId: string;
        page: string;
        data: Record<string, {
            value: string;
        }>;
    }): Promise<{
        errcode: number;
        errmsg: string;
        msgid?: string;
    }>;
    truncateField(value: string, max?: number): string;
}
