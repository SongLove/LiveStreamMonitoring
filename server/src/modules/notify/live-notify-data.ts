/** 直播开播通知：thing1 达人名称，thing5 直播主题，thing4 备注，time3 开播时间 */
export function buildLiveNotifyData(input: {
  anchorName: string;
  topic: string;
  remark: string;
  time: string;
}): Record<string, { value: string }> {
  return {
    thing1: { value: input.anchorName },
    thing5: { value: input.topic },
    thing4: { value: input.remark },
    time3: { value: input.time },
  };
}

export function formatSubscribeTime(date = new Date()): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}
