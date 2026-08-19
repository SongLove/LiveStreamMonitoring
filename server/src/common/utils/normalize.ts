/** Normalize WeChat list fields that may be a single object or an array. */
export function normalizeWechatList<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
