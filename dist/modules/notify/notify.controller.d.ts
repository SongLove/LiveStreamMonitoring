import { NotifyService } from './notify.service';
import { ConfigService } from '@nestjs/config';
import { WechatService } from '../wechat/wechat.service';
import { UserService } from '../user/user.service';
import { QuotaService } from '../quota/quota.service';
export declare class NotifyTestDto {
    message?: string;
}
export declare class NotifyController {
    private readonly notifyService;
    private readonly wechatService;
    private readonly userService;
    private readonly quotaService;
    private readonly config;
    constructor(notifyService: NotifyService, wechatService: WechatService, userService: UserService, quotaService: QuotaService, config: ConfigService);
    logs(user: {
        userId: string;
    }, page?: string, pageSize?: string): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("./notify-log.schema").NotifyLog, {}, import("mongoose").DefaultSchemaOptions> & import("./notify-log.schema").NotifyLog & {
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
    test(user: {
        userId: string;
    }, body: NotifyTestDto): Promise<{
        ok: boolean;
        reason: string;
        result?: undefined;
    } | {
        ok: boolean;
        result: {
            errcode: number;
            errmsg: string;
            msgid?: string;
        };
        reason?: undefined;
    }>;
    diagnose(user: {
        userId: string;
    }): Promise<{
        status: import("../user/user.schema").UserStatus;
        templateAuth: Record<string, "accept" | "reject" | "unknown">;
        notifyEnabled: boolean;
        quota: {
            balance: number;
            maxBalance: number;
        };
    }>;
    faq(): {
        items: {
            q: string;
            a: string;
        }[];
    };
    appConfig(): {
        templates: {
            liveNotify: any;
        };
        features: {
            studentMode: boolean;
        };
    };
}
