import { HydratedDocument, Types } from 'mongoose';
export type NotifyLogDocument = HydratedDocument<NotifyLog>;
export declare class NotifyLog {
    userId: Types.ObjectId;
    sessionId: Types.ObjectId;
    anchorId: Types.ObjectId;
    templateId: string;
    state: 'pending' | 'skipped' | 'sent' | 'failed' | 'success';
    skipReason: string;
    wxMsgId: string;
    finalStatus: string;
    receipt: Record<string, unknown>;
    payload: Record<string, unknown>;
}
export declare const NotifyLogSchema: import("mongoose").Schema<NotifyLog, import("mongoose").Model<NotifyLog, any, any, any, any, any, NotifyLog>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, NotifyLog, import("mongoose").Document<unknown, {}, NotifyLog, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<NotifyLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, NotifyLog, import("mongoose").Document<unknown, {}, NotifyLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<NotifyLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    sessionId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, NotifyLog, import("mongoose").Document<unknown, {}, NotifyLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<NotifyLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    anchorId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, NotifyLog, import("mongoose").Document<unknown, {}, NotifyLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<NotifyLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    templateId?: import("mongoose").SchemaDefinitionProperty<string, NotifyLog, import("mongoose").Document<unknown, {}, NotifyLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<NotifyLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    state?: import("mongoose").SchemaDefinitionProperty<"pending" | "skipped" | "sent" | "failed" | "success", NotifyLog, import("mongoose").Document<unknown, {}, NotifyLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<NotifyLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    skipReason?: import("mongoose").SchemaDefinitionProperty<string, NotifyLog, import("mongoose").Document<unknown, {}, NotifyLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<NotifyLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    wxMsgId?: import("mongoose").SchemaDefinitionProperty<string, NotifyLog, import("mongoose").Document<unknown, {}, NotifyLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<NotifyLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    finalStatus?: import("mongoose").SchemaDefinitionProperty<string, NotifyLog, import("mongoose").Document<unknown, {}, NotifyLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<NotifyLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    receipt?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, NotifyLog, import("mongoose").Document<unknown, {}, NotifyLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<NotifyLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    payload?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, NotifyLog, import("mongoose").Document<unknown, {}, NotifyLog, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<NotifyLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, NotifyLog>;
