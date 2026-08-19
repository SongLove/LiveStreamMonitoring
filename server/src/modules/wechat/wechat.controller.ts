import { Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { WechatService } from './wechat.service';

@ApiTags('微信回调')
@Controller('api/v1/wechat')
export class WechatController {
  constructor(private readonly wechatService: WechatService) {}

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
  async callback(@Req() req: Request, @Query() query: Record<string, string>) {
    if (!this.wechatService.verifyCallbackSignature(query)) {
      return { ok: false };
    }
    const body = req.body;
    const event = String(body?.Event || body?.event || '').toLowerCase();
    if (event.includes('subscribe_msg') && event.includes('sent')) {
      await this.wechatService.handleNotifyResultCallback(body);
    } else {
      await this.wechatService.handleSubscribeCallback(body);
    }
    return { ok: true };
  }
}
