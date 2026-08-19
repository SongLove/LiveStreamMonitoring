import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async findById(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getProfile(userId: string) {
    const user = await this.findById(userId);
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      status: user.status,
      settings: user.settings,
      templateAuth: user.templateAuth,
      lastActiveAt: user.lastActiveAt,
    };
  }

  async updateSettings(userId: string, patch: Partial<User['settings']>) {
    const user = await this.findById(userId);
    if (user.status === 'banned') {
      throw new ForbiddenException({ code: 40301, message: 'Account banned' });
    }
    user.settings = { ...user.settings, ...patch };
    await user.save();
    return user.settings;
  }

  async assertCanWrite(userId: string) {
    const user = await this.findById(userId);
    if (user.status === 'banned') {
      throw new ForbiddenException({ code: 40301, message: 'Account banned' });
    }
    if (user.status === 'deleting') {
      throw new ForbiddenException({ code: 40302, message: 'Account deleting' });
    }
    return user;
  }

  async setTemplateAuth(userId: string, templateId: string, status: 'accept' | 'reject') {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { [`templateAuth.${templateId}`]: status } },
    );
  }

  async setTemplateAuthByOpenId(openid: string, templateId: string, status: 'accept' | 'reject') {
    await this.userModel.updateOne(
      { openid },
      { $set: { [`templateAuth.${templateId}`]: status } },
    );
  }

  async findByOpenId(openid: string) {
    return this.userModel.findOne({ openid });
  }

  async listForAdmin(query: { page?: number; pageSize?: number; status?: string }) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, query.pageSize || 20);
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ lastActiveAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);
    return { items, total, page, pageSize };
  }

  async ban(userId: string, banned: boolean) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { status: banned ? 'banned' : 'active' },
      { new: true },
    );
  }
}
