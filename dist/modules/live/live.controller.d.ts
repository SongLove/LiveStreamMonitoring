import { LiveService } from './live.service';
export declare class LiveController {
    private readonly liveService;
    constructor(liveService: LiveService);
    sessions(user: {
        userId: string;
    }, page?: string, pageSize?: string): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("./live-session.schema").LiveSession, {}, import("mongoose").DefaultSchemaOptions> & import("./live-session.schema").LiveSession & {
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
        userId: string;
    }>;
}
