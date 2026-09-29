import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NotifyTestDto } from './notify.controller';
import { buildLiveNotifyData } from './live-notify-data';

const pipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  forbidUnknownValues: false,
};

async function errorsOf(body: object) {
  const dto = plainToInstance(NotifyTestDto, body);
  return validate(dto, pipeOptions);
}

describe('NotifyTestDto', () => {
  it('accepts the message field sent by the help-center test button', async () => {
    const errors = await errorsOf({ message: '测试推送' });
    expect(errors).toHaveLength(0);
  });

  it('still rejects fields outside the dto', async () => {
    const errors = await errorsOf({ message: '测试推送', extra: 'nope' });
    expect(errors.map((e) => e.property)).toContain('extra');
  });
});

describe('buildLiveNotifyData', () => {
  it('uses the live-notify template keywords', () => {
    const data = buildLiveNotifyData({
      anchorName: '测试主播',
      topic: '测试直播',
      remark: '测试推送',
      time: '2026-09-28 22:35:00',
    });
    expect(Object.keys(data).sort()).toEqual(['thing1', 'thing4', 'thing5', 'time3']);
    expect(data).not.toHaveProperty('thing2');
    expect(data.thing1.value).toBe('测试主播');
    expect(data.thing5.value).toBe('测试直播');
    expect(data.thing4.value).toBe('测试推送');
    expect(data.time3.value).toBe('2026-09-28 22:35:00');
  });
});
