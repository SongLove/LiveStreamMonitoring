import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Browser, BrowserContext, Page } from 'playwright';

/** Chromium renderer/tab died — common in Docker when /dev/shm or RAM is tight. */
export function isPlaywrightTargetCrashError(err: unknown): boolean {
  const msg = (err as Error)?.message || String(err);
  return /target crashed|target closed|browser has been closed|session closed|page crashed/i.test(
    msg,
  );
}

/**
 * Process-wide Chromium + concurrency slot for Douyin profile fetches.
 * Docker: set DOUYIN_PW_EXECUTABLE_PATH=/usr/bin/chromium
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

  /** Exposed for providers that recycle tabs inside one context. */
  get pageTimeoutMs() {
    return this.navigationTimeoutMs;
  }

  private get headless() {
    return this.config.get<boolean>('douyin.playwrightHeadless') !== false;
  }

  private get executablePath(): string | undefined {
    const p = (this.config.get<string>('douyin.playwrightExecutablePath') || '').trim();
    return p || undefined;
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
    }
    this.browser = null;
  }

  private async ensureBrowser(): Promise<Browser> {
    if (this.browser?.isConnected()) return this.browser;
    // Lazy require so unit tests without playwright install still load the module graph
    // when browser path is mocked.
    const { chromium } = await import('playwright');
    const execPath = this.executablePath;
    this.logger.log(
      execPath
        ? `launch chromium executablePath=${execPath}`
        : 'launch playwright-bundled chromium',
    );
    this.browser = await chromium.launch({
      headless: this.headless,
      executablePath: execPath,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // Prefer Playwright temp dir over tiny Docker /dev/shm (compose should still set shm_size≥512m)
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-accelerated-2d-canvas',
        '--disable-background-networking',
        '--disable-breakpad',
      ],
    });
    this.browser.on('disconnected', () => {
      this.logger.warn('chromium disconnected');
      this.browser = null;
    });
    return this.browser;
  }

  private async newContext(browser: Browser): Promise<BrowserContext> {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'zh-CN',
      viewport: { width: 1280, height: 720 },
    });
    // Douyin pages are heavy; drop video/image payloads to reduce renderer OOM in small containers.
    await context.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (type === 'image' || type === 'media') {
        return route.abort();
      }
      return route.continue();
    });
    return context;
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
   * Retries once after relaunching Chromium when the tab/renderer crashes.
   */
  async withPage<T>(fn: (page: Page, context: BrowserContext) => Promise<T>): Promise<T> {
    const waitMs = this.navigationTimeoutMs;
    await this.acquireSlot(waitMs);
    try {
      try {
        return await this.runWithPage(fn);
      } catch (err) {
        if (!isPlaywrightTargetCrashError(err)) throw err;
        this.logger.warn(
          `Playwright target crashed, relaunching browser: ${(err as Error).message}`,
        );
        await this.close();
        return await this.runWithPage(fn);
      }
    } finally {
      this.releaseSlot();
    }
  }

  private async runWithPage<T>(
    fn: (page: Page, context: BrowserContext) => Promise<T>,
  ): Promise<T> {
    let context: BrowserContext | null = null;
    try {
      const browser = await this.ensureBrowser();
      context = await this.newContext(browser);
      const page = await context.newPage();
      page.setDefaultTimeout(this.navigationTimeoutMs);
      return await fn(page, context);
    } finally {
      try {
        await context?.close();
      } catch {
        /* ignore */
      }
    }
  }
}
