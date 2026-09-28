import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from './subscription.schema';
import { UserService } from '../user/user.service';
import { AnchorService } from '../anchor/anchor.service';
import { CategoryService } from '../category/category.service';
export declare class SubscriptionService {
    private readonly subModel;
    private readonly userService;
    private readonly anchorService;
    private readonly categoryService;
    constructor(subModel: Model<SubscriptionDocument>, userService: UserService, anchorService: AnchorService, categoryService: CategoryService);
    list(userId: string): Promise<(import("mongoose").Document<unknown, {}, Subscription, {}, import("mongoose").DefaultSchemaOptions> & Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>)[]>;
    findActive(userId: string, anchorId: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Subscription, {}, import("mongoose").DefaultSchemaOptions> & Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Subscription, {}, import("mongoose").DefaultSchemaOptions> & Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>) | null>;
    add(userId: string, anchorId: string, categoryIds?: string[]): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Subscription, {}, import("mongoose").DefaultSchemaOptions> & Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Subscription, {}, import("mongoose").DefaultSchemaOptions> & Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    update(userId: string, id: string, patch: Partial<{
        enabled: boolean;
        remark: string;
        sortOrder: number;
        categoryIds: string[];
    }>): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Subscription, {}, import("mongoose").DefaultSchemaOptions> & Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Subscription, {}, import("mongoose").DefaultSchemaOptions> & Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    remove(userId: string, id: string): Promise<{
        ok: boolean;
    }>;
    batch(userId: string, payload: {
        ids: string[];
        enabled?: boolean;
        categoryIds?: string[];
    }): Promise<{
        ok: boolean;
    }>;
    listEnabledByAnchor(anchorId: string): Promise<(import("mongoose").Document<unknown, {}, Subscription, {}, import("mongoose").DefaultSchemaOptions> & Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>)[]>;
}
