import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtClientGuard } from '../../common/guards/jwt-client.guard';
import { QuotaService } from './quota.service';
import { ApiResponseDto } from '../../common/swagger/api-response.dto';

@ApiTags('小程序-额度')
@ApiBearerAuth('client-jwt')
@UseGuards(JwtClientGuard)
@Controller('api/v1/quota')
export class QuotaController {
  constructor(private readonly quotaService: QuotaService) {}

  @Get()
  @ApiOperation({
    summary: '查询额度与最近流水',
    description: '返回 balance、maxBalance 与 recentLedger',
  })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async get(@CurrentUser() user: { userId: string }) {
    const snap = await this.quotaService.getSnapshot(user.userId);
    const ledger = await this.quotaService.listLedger(user.userId, 10);
    return { ...snap, recentLedger: ledger };
  }

  @Post('refresh')
  @ApiOperation({
    summary: '刷新额度展示',
    description: '只读查询，**不会**发放额度；发放仅来自微信订阅回调',
  })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  async refresh(@CurrentUser() user: { userId: string }) {
    return this.quotaService.refreshReadOnly(user.userId);
  }

  @Post('grant')
  @ApiOperation({
    summary: '（禁止）Client 伪造发放',
    description: '始终拒绝，用于验收 Client 不能自行加次数',
  })
  @ApiResponse({ status: 403, description: 'Quota grant only via WeChat callback' })
  async forgeGrant() {
    this.quotaService.rejectClientGrant();
  }
}
