import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BrowserContext, Page } from 'playwright';
export declare function isPlaywrightTargetCrashError(err: unknown): boolean;
export declare class DouyinBrowserPool implements OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private browser;
    private active;
    private waitQueue;
    constructor(config: ConfigService);
    private get concurrency();
    private get navigationTimeoutMs();
    get pageTimeoutMs(): number;
    private get headless();
    private get executablePath();
    onModuleDestroy(): Promise<void>;
    close(): Promise<void>;
    private ensureBrowser;
    private newContext;
    private acquireSlot;
    private releaseSlot;
    withPage<T>(fn: (page: Page, context: BrowserContext) => Promise<T>): Promise<T>;
    private runWithPage;
}
