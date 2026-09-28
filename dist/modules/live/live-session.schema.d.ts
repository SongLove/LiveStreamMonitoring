import { HydratedDocument, Types } from 'mongoose';
export type LiveSessionDocument = HydratedDocument<LiveSession>;
export declare class LiveSession {
    anchorId: Types.ObjectId;
    sessionKey: string;
    platform: string;
    startedAt: Date;
    endedAt: Date | null;
    status: 'live' | 'ended';
    provider: string;
    detectLatencyMs: number;
    title: string;
    coverUrl: string;
}
export declare const LiveSessionSchema: import("mongoose").Schema<LiveSession, import("mongoose").Model<LiveSession, any, any, any, any, any, LiveSession>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LiveSession, import("mongoose").Document<unknown, {}, LiveSession, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<LiveSession & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    anchorId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, LiveSession, import("mongoose").Document<unknown, {}, LiveSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiveSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    sessionKey?: import("mongoose").SchemaDefinitionProperty<string, LiveSession, import("mongoose").Document<unknown, {}, LiveSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiveSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    platform?: import("mongoose").SchemaDefinitionProperty<string, LiveSession, import("mongoose").Document<unknown, {}, LiveSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiveSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    startedAt?: import("mongoose").SchemaDefinitionProperty<Date, LiveSession, import("mongoose").Document<unknown, {}, LiveSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiveSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    endedAt?: import("mongoose").SchemaDefinitionProperty<Date | null, LiveSession, import("mongoose").Document<unknown, {}, LiveSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiveSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<"live" | "ended", LiveSession, import("mongoose").Document<unknown, {}, LiveSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiveSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    provider?: import("mongoose").SchemaDefinitionProperty<string, LiveSession, import("mongoose").Document<unknown, {}, LiveSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiveSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    detectLatencyMs?: import("mongoose").SchemaDefinitionProperty<number, LiveSession, import("mongoose").Document<unknown, {}, LiveSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiveSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    title?: import("mongoose").SchemaDefinitionProperty<string, LiveSession, import("mongoose").Document<unknown, {}, LiveSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiveSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    coverUrl?: import("mongoose").SchemaDefinitionProperty<string, LiveSession, import("mongoose").Document<unknown, {}, LiveSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LiveSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, LiveSession>;
export declare function buildSessionKey(anchorId: string, startedAt: Date): string;
