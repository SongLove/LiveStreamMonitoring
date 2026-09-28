export declare class ApiResponseDto<T = unknown> {
    code: number;
    message: string;
    data: T;
    traceId?: string;
}
export declare class PaginationQueryDto {
    page?: number;
    pageSize?: number;
}
