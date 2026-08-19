export interface ApiResponseBody<T = unknown> {
  code: number;
  message: string;
  data: T;
  traceId?: string;
}

export function ok<T>(data: T, message = 'ok', traceId?: string): ApiResponseBody<T> {
  return { code: 0, message, data, traceId };
}

export function fail(
  code: number,
  message: string,
  data: unknown = null,
  traceId?: string,
): ApiResponseBody {
  return { code, message, data, traceId };
}
