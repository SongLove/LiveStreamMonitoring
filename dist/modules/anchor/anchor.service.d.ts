import { Model } from 'mongoose';
import { Anchor, AnchorDocument, Platform } from './anchor.schema';
import { CrawlerService } from '../crawler/crawler.service';
export declare function buildAnchorProfileUpdate(resolved: {
    nickname: string;
    avatarUrl?: string;
    profileUrl: string;
    roomId?: string;
}): {
    $set: Record<string, unknown>;
    $setOnInsert: Record<string, unknown>;
};
export declare class AnchorService {
    private readonly anchorModel;
    private readonly crawler;
    constructor(anchorModel: Model<AnchorDocument>, crawler: CrawlerService);
    findById(id: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Anchor, {}, import("mongoose").DefaultSchemaOptions> & Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Anchor, {}, import("mongoose").DefaultSchemaOptions> & Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    search(platform: Platform, keyword: string): Promise<(import("mongoose").Document<unknown, {}, Anchor, {}, import("mongoose").DefaultSchemaOptions> & Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    resolve(platform: Platform, input: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Anchor, {}, import("mongoose").DefaultSchemaOptions> & Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Anchor, {}, import("mongoose").DefaultSchemaOptions> & Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    recalculatePollTier(anchorId: string): Promise<number>;
    bumpSubscriberCount(anchorId: string, delta: number): Promise<void>;
    listDue(limit?: number): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Anchor, {}, import("mongoose").DefaultSchemaOptions> & Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Anchor, {}, import("mongoose").DefaultSchemaOptions> & Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    adminList(page?: number, pageSize?: number): Promise<{
        items: (import("mongoose").Document<unknown, {}, Anchor, {}, import("mongoose").DefaultSchemaOptions> & Anchor & {
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
