/**
 * Phase 4 Visual QA — MapPage desktop + tablet + mobile
 */
import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOTS = 'screenshots';
const BASE = 'http://localhost:5173';
const MOCK_TOKENS = { access_token: 'mock_access_token_qa', refresh_token: 'mock_refresh_token_qa' };
const MOCK_USER = { id: 1, username: 'qa_admin', email: 'qa@pharmacie.test', role: 'admin' };

const MOCK_PHARMACIES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Pharmacie ${['El Hilal','Centrale','Al Amal','Ibn Sina','El Menzah','Essoukra','Belvédère','Lafayette','El Manar','Carthage','Ennasr','Ariana'][i]}`,
  address: `${10+i} Rue de la République, ${['Tunis','Sfax','Sousse','Monastir','Bizerte','Nabeul','Ariana','Tunis','Sfax','Sousse','Tunis','Ariana'][i]}`,
  governorate: ['Tunis','Sfax','Sousse','Monastir','Bizerte','Nabeul','Ariana','Tunis','Sfax','Sousse','Tunis','Ariana'][i],
  phone: `+216 71 ${100+i} ${200+i}`,
  latitude: 36.8 + (i * 0.04),
  longitude: 10.18 + (i * 0.03),
}));

if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });

async function setupMockRoutes(page) {
  await page.route('**/api/auth/me', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
  await page.route('**/api/auth/login', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_TOKENS) }));
  await page.route('**/api/admin/pharmacies**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PHARMACIES) }));
}

async function injectAuth(page) {
  await page.evaluate((t) => {
    localStorage.setItem('access_token', t.access_token);
    localStorage.setItem('refresh_token', t.refresh_token);
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'qa_admin', email: 'qa@test', role: 'admin' }));
  }, MOCK_TOKENS);
}

async function runViewport(browser, label, width, height, allErrors, allWarnings) {
  console.log(`\n=== ${label.toUpperCase()} (${width}×${height}) ===`);
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();

  const errors = [];
  const warnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`PAGE_ERROR: ${err.message}`));

  await setupMockRoutes(page);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await injectAuth(page);

  // Navigate to map
  await page.goto(`${BASE}/map`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // let leaflet tiles + resize settle

  // Full-page screenshot
  const shot1 = `${SCREENSHOTS}/map_${label}.png`;
  await page.screenshot({ path: shot1, fullPage: true });
  console.log(`  ✓ ${shot1}`);

  // Click 2nd pharmacy in directory to test selected state
  const items = await page.locator('.map-directory-item').all();
  if (items.length >= 2) {
    await items[1].click();
    await page.waitForTimeout(600);
    const shot2 = `${SCREENSHOTS}/map_${label}_selected.png`;
    await page.screenshot({ path: shot2, fullPage: true });
    console.log(`  ✓ ${shot2}`);
  }

  // Test search filter (map directory search — second input on page)
  await page.locator('.map-directory-panel input').fill('Tunis');
  await page.waitForTimeout(400);
  const shot3 = `${SCREENSHOTS}/map_${label}_search.png`;
  await page.screenshot({ path: shot3, fullPage: true });
  console.log(`  ✓ ${shot3}`);

  allErrors.push(...errors.map(e => `[${label}] ${e}`));
  allWarnings.push(...warnings.map(w => `[${label}] ${w}`));
  await ctx.close();
}

async function main() {
  console.log('Launching Chromium…');
  const browser = await chromium.launch({ headless: true });
  const allErrors = [];
  const allWarnings = [];

  await runViewport(browser, 'desktop', 1440, 900, allErrors, allWarnings);
  await runViewport(browser, 'tablet', 768, 1024, allErrors, allWarnings);
  await runViewport(browser, 'mobile', 390, 844, allErrors, allWarnings);

  await browser.close();

  console.log('\n=== CONSOLE ERRORS ===');
  if (!allErrors.length) console.log('  ✅ None');
  else allErrors.forEach(e => console.log('  ❌', e));

  console.log('\n=== CONSOLE WARNINGS ===');
  const i18nW = allWarnings.filter(w => /Missing translation|map\.|nav\./i.test(w));
  const leafletW = allWarnings.filter(w => /leaflet/i.test(w));
  console.log(i18nW.length ? `  ⚠️  i18n warnings: ${i18nW.length}` : '  ✅ No missing translation keys');
  console.log(leafletW.length ? `  ⚠️  Leaflet warnings: ${leafletW.length}` : '  ✅ No Leaflet warnings');
  if (allWarnings.length > 0) {
    console.log('  Other warnings:');
    allWarnings.slice(0, 20).forEach(w => console.log('  ℹ️ ', w));
  }
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
