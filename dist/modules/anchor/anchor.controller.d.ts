import { AnchorService } from './anchor.service';
import { Platform } from './anchor.schema';
export declare class ResolveAnchorDto {
    platform: Platform;
    input: string;
}
export declare class AnchorController {
    private readonly anchorService;
    constructor(anchorService: AnchorService);
    search(platform: Platform, q: string): Promise<(import("mongoose").Document<unknown, {}, import("./anchor.schema").Anchor, {}, import("mongoose").DefaultSchemaOptions> & import("./anchor.schema").Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    resolve(body: ResolveAnchorDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./anchor.schema").Anchor, {}, import("mongoose").DefaultSchemaOptions> & import("./anchor.schema").Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./anchor.schema").Anchor, {}, import("mongoose").DefaultSchemaOptions> & import("./anchor.schema").Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    pool(): Promise<{
        sets: never[];
        message: string;
    }>;
    detail(id: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./anchor.schema").Anchor, {}, import("mongoose").DefaultSchemaOptions> & import("./anchor.schema").Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./anchor.schema").Anchor, {}, import("mongoose").DefaultSchemaOptions> & import("./anchor.schema").Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
}
