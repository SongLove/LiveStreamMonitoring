import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { QuotaLedger, QuotaLedgerDocument } from './quota-ledger.schema';
import { UserQuotaDocument } from './user-quota.schema';
export declare class QuotaService {
    private readonly ledgerModel;
    private readonly quotaModel;
    private readonly config;
    private readonly logger;
    constructor(ledgerModel: Model<QuotaLedgerDocument>, quotaModel: Model<UserQuotaDocument>, config: ConfigService);
    getSnapshot(userId: string): Promise<{
        balance: number;
        maxBalance: number;
    }>;
    refreshReadOnly(userId: string): Promise<{
        balance: number;
        maxBalance: number;
    }>;
    rejectClientGrant(): never;
    grantFromWechatCallback(params: {
        userId: string;
        templateId: string;
        idempotencyKey: string;
        meta?: Record<string, unknown>;
    }): Promise<{
        granted: boolean;
        balance: number;
    }>;
    deduct(userId: string, idempotencyKey: string, reason?: string): Promise<boolean>;
    refund(userId: string, idempotencyKey: string, reason?: string): Promise<void>;
    adjust(userId: string, delta: number, idempotencyKey: string, reason: string): Promise<{
        balance: number;
    }>;
    listLedger(userId: string, limit?: number): Promise<(import("mongoose").Document<unknown, {}, QuotaLedger, {}, import("mongoose").DefaultSchemaOptions> & QuotaLedger & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>)[]>;
}
