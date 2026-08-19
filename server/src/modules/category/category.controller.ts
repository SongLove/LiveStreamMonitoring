import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ArrayMaxSize } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtClientGuard } from '../../common/guards/jwt-client.guard';
import { CategoryService } from './category.service';
import { ApiResponseDto } from '../../common/swagger/api-response.dto';

export class CreateCategoryDto {
  @ApiProperty({ example: '常看', maxLength: 20 })
  @IsString() name!: string;

  @ApiPropertyOptional({ example: '#FF5722' })
  @IsOptional() @IsString() color?: string;

  @ApiPropertyOptional({ example: 'star' })
  @IsOptional() @IsString() icon?: string;
}

export class BatchAssignCategoryDto {
  @ApiProperty({ type: [String], maxItems: 100, description: 'subscriptions._id 列表' })
  @IsArray() @ArrayMaxSize(100) @IsString({ each: true })
  subscriptionIds!: string[];
}

@ApiTags('小程序-分类')
@ApiBearerAuth('client-jwt')
@UseGuards(JwtClientGuard)
@Controller('api/v1/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: '我的分类列表', description: '含每类主播数量；未分类为虚拟视图' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  list(@CurrentUser() user: { userId: string }) {
    return this.categoryService.list(user.userId);
  }

  @Post()
  @ApiOperation({ summary: '创建 DIY 分类' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  create(@CurrentUser() user: { userId: string }, @Body() body: CreateCategoryDto) {
    return this.categoryService.create(user.userId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改分类' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: CreateCategoryDto,
  ) {
    return this.categoryService.update(user.userId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分类', description: '只清分类关系，不取消监听' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.categoryService.remove(user.userId, id);
  }

  @Post(':id/subscriptions')
  @ApiOperation({ summary: '批量归入分类' })
  @ApiParam({ name: 'id', description: 'categories._id' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  batchAssign(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: BatchAssignCategoryDto,
  ) {
    return this.categoryService.batchAssign(user.userId, id, body.subscriptionIds);
  }
}
