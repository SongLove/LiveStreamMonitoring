import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ArrayMaxSize,
} from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtClientGuard } from '../../common/guards/jwt-client.guard';
import { SubscriptionService } from './subscription.service';
import { ApiResponseDto } from '../../common/swagger/api-response.dto';

export class CreateSubscriptionDto {
  @ApiProperty({ description: '全局主播 anchors._id' })
  @IsString() anchorId!: string;

  @ApiPropertyOptional({ type: [String], description: '可选分类 ID 列表' })
  @IsOptional() @IsArray() @IsString({ each: true }) categoryIds?: string[];
}

export class PatchSubscriptionDto {
  @ApiPropertyOptional()
  @IsOptional() @IsBoolean() enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsString() remark?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() categoryIds?: string[];

  @ApiPropertyOptional()
  @IsOptional() sortOrder?: number;
}

export class BatchSubscriptionDto {
  @ApiProperty({ type: [String], maxItems: 100 })
  @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) ids!: string[];

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean() enabled?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() categoryIds?: string[];
}

@ApiTags('小程序-订阅')
@ApiBearerAuth('client-jwt')
@UseGuards(JwtClientGuard)
@Controller('api/v1/subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @ApiOperation({ summary: '我的监听列表' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  list(@CurrentUser() user: { userId: string }) {
    return this.subscriptionService.list(user.userId);
  }

  @Post()
  @ApiOperation({ summary: '添加监听', description: '幂等：同一主播不重复创建' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  add(@CurrentUser() user: { userId: string }, @Body() body: CreateSubscriptionDto) {
    return this.subscriptionService.add(user.userId, body.anchorId, body.categoryIds || []);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新订阅', description: '开关、备注、排序、分类' })
  @ApiParam({ name: 'id', description: 'subscriptions._id' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: PatchSubscriptionDto,
  ) {
    return this.subscriptionService.update(user.userId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '取消监听', description: '软删除，保留历史推送关联' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.subscriptionService.remove(user.userId, id);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量开关/归类' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  batch(@CurrentUser() user: { userId: string }, @Body() body: BatchSubscriptionDto) {
    return this.subscriptionService.batch(user.userId, body);
  }
}
