import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtClientGuard } from '../../common/guards/jwt-client.guard';
import { LiveService } from './live.service';
import { ApiResponseDto } from '../../common/swagger/api-response.dto';

@ApiTags('小程序-直播')
@ApiBearerAuth('client-jwt')
@UseGuards(JwtClientGuard)
@Controller('api/v1/live')
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Get('sessions')
  @ApiOperation({ summary: '历史开播会话', description: '直播回放/历史动态列表' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 20 })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  sessions(
    @CurrentUser() user: { userId: string },
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.liveService.listForUser(
      user.userId,
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
    );
  }
}
