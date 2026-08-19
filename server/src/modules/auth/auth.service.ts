import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../user/user.schema';
import { Admin, AdminDocument } from '../admin/admin.schema';
import { WechatService } from '../wechat/wechat.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    private readonly wechatService: WechatService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async clientLogin(code: string) {
    const { openid } = await this.wechatService.code2Session(code);
    let user = await this.userModel.findOne({ openid });
    if (!user) {
      user = await this.userModel.create({ openid, lastActiveAt: new Date() });
    } else {
      user.lastActiveAt = new Date();
      await user.save();
    }
    const accessToken = this.jwt.sign(
      { sub: user.id, openid: user.openid, typ: 'client' },
      {
        secret: this.config.get('jwt.clientSecret'),
        expiresIn: this.config.get('jwt.clientExpires'),
      },
    );
    return {
      accessToken,
      user: {
        id: user.id,
        status: user.status,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async adminLogin(username: string, password: string) {
    await this.ensureBootstrapAdmin();
    const admin = await this.adminModel.findOne({ username });
    if (!admin || !admin.enabled) {
      throw new Error('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) throw new Error('Invalid credentials');
    const accessToken = this.jwt.sign(
      {
        sub: admin.id,
        username: admin.username,
        roles: admin.roles,
        typ: 'admin',
      },
      {
        secret: this.config.get('jwt.adminSecret'),
        expiresIn: this.config.get('jwt.adminExpires'),
      },
    );
    return {
      accessToken,
      admin: { id: admin.id, username: admin.username, roles: admin.roles },
    };
  }

  async ensureBootstrapAdmin() {
    const count = await this.adminModel.countDocuments();
    if (count > 0) return;
    const username = this.config.get<string>('admin.bootstrapUsername') || 'admin';
    const password = this.config.get<string>('admin.bootstrapPassword') || 'admin123456';
    const passwordHash = await bcrypt.hash(password, 10);
    await this.adminModel.create({
      username,
      passwordHash,
      roles: ['super_admin'],
      enabled: true,
    });
  }
}
