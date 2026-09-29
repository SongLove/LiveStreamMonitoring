import { bilibiliStatusQuery, mapBilibiliStatusBody } from './bilibili.provider';
import { douyinLiveWebRid } from './douyin-input';

describe('bilibili live status query', () => {
  it('repeats uids[] so the room API accepts the batch', () => {
    expect(bilibiliStatusQuery(['2', '672328094'])).toBe('uids[]=2&uids[]=672328094');
  });

  it('maps live_status 1 to live and 2 to not_live', () => {
    const rows = mapBilibiliStatusBody(['2', '3'], {
      code: 0,
      data: {
        '2': { live_status: 1, title: '开播', room_id: 1 },
        '3': { live_status: 2, title: '轮播', room_id: 2 },
      },
    });
    expect(rows.map((r) => r.status)).toEqual(['live', 'not_live']);
  });

  it('does not treat an invalid response as everyone offline', () => {
    const rows = mapBilibiliStatusBody(['2'], { code: 1, data: [] });
    expect(rows[0].status).toBe('probe_failed');
  });
});

describe('douyin live probe id', () => {
  it('uses the douyin id, not a nickname or sec_uid', () => {
    expect(douyinLiveWebRid({ roomId: 'kelie329157', platformUid: 'MS4wLjABAAAA_x' })).toBe(
      'kelie329157',
    );
    expect(douyinLiveWebRid({ roomId: '', platformUid: '克烈' })).toBe('');
    expect(douyinLiveWebRid({ roomId: '', platformUid: 'MS4wLjABAAAAtesthomepageuid123456' })).toBe(
      '',
    );
  });
});
