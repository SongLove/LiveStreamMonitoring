import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserAnchorCategory, CategoryDocument } from './category.schema';
import { Subscription, SubscriptionDocument } from '../subscription/subscription.schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(UserAnchorCategory.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async list(userId: string) {
    return this.categoryModel
      .find({ userId: new Types.ObjectId(userId), deleted: false })
      .sort({ sortOrder: 1 })
      .lean();
  }

  async create(userId: string, data: { name: string; color?: string; icon?: string }) {
    const count = await this.categoryModel.countDocuments({
      userId: new Types.ObjectId(userId),
      deleted: false,
    });
    if (count >= 50) throw new BadRequestException('Category limit exceeded');
    try {
      return await this.categoryModel.create({
        userId: new Types.ObjectId(userId),
        name: data.name.trim(),
        color: data.color || '#4A90E2',
        icon: data.icon || '',
        sortOrder: count,
      });
    } catch (err: any) {
      if (err?.code === 11000) throw new BadRequestException('Category name exists');
      throw err;
    }
  }

  async update(userId: string, id: string, patch: Partial<{ name: string; color: string; icon: string; sortOrder: number }>) {
    const cat = await this.categoryModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
      deleted: false,
    });
    if (!cat) throw new NotFoundException('Category not found');
    Object.assign(cat, patch);
    await cat.save();
    return cat;
  }

  async remove(userId: string, id: string) {
    const cat = await this.categoryModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
      deleted: false,
    });
    if (!cat) throw new NotFoundException('Category not found');
    cat.deleted = true;
    await cat.save();
    // Only clear relations — do not cancel subscriptions
    await this.subscriptionModel.updateMany(
      { userId: new Types.ObjectId(userId) },
      { $pull: { categoryIds: cat._id } },
    );
    return { ok: true };
  }

  async assertOwned(userId: string, categoryIds: string[]) {
    if (!categoryIds.length) return;
    const count = await this.categoryModel.countDocuments({
      _id: { $in: categoryIds.map((id) => new Types.ObjectId(id)) },
      userId: new Types.ObjectId(userId),
      deleted: false,
    });
    if (count !== categoryIds.length) {
      throw new ForbiddenException('Invalid category ownership');
    }
  }

  async batchAssign(userId: string, categoryId: string, subscriptionIds: string[]) {
    await this.assertOwned(userId, [categoryId]);
    const oid = new Types.ObjectId(categoryId);
    await this.subscriptionModel.updateMany(
      {
        _id: { $in: subscriptionIds.map((id) => new Types.ObjectId(id)) },
        userId: new Types.ObjectId(userId),
        deleted: false,
      },
      { $addToSet: { categoryIds: oid } },
    );
    return { ok: true };
  }
}
