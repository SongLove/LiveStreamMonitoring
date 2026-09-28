import { HydratedDocument, Types } from 'mongoose';
export type QuotaLedgerDocument = HydratedDocument<QuotaLedger>;
export type QuotaLedgerType = 'grant' | 'deduct' | 'refund' | 'adjust';
export declare class QuotaLedger {
    userId: Types.ObjectId;
    type: QuotaLedgerType;
    amount: number;
    idempotencyKey: string;
    templateId: string;
    reason: string;
    meta: Record<string, unknown>;
}
export declare const QuotaLedgerSchema: import("mongoose").Schema<QuotaLedger, import("mongoose").Model<QuotaLedger, any, any, any, any, any, QuotaLedger>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, QuotaLedger, import("mongoose").Document<unknown, {}, QuotaLedger, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<QuotaLedger & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, QuotaLedger, import("mongoose").Document<unknown, {}, QuotaLedger, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<QuotaLedger & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<QuotaLedgerType, QuotaLedger, import("mongoose").Document<unknown, {}, QuotaLedger, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<QuotaLedger & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, QuotaLedger, import("mongoose").Document<unknown, {}, QuotaLedger, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<QuotaLedger & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    idempotencyKey?: import("mongoose").SchemaDefinitionProperty<string, QuotaLedger, import("mongoose").Document<unknown, {}, QuotaLedger, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<QuotaLedger & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    templateId?: import("mongoose").SchemaDefinitionProperty<string, QuotaLedger, import("mongoose").Document<unknown, {}, QuotaLedger, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<QuotaLedger & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    reason?: import("mongoose").SchemaDefinitionProperty<string, QuotaLedger, import("mongoose").Document<unknown, {}, QuotaLedger, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<QuotaLedger & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    meta?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, QuotaLedger, import("mongoose").Document<unknown, {}, QuotaLedger, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<QuotaLedger & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, QuotaLedger>;
