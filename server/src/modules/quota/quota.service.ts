import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { QuotaLedger, QuotaLedgerDocument } from './quota-ledger.schema';
import { UserQuota, UserQuotaDocument } from './user-quota.schema';

@Injectable()
export class QuotaService {
  private readonly logger = new Logger(QuotaService.name);

  constructor(
    @InjectModel(QuotaLedger.name) private readonly ledgerModel: Model<QuotaLedgerDocument>,
    @InjectModel(UserQuota.name) private readonly quotaModel: Model<UserQuotaDocument>,
    private readonly config: ConfigService,
  ) {}

  async getSnapshot(userId: string) {
    const maxBalance = this.config.get<number>('quota.maxBalance') || 200;
    let snap = await this.quotaModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!snap) {
      snap = await this.quotaModel.create({
        userId: new Types.ObjectId(userId),
        balance: 0,
        maxBalance,
      });
    }
    return { balance: snap.balance, maxBalance: snap.maxBalance };
  }

  /** Client refresh: read-only, never grants. */
  async refreshReadOnly(userId: string) {
    return this.getSnapshot(userId);
  }

  /** Reject any client-side forge grant attempt. */
  rejectClientGrant(): never {
    throw new BadRequestException({
      code: 40010,
      message: 'Quota grant only via WeChat subscribe callback',
    });
  }

  async grantFromWechatCallback(params: {
    userId: string;
    templateId: string;
    idempotencyKey: string;
    meta?: Record<string, unknown>;
  }): Promise<{ granted: boolean; balance: number }> {
    const maxBalance = this.config.get<number>('quota.maxBalance') || 200;
    const userOid = new Types.ObjectId(params.userId);

    try {
      await this.ledgerModel.create({
        userId: userOid,
        type: 'grant',
        amount: 1,
        idempotencyKey: params.idempotencyKey,
        templateId: params.templateId,
        reason: 'wechat_subscribe_accept',
        meta: params.meta || {},
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        const snap = await this.getSnapshot(params.userId);
        return { granted: false, balance: snap.balance };
      }
      throw err;
    }

    const snap = await this.quotaModel.findOneAndUpdate(
      { userId: userOid },
      [
        {
          $set: {
            balance: {
              $min: [
                maxBalance,
                { $add: [{ $ifNull: ['$balance', 0] }, 1] },
              ],
            },
            maxBalance,
          },
        },
      ],
      { upsert: true, new: true },
    );

    return { granted: true, balance: snap?.balance ?? 0 };
  }

  async deduct(userId: string, idempotencyKey: string, reason = 'notify_send'): Promise<boolean> {
    const userOid = new Types.ObjectId(userId);
    try {
      await this.ledgerModel.create({
        userId: userOid,
        type: 'deduct',
        amount: -1,
        idempotencyKey,
        reason,
      });
    } catch (err: any) {
      if (err?.code === 11000) return true;
      throw err;
    }

    const updated = await this.quotaModel.findOneAndUpdate(
      { userId: userOid, balance: { $gt: 0 } },
      { $inc: { balance: -1 } },
      { new: true },
    );

    if (!updated) {
      await this.ledgerModel.deleteOne({ idempotencyKey }).catch(() => undefined);
      return false;
    }
    return true;
  }

  async refund(userId: string, idempotencyKey: string, reason = 'notify_refund'): Promise<void> {
    const maxBalance = this.config.get<number>('quota.maxBalance') || 200;
    const userOid = new Types.ObjectId(userId);
    try {
      await this.ledgerModel.create({
        userId: userOid,
        type: 'refund',
        amount: 1,
        idempotencyKey,
        reason,
      });
    } catch (err: any) {
      if (err?.code === 11000) return;
      throw err;
    }
    await this.quotaModel.findOneAndUpdate(
      { userId: userOid },
      [
        {
          $set: {
            balance: {
              $min: [maxBalance, { $add: [{ $ifNull: ['$balance', 0] }, 1] }],
            },
          },
        },
      ],
      { upsert: true },
    );
  }

  async adjust(
    userId: string,
    delta: number,
    idempotencyKey: string,
    reason: string,
  ): Promise<{ balance: number }> {
    if (!reason?.trim()) {
      throw new BadRequestException('Reason required for quota adjust');
    }
    const maxBalance = this.config.get<number>('quota.maxBalance') || 200;
    const userOid = new Types.ObjectId(userId);
    try {
      await this.ledgerModel.create({
        userId: userOid,
        type: 'adjust',
        amount: delta,
        idempotencyKey,
        reason,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        return this.getSnapshot(userId);
      }
      throw err;
    }
    const snap = await this.quotaModel.findOneAndUpdate(
      { userId: userOid },
      [
        {
          $set: {
            balance: {
              $max: [
                0,
                {
                  $min: [
                    maxBalance,
                    { $add: [{ $ifNull: ['$balance', 0] }, delta] },
                  ],
                },
              ],
            },
            maxBalance,
          },
        },
      ],
      { upsert: true, new: true },
    );
    return { balance: snap?.balance ?? 0 };
  }

  async listLedger(userId: string, limit = 20) {
    return this.ledgerModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}
