import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { Model, Types } from 'mongoose';
import { LiveSession, LiveSessionDocument, buildSessionKey } from './live-session.schema';
import { AnchorDocument } from '../anchor/anchor.schema';
import { RedisService } from '../../common/redis/redis.service';
import { NormalizedLiveStatus } from '../crawler/providers/provider.types';
export declare class LiveService {
    private readonly sessionModel;
    private readonly anchorModel;
    private readonly redis;
    private readonly config;
    private readonly notifyDispatch;
    private readonly pollConfirm;
    private readonly logger;
    constructor(sessionModel: Model<LiveSessionDocument>, anchorModel: Model<AnchorDocument>, redis: RedisService, config: ConfigService, notifyDispatch: Queue, pollConfirm: Queue);
    snapshotKey(anchorId: string): string;
    applyProbeResult(anchorId: string, status: NormalizedLiveStatus, meta: {
        provider: string;
        confidence: number;
        title?: string;
        coverUrl?: string;
        startedAt?: Date;
    }): Promise<{
        transition: "probe_failed";
    } | {
        transition: "force_offline";
    } | {
        transition: "rebroadcast_cooldown";
        sessionId?: undefined;
    } | {
        transition: "session_exists";
        sessionId: string | undefined;
    } | {
        transition: "live";
        sessionId: string;
    } | {
        transition: "none";
    } | {
        transition: "pending_confirm";
    } | {
        transition: "still_live";
    } | {
        transition: "offline_progress";
    } | {
        transition: "offline";
    }>;
    private handleProbeFailed;
    private markOffline;
    private confirmLive;
    private enqueueNotifyDispatch;
    listForUser(userId: string, page?: number, pageSize?: number): Promise<{
        items: (import("mongoose").Document<unknown, {}, LiveSession, {}, import("mongoose").DefaultSchemaOptions> & LiveSession & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        pageSize: number;
        userId: string;
    }>;
}
export { buildSessionKey };
