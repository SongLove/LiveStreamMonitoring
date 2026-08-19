import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtClientGuard } from '../../common/guards/jwt-client.guard';
import { NotifyService } from './notify.service';
import { ConfigService } from '@nestjs/config';
import { WechatService } from '../wechat/wechat.service';
import { UserService } from '../user/user.service';
import { QuotaService } from '../quota/quota.service';
import { ApiResponseDto } from '../../common/swagger/api-response.dto';

export class NotifyTestDto {
  @ApiPropertyOptional({ example: '测试开播提醒', description: '模板 thing 字段内容' })
  message?: string;
}

@ApiTags('小程序-推送')
@ApiBearerAuth('client-jwt')
@UseGuards(JwtClientGuard)
@Controller('api/v1')
export class NotifyController {
  constructor(
    private readonly notifyService: NotifyService,
    private readonly wechatService: WechatService,
    private readonly userService: UserService,
    private readonly quotaService: QuotaService,
    private readonly config: ConfigService,
  ) {}

  @Get('notify/logs')
  @ApiOperation({ summary: '推送记录', description: '含跳过原因与微信错误码' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 20 })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  logs(
    @CurrentUser() user: { userId: string },
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.notifyService.listForUser(
      user.userId,
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
    );
  }

  @Post('notify/test')
  @ApiOperation({
    summary: '发送测试推送',
    description: '走完整扣减与微信下发；限流 3 次/分钟',
  })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async test(@CurrentUser() user: { userId: string }, @Body() body: NotifyTestDto) {
    const templateId =
      this.config.get<string>('wechat.subscribeTemplateId') || 'TMPL_LIVE_NOTIFY';
    const u = await this.userService.findById(user.userId);
    const snap = await this.quotaService.getSnapshot(user.userId);
    if (snap.balance <= 0) {
      return { ok: false, reason: 'quota_insufficient' };
    }
    const deductKey = `deduct:test:${user.userId}:${Date.now()}`;
    const ok = await this.quotaService.deduct(user.userId, deductKey, 'manual_test');
    if (!ok) return { ok: false, reason: 'quota_insufficient' };
    const result = await this.wechatService.sendSubscribeMessage({
      openid: u.openid,
      templateId,
      page: 'pages/index/index',
      data: {
        thing1: { value: this.wechatService.truncateField(body.message || '测试开播提醒') },
        thing2: { value: '测试直播间' },
        time3: { value: new Date().toISOString().slice(0, 19).replace('T', ' ') },
      },
    });
    if (result.errcode !== 0 && this.wechatService.shouldRefundError(result.errcode)) {
      await this.quotaService.refund(user.userId, `refund:test:${deductKey}`, 'test_fail');
    }
    return { ok: result.errcode === 0, result };
  }

  @Get('diagnose/auth')
  @ApiOperation({ summary: '检查订阅权限', description: '模板授权状态与修复指引数据' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async diagnose(@CurrentUser() user: { userId: string }) {
    const u = await this.userService.findById(user.userId);
    const quota = await this.quotaService.getSnapshot(user.userId);
    return {
      status: u.status,
      templateAuth: u.templateAuth,
      notifyEnabled: u.settings.notifyEnabled,
      quota,
    };
  }

  @Get('help/faq')
  @ApiOperation({ summary: '帮助中心 FAQ' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  faq() {
    return {
      items: [
        { q: '如何获得推送次数？', a: '在小程序内授权订阅消息，微信回调后自动发放。' },
        { q: '为什么没有收到提醒？', a: '请检查总开关、免打扰、额度与模板授权状态。' },
      ],
    };
  }

  @Get('config/app')
  @ApiOperation({ summary: '客户端配置下发', description: '模板 ID、功能开关；不含密钥' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  appConfig() {
    return {
      templates: {
        liveNotify: this.config.get('wechat.subscribeTemplateId'),
      },
      features: { studentMode: true, largeAccountOnly: true },
    };
  }
}
