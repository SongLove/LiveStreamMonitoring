import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Browser, BrowserContext, Page } from 'playwright';

/**
 * Process-wide Chromium + concurrency slot for Douyin profile fetches.
 */
@Injectable()
export class DouyinBrowserPool implements OnModuleDestroy {
  private readonly logger = new Logger(DouyinBrowserPool.name);
  private browser: Browser | null = null;
  private active = 0;
  private waitQueue: Array<() => void> = [];

  constructor(private readonly config: ConfigService) {}

  private get concurrency() {
    return Math.max(1, this.config.get<number>('douyin.playwrightConcurrency') || 1);
  }

  private get navigationTimeoutMs() {
    return this.config.get<number>('douyin.playwrightTimeoutMs') || 20_000;
  }

  private get headless() {
    return this.config.get<boolean>('douyin.playwrightHeadless') !== false;
  }

  async onModuleDestroy() {
    await this.close();
  }

  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (e) {
        this.logger.warn(`browser close: ${(e as Error).message}`);
      }
      this.browser = null;
    }
  }

  private async ensureBrowser(): Promise<Browser> {
    if (this.browser?.isConnected()) return this.browser;
    // Lazy require so unit tests without playwright install still load the module graph
    // when browser path is mocked.
    const { chromium } = await import('playwright');
    this.browser = await chromium.launch({
      headless: this.headless,
      args: ['--disable-blink-features=AutomationControlled'],
    });
    return this.browser;
  }

  private async acquireSlot(waitMs: number): Promise<void> {
    if (this.active < this.concurrency) {
      this.active += 1;
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waitQueue = this.waitQueue.filter((fn) => fn !== grant);
        reject(new Error('Playwright 忙碌超时，请稍后重试'));
      }, waitMs);
      const grant = () => {
        clearTimeout(timer);
        this.active += 1;
        resolve();
      };
      this.waitQueue.push(grant);
    });
  }

  private releaseSlot() {
    this.active = Math.max(0, this.active - 1);
    const next = this.waitQueue.shift();
    if (next) next();
  }

  /**
   * Run work with a fresh context+page; always releases the concurrency slot.
   */
  async withPage<T>(fn: (page: Page, context: BrowserContext) => Promise<T>): Promise<T> {
    const waitMs = this.navigationTimeoutMs;
    await this.acquireSlot(waitMs);
    let context: BrowserContext | null = null;
    try {
      const browser = await this.ensureBrowser();
      context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        locale: 'zh-CN',
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      page.setDefaultTimeout(this.navigationTimeoutMs);
      return await fn(page, context);
    } finally {
      try {
        await context?.close();
      } catch {
        /* ignore */
      }
      this.releaseSlot();
    }
  }
}
