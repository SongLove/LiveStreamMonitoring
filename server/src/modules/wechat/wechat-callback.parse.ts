import { normalizeWechatList } from '../../common/utils/normalize';

export type WechatSubscribeEventItem = {
  templateId: string;
  status: string;
  popupScene?: string;
};

export type ParsedWechatCallback = {
  event: string;
  fromUserName: string;
  createTime: string;
  items: WechatSubscribeEventItem[];
  encrypted: boolean;
};

function extractTag(block: string, tag: string): string {
  const cdata = new RegExp(`<${tag}><!\\[CDATA\\[([^\\]]*)\\]\\]></${tag}>`, 'i').exec(block);
  if (cdata?.[1] != null) return String(cdata[1]).trim();
  const plain = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i').exec(block);
  return plain?.[1] != null ? String(plain[1]).trim() : '';
}

function parseSubscribeListBlocks(xml: string): WechatSubscribeEventItem[] {
  const items: WechatSubscribeEventItem[] = [];
  const listRe = /<List>([\s\S]*?)<\/List>/gi;
  let m: RegExpExecArray | null;
  while ((m = listRe.exec(xml))) {
    const block = m[1] || '';
    const templateId = extractTag(block, 'TemplateId');
    const status = extractTag(block, 'SubscribeStatusString');
    if (!templateId && !status) continue;
    items.push({
      templateId,
      status,
      popupScene: extractTag(block, 'PopupScene') || undefined,
    });
  }
  return items;
}

function parseXmlCallback(raw: string): ParsedWechatCallback {
  const encrypted = /<Encrypt>/i.test(raw);
  return {
    event: extractTag(raw, 'Event'),
    fromUserName: extractTag(raw, 'FromUserName'),
    createTime: extractTag(raw, 'CreateTime'),
    items: parseSubscribeListBlocks(raw),
    encrypted,
  };
}

function pickListFromObject(body: Record<string, unknown>): unknown {
  if (body.List != null) return body.List;
  if (body.list != null) return body.list;

  const popup = body.SubscribeMsgPopupEvent as Record<string, unknown> | undefined;
  if (popup?.List != null) return popup.List;

  const change = body.SubscribeMsgChangeEvent as Record<string, unknown> | undefined;
  if (change?.List != null) return change.List;

  // 部分 JSON 推送把 SubscribeMsgPopupEvent 直接做成数组
  if (Array.isArray(body.SubscribeMsgPopupEvent)) return body.SubscribeMsgPopupEvent;

  return null;
}

function objectToItems(body: Record<string, unknown>): WechatSubscribeEventItem[] {
  const listRaw = pickListFromObject(body);
  const rows = normalizeWechatList(listRaw as never);
  return rows
    .map((row) => {
      const o = row as Record<string, unknown>;
      return {
        templateId: String(o.TemplateId || o.templateId || '').trim(),
        status: String(o.SubscribeStatusString || o.status || '').trim(),
        popupScene: String(o.PopupScene || o.popupScene || '').trim() || undefined,
      };
    })
    .filter((r) => r.templateId || r.status);
}

/** 归一化微信 POST 回调体（XML 字符串 / JSON 对象均可） */
export function parseWechatCallbackBody(raw: unknown): ParsedWechatCallback {
  if (raw == null) {
    return { event: '', fromUserName: '', createTime: '', items: [], encrypted: false };
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { event: '', fromUserName: '', createTime: '', items: [], encrypted: false };
    }
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return parseWechatCallbackBody(JSON.parse(trimmed));
      } catch {
        return { event: '', fromUserName: '', createTime: '', items: [], encrypted: false };
      }
    }
    if (trimmed.startsWith('<')) {
      return parseXmlCallback(trimmed);
    }
    return { event: '', fromUserName: '', createTime: '', items: [], encrypted: false };
  }

  if (typeof raw === 'object') {
    const body = raw as Record<string, unknown>;
    return {
      event: String(body.Event || body.event || ''),
      fromUserName: String(body.FromUserName || body.fromUserName || ''),
      createTime: String(body.CreateTime || body.createTime || ''),
      items: objectToItems(body),
      encrypted: Boolean(body.Encrypt || body.encrypt),
    };
  }

  return { event: '', fromUserName: '', createTime: '', items: [], encrypted: false };
}
