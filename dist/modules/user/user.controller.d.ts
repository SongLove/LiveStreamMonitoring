import { UserService } from './user.service';
import { QuotaService } from '../quota/quota.service';
export declare class UpdateSettingsDto {
    notifyEnabled?: boolean;
    dndEnabled?: boolean;
    dndStart?: string;
    dndEnd?: string;
    studentMode?: boolean;
    largeAccountOnly?: boolean;
    cooldownMinutes?: number;
}
export declare class UserController {
    private readonly userService;
    private readonly quotaService;
    constructor(userService: UserService, quotaService: QuotaService);
    profile(user: {
        userId: string;
    }): Promise<{
        quota: {
            balance: number;
            maxBalance: number;
        };
        id: string;
        nickname: string;
        avatarUrl: string;
        status: import("./user.schema").UserStatus;
        settings: {
            notifyEnabled: boolean;
            dndEnabled: boolean;
            dndStart: string;
            dndEnd: string;
            studentMode: boolean;
            largeAccountOnly: boolean;
            cooldownMinutes: number;
        };
        templateAuth: Record<string, "accept" | "reject" | "unknown">;
        lastActiveAt: Date;
    }>;
    settings(user: {
        userId: string;
    }, body: UpdateSettingsDto): Promise<{
        notifyEnabled: boolean;
        dndEnabled: boolean;
        dndStart: string;
        dndEnd: string;
        studentMode: boolean;
        largeAccountOnly: boolean;
        cooldownMinutes: number;
    }>;
}
