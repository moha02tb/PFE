import { chromium } from './node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

// Screenshot login page (check button color fix)
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: './screenshots/fix-01-login.png', fullPage: false });
console.log('Login page captured');

// Mock auth and check calendar/dashboard
await page.route('http://localhost:8000/**', async (route) => {
  const url = route.request().url();
  if (url.includes('/api/auth/me')) {
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: 1, nomUtilisateur: 'Admin Test', email: 'admin@test.tn', role: 'super_admin', region_scope: null }) });
  } else {
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: [], total: 0, items: [] }) });
  }
});

await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  localStorage.setItem('access_token', 'mock_token');
  localStorage.setItem('refresh_token', 'mock_refresh');
});

// Calendar - check badge fix
await page.goto('http://localhost:5173/calendar', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: './screenshots/fix-02-calendar.png', fullPage: false });
console.log('Calendar captured');

await browser.close();
console.log('Done');
