import {
  extractUserFromJson,
  parseDouyinProfileFromHtml,
  toNormalizedProfile,
} from './douyin-profile-parse';

describe('douyin-profile-parse', () => {
  const sampleUser = {
    user: {
      nickname: '可乐测试号',
      unique_id: 'kelie329157',
      sec_uid: 'MS4wLjABAAAAtestdouyinuid',
      avatar_thumb: { url_list: ['https://cdn.example/a.jpg'] },
    },
  };

  it('extracts user from nested json', () => {
    const bits = extractUserFromJson(sampleUser, 'kelie329157');
    expect(bits).toMatchObject({
      nickname: '可乐测试号',
      uniqueId: 'kelie329157',
      secUid: 'MS4wLjABAAAAtestdouyinuid',
      avatarUrl: 'https://cdn.example/a.jpg',
    });
  });

  it('parses __NEXT_DATA__ html', () => {
    const html = `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(
      sampleUser,
    )}</script></html>`;
    const bits = parseDouyinProfileFromHtml(html, 'kelie329157');
    expect(bits?.nickname).toBe('可乐测试号');
    expect(bits?.avatarUrl).toBe('https://cdn.example/a.jpg');
  });

  it('parses RENDER_DATA uri-encoded json', () => {
    const encoded = encodeURIComponent(JSON.stringify(sampleUser));
    const html = `<html><script id="RENDER_DATA" type="application/json">${encoded}</script></html>`;
    const bits = parseDouyinProfileFromHtml(html, 'kelie329157');
    expect(bits?.secUid).toBe('MS4wLjABAAAAtestdouyinuid');
  });

  it('toNormalizedProfile prefers sec_uid as platformUid', () => {
    const profile = toNormalizedProfile(
      {
        nickname: '可乐测试号',
        avatarUrl: 'https://cdn.example/a.jpg',
        secUid: 'MS4wLjABAAAAtestdouyinuid',
        uniqueId: 'kelie329157',
      },
      'kelie329157',
    );
    expect(profile.platformUid).toBe('MS4wLjABAAAAtestdouyinuid');
    expect(profile.roomId).toBe('kelie329157');
    expect(profile.profileUrl).toContain('/user/MS4wLjABAAAAtestdouyinuid');
  });
});

describe('isIncompleteDouyinProfile', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { isIncompleteDouyinProfile } = require('./douyin-playwright.provider');

  it('flags placeholder nick=uid without avatar', () => {
    expect(
      isIncompleteDouyinProfile({
        nickname: 'kelie329157',
        avatarUrl: '',
        platformUid: 'kelie329157',
        roomId: 'kelie329157',
      }),
    ).toBe(true);
  });

  it('accepts real nickname even without avatar', () => {
    expect(
      isIncompleteDouyinProfile({
        nickname: '克烈',
        avatarUrl: '',
        platformUid: 'MS4wLjABAAAA',
        roomId: 'kelie329157',
      }),
    ).toBe(false);
  });

  it('accepts profile with avatar', () => {
    expect(
      isIncompleteDouyinProfile({
        nickname: 'kelie329157',
        avatarUrl: 'https://cdn.example/a.jpg',
        platformUid: 'kelie329157',
      }),
    ).toBe(false);
  });
});
