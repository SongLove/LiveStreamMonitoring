import { chromium } from 'playwright';

const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['kelie329157', '9896719.', '39405334432'];

async function probe(id) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'zh-CN',
  });
  const captured = [];
  page.on('response', async (res) => {
    try {
      const url = res.url();
      if (!/webcast|live\.douyin/i.test(url)) return;
      const ct = res.headers()['content-type'] || '';
      if (!ct.includes('json')) return;
      const data = await res.json().catch(() => null);
      if (data) captured.push({ url, data });
    } catch {
      /* ignore */
    }
  });
  await page.goto(`https://live.douyin.com/${encodeURIComponent(id)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForTimeout(5000);
  const title = await page.title();
  const html = await page.content();
  await browser.close();

  console.log(`\n=== ${id} | ${title.slice(0, 80)}`);
  console.log(`captured ${captured.length} json responses`);
  for (const c of captured) {
    console.log('URL', c.url.split('?')[0]);
    const txt = JSON.stringify(c.data);
    const rs = txt.match(/"room_status"\s*:\s*(\d+)/);
    const ss = txt.match(/"status_str"\s*:\s*"(\d+)"/);
    console.log('  room_status', rs?.[1] ?? '-', 'status_str', ss?.[1] ?? '-');
    console.log('  snippet', txt.slice(0, 300));
  }
  const hasRender = html.includes('RENDER_DATA') || html.includes('__NEXT_DATA__');
  const hasRoomStatus = /room_status|status_str/.test(html);
  console.log('html has render', hasRender, 'room markers', hasRoomStatus);
}

for (const id of ids) {
  await probe(id).catch((e) => console.error(id, e.message));
}
