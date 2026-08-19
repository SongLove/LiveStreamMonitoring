import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtClientGuard } from '../../common/guards/jwt-client.guard';
import { UserService } from './user.service';
import { QuotaService } from '../quota/quota.service';
import { ApiResponseDto } from '../../common/swagger/api-response.dto';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: '推送总开关' })
  @IsOptional() @IsBoolean() notifyEnabled?: boolean;

  @ApiPropertyOptional({ description: '免打扰开关' })
  @IsOptional() @IsBoolean() dndEnabled?: boolean;

  @ApiPropertyOptional({ example: '23:00', description: '免打扰开始 HH:mm' })
  @IsOptional() @IsString() dndStart?: string;

  @ApiPropertyOptional({ example: '08:00', description: '免打扰结束 HH:mm，可跨零点' })
  @IsOptional() @IsString() dndEnd?: string;

  @ApiPropertyOptional({ description: '学生党模式（仅节假日推送）' })
  @IsOptional() @IsBoolean() studentMode?: boolean;

  @ApiPropertyOptional({ description: '仅推送大号主播' })
  @IsOptional() @IsBoolean() largeAccountOnly?: boolean;

  @ApiPropertyOptional({ example: 30, description: '同主播冷却分钟数' })
  @IsOptional() @IsInt() @Min(0) cooldownMinutes?: number;
}

@ApiTags('小程序-用户')
@ApiBearerAuth('client-jwt')
@UseGuards(JwtClientGuard)
@Controller('api/v1/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly quotaService: QuotaService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: '获取用户资料', description: '返回资料、设置摘要与额度余额' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async profile(@CurrentUser() user: { userId: string }) {
    const profile = await this.userService.getProfile(user.userId);
    const quota = await this.quotaService.getSnapshot(user.userId);
    return { ...profile, quota: { balance: quota.balance, maxBalance: quota.maxBalance } };
  }

  @Put('settings')
  @ApiOperation({ summary: '更新推送设置', description: '总开关、免打扰、学生党、仅大号、冷却时间' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async settings(
    @CurrentUser() user: { userId: string },
    @Body() body: UpdateSettingsDto,
  ) {
    return this.userService.updateSettings(user.userId, body);
  }
}
