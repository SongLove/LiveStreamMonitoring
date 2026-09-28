import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { JwtClientGuard } from '../../common/guards/jwt-client.guard';
import { AnchorService } from './anchor.service';
import { Platform } from './anchor.schema';
import { ApiResponseDto } from '../../common/swagger/api-response.dto';

export class ResolveAnchorDto {
  @ApiProperty({ enum: ['bilibili', 'douyin', 'kuaishou'], example: 'kuaishou' })
  @IsIn(['bilibili', 'douyin', 'kuaishou'])
  platform!: Platform;

  @ApiProperty({
    example: 'https://live.bilibili.com/12345',
    description: '关键词、平台 ID、直播间链接或分享文案',
  })
  @IsString()
  input!: string;
}

@ApiTags('小程序-主播')
@ApiBearerAuth('client-jwt')
@UseGuards(JwtClientGuard)
@Controller('api/v1/anchors')
export class AnchorController {
  constructor(private readonly anchorService: AnchorService) {}

  @Get('search')
  @ApiOperation({ summary: '搜索主播', description: '先查本地池，未命中可调 Provider 解析（限流）' })
  @ApiQuery({ name: 'platform', enum: ['bilibili', 'douyin', 'kuaishou'], required: false })
  @ApiQuery({ name: 'q', description: '搜索关键词', example: '某某主播' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async search(
    @Query('platform') platform: Platform,
    @Query('q') q: string,
  ) {
    return this.anchorService.search(platform || 'bilibili', q || '');
  }

  @Post('resolve')
  @ApiOperation({ summary: '解析主播链接/ID', description: '归一化输入并入库或复用全局主播' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async resolve(@Body() body: ResolveAnchorDto) {
    return this.anchorService.resolve(body.platform, body.input);
  }

  @Get('pool')
  @ApiOperation({ summary: '主播广场推荐', description: 'V1 返回 stub，V1.1 接推荐专题' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async pool() {
    return { sets: [], message: 'Recommendation pool stub for V1' };
  }

  @Get(':id')
  @ApiOperation({ summary: '主播详情' })
  @ApiParam({ name: 'id', description: 'anchors 集合 _id' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async detail(@Param('id') id: string) {
    return this.anchorService.findById(id);
  }
}
