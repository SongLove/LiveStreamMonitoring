import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Model, Types } from 'mongoose';
import {
  LiveSession,
  LiveSessionDocument,
  buildSessionKey,
} from './live-session.schema';
import { Anchor, AnchorDocument } from '../anchor/anchor.schema';
import { RedisService } from '../../common/redis/redis.service';
import { QUEUE_NAMES } from '../../common/constants/queues';
import { NormalizedLiveStatus } from '../crawler/providers/provider.types';

@Injectable()
export class LiveService {
  private readonly logger = new Logger(LiveService.name);

  constructor(
    @InjectModel(LiveSession.name) private readonly sessionModel: Model<LiveSessionDocument>,
    @InjectModel(Anchor.name) private readonly anchorModel: Model<AnchorDocument>,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_NAMES.NOTIFY_DISPATCH) private readonly notifyDispatch: Queue,
    @InjectQueue(QUEUE_NAMES.POLL_CONFIRM) private readonly pollConfirm: Queue,
  ) {}

  snapshotKey(anchorId: string) {
    return `live:snapshot:${anchorId}`;
  }

  async applyProbeResult(
    anchorId: string,
    status: NormalizedLiveStatus,
    meta: { provider: string; confidence: number; title?: string; coverUrl?: string; startedAt?: Date },
  ) {
    if (status === 'probe_failed') {
      this.logger.warn(`Probe failed for ${anchorId}, keep previous state`);
      return { transition: 'none' as const };
    }

    const isLive = status === 'live';
    const anchor = await this.anchorModel.findById(anchorId);
    if (!anchor) return { transition: 'none' as const };

    await this.redis.set(
      this.snapshotKey(anchorId),
      JSON.stringify({ status, at: Date.now(), provider: meta.provider }),
      3600,
    );

    const minRebroadcast = this.config.get<number>('live.minRebroadcastMinutes') || 30;
    const confirmOffline = this.config.get<number>('live.confirmOfflinePolls') || 2;

    if (isLive) {
      anchor.consecutiveOffline = 0;
      if (anchor.liveState === 'offline') {
        if (meta.confidence < 0.8) {
          anchor.liveState = 'pending_confirm';
          await anchor.save();
          await this.pollConfirm.add(
            'confirm',
            { anchorId },
            { delay: 15_000, jobId: `confirm:${anchorId}:${Date.now()}` },
          );
          return { transition: 'pending_confirm' as const };
        }
        return this.confirmLive(anchor, meta, minRebroadcast);
      }
      if (anchor.liveState === 'pending_confirm') {
        return this.confirmLive(anchor, meta, minRebroadcast);
      }
      await anchor.save();
      return { transition: 'still_live' as const };
    }

    // not live
    if (anchor.liveState === 'live' || anchor.liveState === 'pending_confirm') {
      anchor.consecutiveOffline += 1;
      if (anchor.consecutiveOffline >= confirmOffline) {
        anchor.liveState = 'offline';
        await this.sessionModel.updateMany(
          { anchorId: anchor._id, status: 'live' },
          { $set: { status: 'ended', endedAt: new Date() } },
        );
      }
      await anchor.save();
      return { transition: 'offline_progress' as const };
    }

    anchor.liveState = 'offline';
    await anchor.save();
    return { transition: 'offline' as const };
  }

  private async confirmLive(
    anchor: AnchorDocument,
    meta: { provider: string; title?: string; coverUrl?: string; startedAt?: Date },
    minRebroadcast: number,
  ) {
    if (anchor.lastLiveAt) {
      const diff = Date.now() - new Date(anchor.lastLiveAt).getTime();
      if (diff < minRebroadcast * 60_000) {
        anchor.liveState = 'live';
        await anchor.save();
        return { transition: 'rebroadcast_cooldown' as const };
      }
    }

    const startedAt = meta.startedAt || new Date();
    const sessionKey = buildSessionKey(String(anchor._id), startedAt);
    let session: LiveSessionDocument | null = null;
    try {
      session = await this.sessionModel.create({
        anchorId: anchor._id,
        sessionKey,
        platform: anchor.platform,
        startedAt,
        status: 'live',
        provider: meta.provider,
        title: meta.title || anchor.liveTitle,
        coverUrl: meta.coverUrl || anchor.coverUrl,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        session = await this.sessionModel.findOne({ sessionKey });
        anchor.liveState = 'live';
        await anchor.save();
        return { transition: 'session_exists' as const, sessionId: session?.id };
      }
      throw err;
    }

    anchor.liveState = 'live';
    anchor.lastLiveAt = startedAt;
    if (meta.title) anchor.liveTitle = meta.title;
    if (meta.coverUrl) anchor.coverUrl = meta.coverUrl;
    await anchor.save();

    await this.notifyDispatch.add(
      'dispatch',
      { sessionId: session.id, anchorId: String(anchor._id) },
      { jobId: `dispatch:${session.id}` },
    );

    return { transition: 'live' as const, sessionId: session.id };
  }

  async listForUser(userId: string, page = 1, pageSize = 20) {
    // Sessions for anchors the user follows — simplified: all recent sessions
    const [items, total] = await Promise.all([
      this.sessionModel
        .find()
        .sort({ startedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.sessionModel.countDocuments(),
    ]);
    return { items, total, page, pageSize, userId };
  }
}

export { buildSessionKey };
