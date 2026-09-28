import { QuotaService } from './quota.service';
export declare class QuotaController {
    private readonly quotaService;
    constructor(quotaService: QuotaService);
    get(user: {
        userId: string;
    }): Promise<{
        recentLedger: (import("mongoose").Document<unknown, {}, import("./quota-ledger.schema").QuotaLedger, {}, import("mongoose").DefaultSchemaOptions> & import("./quota-ledger.schema").QuotaLedger & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        balance: number;
        maxBalance: number;
    }>;
    refresh(user: {
        userId: string;
    }): Promise<{
        balance: number;
        maxBalance: number;
    }>;
    forgeGrant(): Promise<void>;
}
