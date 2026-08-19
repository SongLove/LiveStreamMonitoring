import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** 统一 API 响应包装 */
export class ApiResponseDto<T = unknown> {
  @ApiProperty({ example: 0, description: '业务状态码，0 表示成功' })
  code!: number;

  @ApiProperty({ example: 'ok' })
  message!: string;

  @ApiProperty({ description: '业务数据' })
  data!: T;

  @ApiPropertyOptional({ example: 'trace-uuid', description: '链路追踪 ID' })
  traceId?: string;
}

export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  pageSize?: number;
}
