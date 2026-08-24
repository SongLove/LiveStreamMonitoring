import { parseDouyinLivePayload } from './douyin-live-parse';

describe('parseDouyinLivePayload', () => {
  it('room_status 0 => live', () => {
    const parsed = parseDouyinLivePayload({
      data: {
        room_status: 0,
        data: [{ title: '今晚开播', cover: { url_list: ['https://cdn/x.jpg'] } }],
      },
    });
    expect(parsed).toMatchObject({
      status: 'live',
      title: '今晚开播',
      coverUrl: 'https://cdn/x.jpg',
      confidence: 0.9,
    });
  });

  it('room_status 2 => not_live', () => {
    const parsed = parseDouyinLivePayload({
      data: { room_status: 2, data: [{ title: '已下播' }] },
    });
    expect(parsed?.status).toBe('not_live');
    expect(parsed?.title).toBe('已下播');
  });

  it('roomStore status_str 2 => live', () => {
    const parsed = parseDouyinLivePayload({
      state: {
        roomStore: {
          roomInfo: {
            room: { title: 'SSR直播', status_str: '2', cover: { url_list: ['a'] } },
          },
        },
      },
    });
    expect(parsed).toMatchObject({
      status: 'live',
      title: 'SSR直播',
      confidence: 0.85,
    });
  });

  it('roomStore status 4 => not_live', () => {
    const parsed = parseDouyinLivePayload({
      room: { title: '歇了', status: 4 },
    });
    expect(parsed?.status).toBe('not_live');
  });

  it('unrelated json => null', () => {
    expect(parseDouyinLivePayload({ foo: 1 })).toBeNull();
    expect(parseDouyinLivePayload(null)).toBeNull();
  });
});
