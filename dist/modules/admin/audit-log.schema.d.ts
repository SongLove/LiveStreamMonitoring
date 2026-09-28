import { HydratedDocument, Types } from 'mongoose';
export type AuditLogDocument = HydratedDocument<AuditLog>;
export declare class AuditLog {
    adminId: Types.ObjectId;
    action: string;
    targetType: string;
    targetId: string;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    reason: string;
}
export declare const AuditLogSchema: import("mongoose").Schema<AuditLog, import("mongoose").Model<AuditLog, any, any, any, any, any, AuditLog>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AuditLog, import("mongoose").Document<unknown, {}, AuditLog, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AuditLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    adminId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, AuditLog, import("mongoose").Document<unknown, {}, AuditLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AuditLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    action?: import("mongoose").SchemaDefinitionProperty<string, AuditLog, import("mongoose").Document<unknown, {}, AuditLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AuditLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    targetType?: import("mongoose").SchemaDefinitionProperty<string, AuditLog, import("mongoose").Document<unknown, {}, AuditLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AuditLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    targetId?: import("mongoose").SchemaDefinitionProperty<string, AuditLog, import("mongoose").Document<unknown, {}, AuditLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AuditLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    before?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, AuditLog, import("mongoose").Document<unknown, {}, AuditLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AuditLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    after?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, AuditLog, import("mongoose").Document<unknown, {}, AuditLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AuditLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    reason?: import("mongoose").SchemaDefinitionProperty<string, AuditLog, import("mongoose").Document<unknown, {}, AuditLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AuditLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, AuditLog>;
