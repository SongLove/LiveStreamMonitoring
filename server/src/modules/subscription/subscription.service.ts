import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from './subscription.schema';
import { UserService } from '../user/user.service';
import { AnchorService } from '../anchor/anchor.service';
import { CategoryService } from '../category/category.service';
import { shouldReplaceCategoryIds } from './category-ids';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subModel: Model<SubscriptionDocument>,
    private readonly userService: UserService,
    private readonly anchorService: AnchorService,
    private readonly categoryService: CategoryService,
  ) {}

  async list(userId: string) {
    return this.subModel
      .find({ userId: new Types.ObjectId(userId), deleted: false })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
  }

  async findActive(userId: string, anchorId: string) {
    return this.subModel.findOne({
      userId: new Types.ObjectId(userId),
      anchorId: new Types.ObjectId(anchorId),
      deleted: false,
    });
  }

  async add(userId: string, anchorId: string, categoryIds: string[] = []) {
    await this.userService.assertCanWrite(userId);
    await this.anchorService.findById(anchorId);
    await this.categoryService.assertOwned(userId, categoryIds);

    const count = await this.subModel.countDocuments({
      userId: new Types.ObjectId(userId),
      deleted: false,
    });
    if (count >= 200) throw new BadRequestException('Subscription limit exceeded');

    const existing = await this.subModel.findOne({
      userId: new Types.ObjectId(userId),
      anchorId: new Types.ObjectId(anchorId),
    });

    if (existing) {
      const wasActive = !existing.deleted && existing.enabled;
      existing.deleted = false;
      existing.enabled = true;
      if (categoryIds.length) {
        existing.categoryIds = categoryIds.map((id) => new Types.ObjectId(id));
      }
      await existing.save();
      if (!wasActive) await this.anchorService.bumpSubscriberCount(anchorId, 1);
      return existing;
    }

    const created = await this.subModel.create({
      userId: new Types.ObjectId(userId),
      anchorId: new Types.ObjectId(anchorId),
      enabled: true,
      categoryIds: categoryIds.map((id) => new Types.ObjectId(id)),
    });
    await this.anchorService.bumpSubscriberCount(anchorId, 1);
    return created;
  }

  async update(
    userId: string,
    id: string,
    patch: Partial<{ enabled: boolean; remark: string; sortOrder: number; categoryIds: string[] }>,
  ) {
    const sub = await this.subModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
      deleted: false,
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (shouldReplaceCategoryIds(patch.categoryIds)) {
      await this.categoryService.assertOwned(userId, patch.categoryIds);
      sub.categoryIds = patch.categoryIds.map((c) => new Types.ObjectId(c));
    }
    if (patch.enabled !== undefined) sub.enabled = patch.enabled;
    if (patch.remark !== undefined) sub.remark = patch.remark;
    if (patch.sortOrder !== undefined) sub.sortOrder = patch.sortOrder;
    await sub.save();
    return sub;
  }

  async remove(userId: string, id: string) {
    const sub = await this.subModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
      deleted: false,
    });
    if (!sub) return { ok: true };
    sub.deleted = true;
    sub.enabled = false;
    await sub.save();
    await this.anchorService.bumpSubscriberCount(String(sub.anchorId), -1);
    return { ok: true };
  }

  async batch(
    userId: string,
    payload: { ids: string[]; enabled?: boolean; categoryIds?: string[] },
  ) {
    if (payload.ids.length > 100) throw new BadRequestException('Batch limit 100');
    if (shouldReplaceCategoryIds(payload.categoryIds)) {
      await this.categoryService.assertOwned(userId, payload.categoryIds);
    }
    const update: Record<string, unknown> = {};
    if (payload.enabled !== undefined) update.enabled = payload.enabled;
    if (shouldReplaceCategoryIds(payload.categoryIds)) {
      update.categoryIds = payload.categoryIds.map((id) => new Types.ObjectId(id));
    }
    await this.subModel.updateMany(
      {
        _id: { $in: payload.ids.map((id) => new Types.ObjectId(id)) },
        userId: new Types.ObjectId(userId),
        deleted: false,
      },
      { $set: update },
    );
    return { ok: true };
  }

  async listEnabledByAnchor(anchorId: string) {
    return this.subModel
      .find({
        anchorId: new Types.ObjectId(anchorId),
        enabled: true,
        deleted: false,
      })
      .lean();
  }
}
