import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { WechatService } from './wechat.service';
import { JwtClientGuard } from '../../common/guards/jwt-client.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';
import { parseWechatCallbackBody } from './wechat-callback.parse';

@ApiTags('微信回调')
@Controller('api/v1/wechat')
export class WechatController {
  constructor(
    private readonly wechatService: WechatService,
    private readonly config: ConfigService,
  ) {}

  @Get('callback')
  @ApiOperation({
    summary: '微信服务器 URL 验证',
    description: '配置小程序服务器地址时的 GET 验签；返回 echostr',
  })
  @ApiQuery({ name: 'signature', required: true })
  @ApiQuery({ name: 'timestamp', required: true })
  @ApiQuery({ name: 'nonce', required: true })
  @ApiQuery({ name: 'echostr', required: false })
  @ApiResponse({ status: 200, description: '验签成功返回 echostr' })
  @ApiResponse({ status: 403, description: '签名无效' })
  verify(@Query() query: Record<string, string>, @Res() res: Response) {
    if (!this.wechatService.verifyCallbackSignature(query)) {
      return res.status(403).send('invalid signature');
    }
    return res.status(200).send(query.echostr || 'ok');
  }

  @Post('callback')
  @ApiOperation({
    summary: '微信事件推送',
    description:
      '订阅弹窗结果（发放额度）、拒收、下发回执。支持单对象/数组列表归一化。此接口由微信服务器调用，非 Client。',
  })
  @ApiQuery({ name: 'signature', required: true })
  @ApiQuery({ name: 'timestamp', required: true })
  @ApiQuery({ name: 'nonce', required: true })
  @ApiResponse({ status: 201, description: '处理成功' })
  async callback(@Req() req: Request, @Query() query: Record<string, string>, @Res() res: Response) {
    if (!this.wechatService.verifyCallbackSignature(query)) {
      return res.status(403).send('invalid signature');
    }
    const raw = req.body;
    const parsed = parseWechatCallbackBody(raw);
    const event = parsed.event.toLowerCase();
    if (event.includes('subscribe_msg') && event.includes('sent')) {
      await this.wechatService.handleNotifyResultCallback(
        typeof raw === 'object' && raw != null && !Array.isArray(raw) ? raw : parsed,
      );
    } else {
      await this.wechatService.handleSubscribeCallback(raw);
    }
    // 微信要求明文 success；避免 TransformInterceptor 包一层 JSON
    return res.status(200).send('success');
  }

  /**
   * 本地开发：WECHAT_APPID 未配置时，无法收到微信服务器推送。
   * 仅 mock 模式允许 Client 上报 accept 以走同一套 grant 账本。
   */
  @Post('mock-subscribe-accept')
  @ApiBearerAuth('client-jwt')
  @UseGuards(JwtClientGuard)
  @ApiOperation({
    summary: '（仅本地 mock）模拟订阅授权到账',
    description:
      '仅当未配置 WECHAT_APPID 时可用；生产环境禁止。额度仍走 grantFromWechatCallback。',
  })
  @ApiResponse({ status: 201, description: '模拟发放结果' })
  async mockSubscribeAccept(
    @CurrentUser() user: { userId: string },
    @Body() body: { templateId?: string; status?: string },
  ) {
    if (!this.wechatService.isMockMode()) {
      throw new ForbiddenException(
        '已配置 WECHAT_APPID：额度只能由微信服务器回调发放',
      );
    }
    const status = String(body?.status || 'accept').toLowerCase();
    if (status !== 'accept') {
      return { granted: false, reason: status, balance: null };
    }
    const templateId =
      body?.templateId ||
      this.config.get<string>('wechat.subscribeTemplateId') ||
      'TMPL_LIVE_NOTIFY';
    return this.wechatService.mockGrantAccept(user.userId, templateId);
  }
}
