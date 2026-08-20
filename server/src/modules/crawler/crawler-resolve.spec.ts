import { BadRequestException } from '@nestjs/common';
import { ProviderChainService } from './chain/provider-chain.service';
import { ProviderSkippedError } from './providers/provider-skip.error';
import {
  LiveProvider,
  NormalizedAnchorProfile,
  NormalizedLiveResult,
} from './providers/provider.types';

function mockProvider(
  name: string,
  resolveImpl: () => Promise<NormalizedAnchorProfile>,
): LiveProvider {
  return {
    name,
    platform: 'douyin',
    healthCheck: async () => ({ ok: true }),
    resolve: resolveImpl,
    fetchStatus: async (): Promise<NormalizedLiveResult[]> => {
      throw new ProviderSkippedError(name, 'n/a');
    },
  };
}

describe('ProviderChainService.resolveChain', () => {
  it('skips unconfigured third-party and uses playwright', async () => {
    const chain = new ProviderChainService();
    const calls: string[] = [];
    const third = mockProvider('douyin-third-party', async () => {
      calls.push('third');
      throw new ProviderSkippedError('douyin-third-party', 'not configured');
    });
    const sign = mockProvider('douyin-signature-stub', async () => {
      calls.push('sign');
      throw new ProviderSkippedError('douyin-signature-stub', 'stub');
    });
    const pw = mockProvider('douyin-playwright', async () => {
      calls.push('pw');
      return {
        platform: 'douyin',
        platformUid: 'MS4wLjABAAAAreal',
        roomId: 'kelie329157',
        nickname: '真实昵称',
        avatarUrl: 'https://cdn.example/x.jpg',
        profileUrl: 'https://www.douyin.com/user/MS4wLjABAAAAreal',
      };
    });

    const profile = await chain.resolveChain([third, sign, pw], 'kelie329157');
    expect(calls).toEqual(['third', 'sign', 'pw']);
    expect(profile.nickname).toBe('真实昵称');
    expect(profile.platformUid).toBe('MS4wLjABAAAAreal');
  });

  it('uses third-party when it succeeds first', async () => {
    const chain = new ProviderChainService();
    const calls: string[] = [];
    const third = mockProvider('douyin-third-party', async () => {
      calls.push('third');
      return {
        platform: 'douyin',
        platformUid: 'sec_from_api',
        roomId: 'kelie329157',
        nickname: 'API昵称',
        avatarUrl: 'https://cdn.example/api.jpg',
        profileUrl: 'https://www.douyin.com/user/sec_from_api',
      };
    });
    const pw = mockProvider('douyin-playwright', async () => {
      calls.push('pw');
      throw new Error('should not run');
    });

    const profile = await chain.resolveChain([third, pw], 'kelie329157');
    expect(calls).toEqual(['third']);
    expect(profile.nickname).toBe('API昵称');
  });

  it('surfaces BadRequestException from last provider', async () => {
    const chain = new ProviderChainService();
    const third = mockProvider('douyin-third-party', async () => {
      throw new ProviderSkippedError('douyin-third-party', 'skip');
    });
    const pw = mockProvider('douyin-playwright', async () => {
      throw new BadRequestException('未找到抖音号：nope');
    });
    await expect(chain.resolveChain([third, pw], 'nope')).rejects.toThrow(
      BadRequestException,
    );
  });
});
