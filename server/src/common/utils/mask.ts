export function maskOpenId(openid?: string | null): string {
  if (!openid) return '';
  if (openid.length <= 8) return '****';
  return `${openid.slice(0, 4)}****${openid.slice(-4)}`;
}

export function maskSecret(value?: string | null): string {
  if (!value) return '';
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}
