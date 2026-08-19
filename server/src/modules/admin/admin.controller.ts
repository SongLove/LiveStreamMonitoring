import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsString, MinLength } from 'class-validator';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserService } from '../user/user.service';
import { QuotaService } from '../quota/quota.service';
import { AnchorService } from '../anchor/anchor.service';
import { CrawlerService } from '../crawler/crawler.service';
import { NotifyService } from '../notify/notify.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CategoryService } from '../category/category.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit-log.schema';
import { maskOpenId } from '../../common/utils/mask';
import { randomUUID } from 'crypto';
import { ApiResponseDto } from '../../common/swagger/api-response.dto';

export class AdjustQuotaDto {
  @ApiProperty({ example: 10, description: '正数增加，负数扣减' })
  @IsInt() delta!: number;

  @ApiProperty({ example: '客服补偿', minLength: 2 })
  @IsString() @MinLength(2) reason!: string;
}

export class BanUserDto {
  @ApiProperty({ description: 'true 封禁，false 解封' })
  @IsBoolean() banned!: boolean;

  @ApiProperty({ minLength: 2 })
  @IsString() @MinLength(2) reason!: string;
}

export class ResendNotifyDto {
  @ApiProperty({ description: 'notify_logs._id' })
  @IsString() notifyLogId!: string;

  @ApiProperty({ minLength: 2 })
  @IsString() @MinLength(2) reason!: string;
}

@ApiTags('管理后台')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard, RolesGuard)
@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly quotaService: QuotaService,
    private readonly anchorService: AnchorService,
    private readonly crawlerService: CrawlerService,
    private readonly notifyService: NotifyService,
    private readonly subscriptionService: SubscriptionService,
    private readonly categoryService: CategoryService,
    @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  private async audit(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    reason: string,
    before: Record<string, unknown> = {},
    after: Record<string, unknown> = {},
  ) {
    await this.auditModel.create({
      adminId,
      action,
      targetType,
      targetId,
      reason,
      before,
      after,
    });
  }

  @Get('users')
  @Roles('super_admin', 'user_support', 'ops_audit')
  @ApiOperation({ summary: '用户列表', description: 'openid 脱敏展示' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'banned', 'deleting'] })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async users(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.userService.listForAdmin({
      page: parseInt(page || '1', 10),
      pageSize: parseInt(pageSize || '20', 10),
      status,
    });
    return {
      ...result,
      items: result.items.map((u: any) => ({
        ...u,
        openid: maskOpenId(u.openid),
      })),
    };
  }

  @Get('users/:id')
  @Roles('super_admin', 'user_support', 'ops_audit')
  @ApiOperation({
    summary: '用户详情',
    description: '只读：关注、分类、额度、推送记录；默认不允许代改分类/订阅',
  })
  @ApiParam({ name: 'id', description: 'users._id' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async userDetail(@Param('id') id: string) {
    const profile = await this.userService.getProfile(id);
    const user = await this.userService.findById(id);
    const quota = await this.quotaService.getSnapshot(id);
    const subscriptions = await this.subscriptionService.list(id);
    const categories = await this.categoryService.list(id);
    const notifyLogs = await this.notifyService.listForUser(id, 1, 20);
    return {
      profile: { ...profile, openid: maskOpenId(user.openid) },
      quota,
      subscriptions,
      categories,
      notifyLogs,
    };
  }

  @Post('users/:id/ban')
  @Roles('super_admin', 'user_support')
  @ApiOperation({ summary: '封禁/解封用户', description: '必须填写 reason，写入 audit_logs' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  async ban(
    @CurrentUser() admin: { adminId: string },
    @Param('id') id: string,
    @Body() body: BanUserDto,
  ) {
    const before = await this.userService.findById(id);
    const after = await this.userService.ban(id, body.banned);
    await this.audit(
      admin.adminId,
      body.banned ? 'user.ban' : 'user.unban',
      'user',
      id,
      body.reason,
      { status: before.status },
      { status: after?.status },
    );
    return { ok: true };
  }

  @Post('users/:id/quota/adjust')
  @Roles('super_admin')
  @ApiOperation({ summary: '人工调整额度', description: 'super_admin；写入账本与审计' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  async adjustQuota(
    @CurrentUser() admin: { adminId: string },
    @Param('id') id: string,
    @Body() body: AdjustQuotaDto,
  ) {
    const before = await this.quotaService.getSnapshot(id);
    const after = await this.quotaService.adjust(
      id,
      body.delta,
      `adjust:${id}:${randomUUID()}`,
      body.reason,
    );
    await this.audit(
      admin.adminId,
      'quota.adjust',
      'user',
      id,
      body.reason,
      before,
      after,
    );
    return after;
  }

  @Post('notify/resend')
  @Roles('super_admin', 'user_support')
  @ApiOperation({ summary: '补发推送', description: '记录审计；V1 为里程碑 stub' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  async resend(
    @CurrentUser() admin: { adminId: string },
    @Body() body: ResendNotifyDto,
  ) {
    await this.audit(
      admin.adminId,
      'notify.resend',
      'notify_log',
      body.notifyLogId,
      body.reason,
    );
    return { ok: true, message: 'Resend queued (manual milestone path)' };
  }

  @Get('anchors')
  @Roles('super_admin', 'content_ops', 'ops_audit')
  @ApiOperation({ summary: '主播池列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  anchors(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.anchorService.adminList(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
    );
  }

  @Get('providers/health')
  @Roles('super_admin', 'ops_audit')
  @ApiOperation({
    summary: 'Provider 健康摘要',
    description: '不含完整 Cookie/签名凭证',
  })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  providersHealth() {
    return this.crawlerService.healthSummary();
  }

  @Get('audit-logs')
  @Roles('super_admin', 'ops_audit')
  @ApiOperation({ summary: '操作审计日志' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async auditLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = parseInt(page || '1', 10);
    const ps = parseInt(pageSize || '20', 10);
    const [items, total] = await Promise.all([
      this.auditModel
        .find()
        .sort({ createdAt: -1 })
        .skip((p - 1) * ps)
        .limit(ps)
        .lean(),
      this.auditModel.countDocuments(),
    ]);
    return { items, total, page: p, pageSize: ps };
  }
}
