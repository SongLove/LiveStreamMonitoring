export interface ApiResponseBody<T = unknown> {
    code: number;
    message: string;
    data: T;
    traceId?: string;
}
export declare function ok<T>(data: T, message?: string, traceId?: string): ApiResponseBody<T>;
export declare function fail(code: number, message: string, data?: unknown, traceId?: string): ApiResponseBody;
