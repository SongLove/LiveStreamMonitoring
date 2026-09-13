import { LiveService } from './live.service';

function mockAnchor(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'a1' },
    id: 'a1',
    liveState: 'live',
    consecutiveOffline: 0,
    consecutiveProbeFailed: 0,
    lastLiveAt: new Date(Date.now() - 60 * 60_000),
    liveTitle: '',
    coverUrl: '',
    platform: 'douyin',
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('LiveService.applyProbeResult probe_failed recovery', () => {
  let service: LiveService;
  let anchorModel: { findById: jest.Mock };
  let sessionModel: {
    updateMany: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
  };
  let redis: { set: jest.Mock };
  let config: { get: jest.Mock };
  let notifyDispatch: { add: jest.Mock };
  let pollConfirm: { add: jest.Mock };

  beforeEach(() => {
    anchorModel = { findById: jest.fn() };
    sessionModel = {
      updateMany: jest.fn().mockResolvedValue({}),
      create: jest.fn(),
      findOne: jest.fn(),
    };
    redis = { set: jest.fn().mockResolvedValue(undefined) };
    config = {
      get: jest.fn((key: string) => {
        if (key === 'live.minRebroadcastMinutes') return 30;
        if (key === 'live.confirmOfflinePolls') return 2;
        if (key === 'live.probeFailForceOffline') return 3;
        return undefined;
      }),
    };
    notifyDispatch = { add: jest.fn().mockResolvedValue(undefined) };
    pollConfirm = { add: jest.fn().mockResolvedValue(undefined) };

    service = new LiveService(
      sessionModel as any,
      anchorModel as any,
      redis as any,
      config as any,
      notifyDispatch as any,
      pollConfirm as any,
    );
  });

  it('keeps live on first probe_failed but increments consecutiveProbeFailed', async () => {
    const anchor = mockAnchor({ consecutiveProbeFailed: 0 });
    anchorModel.findById.mockResolvedValue(anchor);

    const result = await service.applyProbeResult('a1', 'probe_failed', {
      provider: 'douyin-playwright',
      confidence: 0,
    });

    expect(result.transition).toBe('probe_failed');
    expect(anchor.liveState).toBe('live');
    expect(anchor.consecutiveProbeFailed).toBe(1);
    expect(anchor.save).toHaveBeenCalled();
  });

  it('forces offline after consecutive probe_failed reaches threshold', async () => {
    const anchor = mockAnchor({ consecutiveProbeFailed: 2, liveState: 'live' });
    anchorModel.findById.mockResolvedValue(anchor);

    const result = await service.applyProbeResult('a1', 'probe_failed', {
      provider: 'douyin-playwright',
      confidence: 0,
    });

    expect(result.transition).toBe('force_offline');
    expect(anchor.liveState).toBe('offline');
    expect(anchor.consecutiveProbeFailed).toBe(0);
    expect(sessionModel.updateMany).toHaveBeenCalled();
  });

  it('resets consecutiveProbeFailed on successful not_live', async () => {
    const anchor = mockAnchor({
      consecutiveProbeFailed: 2,
      consecutiveOffline: 0,
      liveState: 'live',
    });
    anchorModel.findById.mockResolvedValue(anchor);

    await service.applyProbeResult('a1', 'not_live', {
      provider: 'douyin-playwright',
      confidence: 0.9,
    });

    expect(anchor.consecutiveProbeFailed).toBe(0);
    expect(anchor.consecutiveOffline).toBe(1);
  });

  it('marks offline after confirmOffline consecutive not_live', async () => {
    const anchor = mockAnchor({
      consecutiveOffline: 1,
      liveState: 'live',
      consecutiveProbeFailed: 0,
    });
    anchorModel.findById.mockResolvedValue(anchor);

    const result = await service.applyProbeResult('a1', 'not_live', {
      provider: 'douyin-playwright',
      confidence: 0.9,
    });

    expect(result.transition).toBe('offline_progress');
    expect(anchor.liveState).toBe('offline');
  });
});

describe('LiveService confirmLive notify dispatch', () => {
  let service: LiveService;
  let anchorModel: { findById: jest.Mock };
  let sessionModel: {
    updateMany: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
  };
  let redis: { set: jest.Mock };
  let config: { get: jest.Mock };
  let notifyDispatch: { add: jest.Mock };
  let pollConfirm: { add: jest.Mock };

  beforeEach(() => {
    anchorModel = { findById: jest.fn() };
    sessionModel = {
      updateMany: jest.fn().mockResolvedValue({}),
      create: jest.fn(),
      findOne: jest.fn().mockResolvedValue(null),
    };
    redis = { set: jest.fn().mockResolvedValue(undefined) };
    config = {
      get: jest.fn((key: string) => {
        if (key === 'live.minRebroadcastMinutes') return 30;
        if (key === 'live.confirmOfflinePolls') return 2;
        if (key === 'live.probeFailForceOffline') return 3;
        return undefined;
      }),
    };
    notifyDispatch = { add: jest.fn().mockResolvedValue(undefined) };
    pollConfirm = { add: jest.fn().mockResolvedValue(undefined) };

    service = new LiveService(
      sessionModel as any,
      anchorModel as any,
      redis as any,
      config as any,
      notifyDispatch as any,
      pollConfirm as any,
    );
  });

  it('dispatches notify after offline→live even if lastLiveAt within 30min (no active session)', async () => {
    const anchor = mockAnchor({
      liveState: 'offline',
      lastLiveAt: new Date(Date.now() - 5 * 60_000),
    });
    anchorModel.findById.mockResolvedValue(anchor);
    sessionModel.findOne.mockResolvedValue(null);
    sessionModel.create.mockResolvedValue({ id: 'sess-new' });

    const result = await service.applyProbeResult('a1', 'live', {
      provider: 'douyin-playwright',
      confidence: 0.9,
      title: '真开播',
    });

    expect(result.transition).toBe('live');
    expect(notifyDispatch.add).toHaveBeenCalledWith(
      'dispatch',
      { sessionId: 'sess-new', anchorId: 'a1' },
      { jobId: 'dispatch:sess-new' },
    );
  });

  it('skips notify on rebroadcast_cooldown only when active live session exists', async () => {
    const anchor = mockAnchor({
      liveState: 'offline',
      lastLiveAt: new Date(Date.now() - 5 * 60_000),
    });
    anchorModel.findById.mockResolvedValue(anchor);
    sessionModel.findOne.mockResolvedValue({ id: 'sess-old', status: 'live' });

    const result = await service.applyProbeResult('a1', 'live', {
      provider: 'douyin-playwright',
      confidence: 0.9,
    });

    expect(result.transition).toBe('rebroadcast_cooldown');
    expect(notifyDispatch.add).not.toHaveBeenCalled();
    expect(sessionModel.create).not.toHaveBeenCalled();
  });
});
