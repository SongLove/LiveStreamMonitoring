import { buildAnchorProfileUpdate } from './anchor.service';

describe('buildAnchorProfileUpdate', () => {
  it('does not put avatarUrl in both $set and $setOnInsert', () => {
    const withAvatar = buildAnchorProfileUpdate({
      nickname: 'KPL',
      avatarUrl: 'https://p66.a.kwimgs.com/a.jpg',
      profileUrl: 'https://live.kuaishou.com/u/KPL704668133',
      roomId: 'KPL704668133',
    });
    expect(withAvatar.$set.avatarUrl).toBe('https://p66.a.kwimgs.com/a.jpg');
    expect(withAvatar.$setOnInsert).not.toHaveProperty('avatarUrl');

    const empty = buildAnchorProfileUpdate({
      nickname: 'KPL',
      avatarUrl: '',
      profileUrl: 'https://live.kuaishou.com/u/x',
      roomId: 'x',
    });
    expect(empty.$set).not.toHaveProperty('avatarUrl');
    expect(empty.$setOnInsert.avatarUrl).toBe('');
  });
});
