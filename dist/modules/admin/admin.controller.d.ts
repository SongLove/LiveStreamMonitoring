import { UserService } from '../user/user.service';
import { QuotaService } from '../quota/quota.service';
import { AnchorService } from '../anchor/anchor.service';
import { CrawlerService } from '../crawler/crawler.service';
import { NotifyService } from '../notify/notify.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CategoryService } from '../category/category.service';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit-log.schema';
export declare class AdjustQuotaDto {
    delta: number;
    reason: string;
}
export declare class BanUserDto {
    banned: boolean;
    reason: string;
}
export declare class ResendNotifyDto {
    notifyLogId: string;
    reason: string;
}
export declare class AdminController {
    private readonly userService;
    private readonly quotaService;
    private readonly anchorService;
    private readonly crawlerService;
    private readonly notifyService;
    private readonly subscriptionService;
    private readonly categoryService;
    private readonly auditModel;
    constructor(userService: UserService, quotaService: QuotaService, anchorService: AnchorService, crawlerService: CrawlerService, notifyService: NotifyService, subscriptionService: SubscriptionService, categoryService: CategoryService, auditModel: Model<AuditLogDocument>);
    private audit;
    users(page?: string, pageSize?: string, status?: string): Promise<{
        items: any[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    userDetail(id: string): Promise<{
        profile: {
            openid: string;
            id: string;
            nickname: string;
            avatarUrl: string;
            status: import("../user/user.schema").UserStatus;
            settings: {
                notifyEnabled: boolean;
                dndEnabled: boolean;
                dndStart: string;
                dndEnd: string;
                studentMode: boolean;
                cooldownMinutes: number;
            };
            templateAuth: Record<string, "accept" | "reject" | "unknown">;
            lastActiveAt: Date;
        };
        quota: {
            balance: number;
            maxBalance: number;
        };
        subscriptions: (import("mongoose").Document<unknown, {}, import("../subscription/subscription.schema").Subscription, {}, import("mongoose").DefaultSchemaOptions> & import("../subscription/subscription.schema").Subscription & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        categories: (import("mongoose").Document<unknown, {}, import("../category/category.schema").UserAnchorCategory, {}, import("mongoose").DefaultSchemaOptions> & import("../category/category.schema").UserAnchorCategory & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        notifyLogs: {
            items: (import("mongoose").Document<unknown, {}, import("../notify/notify-log.schema").NotifyLog, {}, import("mongoose").DefaultSchemaOptions> & import("../notify/notify-log.schema").NotifyLog & {
                _id: import("mongoose").Types.ObjectId;
            } & {
                __v: number;
            } & {
                id: string;
            } & Required<{
                _id: import("mongoose").Types.ObjectId;
            }>)[];
            total: number;
            page: number;
            pageSize: number;
        };
    }>;
    ban(admin: {
        adminId: string;
    }, id: string, body: BanUserDto): Promise<{
        ok: boolean;
    }>;
    adjustQuota(admin: {
        adminId: string;
    }, id: string, body: AdjustQuotaDto): Promise<{
        balance: number;
    }>;
    resend(admin: {
        adminId: string;
    }, body: ResendNotifyDto): Promise<{
        ok: boolean;
        message: string;
    }>;
    anchors(page?: string, pageSize?: string): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../anchor/anchor.schema").Anchor, {}, import("mongoose").DefaultSchemaOptions> & import("../anchor/anchor.schema").Anchor & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    providersHealth(): Promise<{
        providers: {
            name: string;
            platform: string;
            ok: boolean;
            detail?: string;
        }[];
    }>;
    auditLogs(page?: string, pageSize?: string): Promise<{
        items: (import("mongoose").Document<unknown, {}, AuditLog, {}, import("mongoose").DefaultSchemaOptions> & AuditLog & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
