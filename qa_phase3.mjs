/**
 * Phase 3 Visual QA — DashboardPage + EmergencyPage
 * Uses Playwright to screenshot both pages with mocked auth + API data.
 * Run: node qa_phase3.mjs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const SCREENSHOTS = 'screenshots';
const BASE = 'http://localhost:5173';

const MOCK_USER = { id: 1, username: 'qa_admin', email: 'qa@pharmacie.test', role: 'admin' };
const MOCK_TOKENS = { access_token: 'mock_access_token_qa', refresh_token: 'mock_refresh_token_qa' };

// --- rich mock API responses ------------------------------------------------

const MOCK_DASHBOARD = {
  totals: { users: 1420, admins: 8, pharmacies: 2418, gardes: 341 },
  growth: { users_last_30_days: 87, pharmacies_last_30_days: 12 },
  auth: { login_success_last_30_days: 3204, login_failed_last_30_days: 178 },
  pharmacies: { bulk_uploads_last_30_days: 3, top_governorates: [
    { governorate: 'Tunis', count: 412 },
    { governorate: 'Sfax', count: 287 },
    { governorate: 'Sousse', count: 201 },
    { governorate: 'Monastir', count: 154 },
    { governorate: 'Bizerte', count: 132 },
    { governorate: 'Nabeul', count: 117 },
    { governorate: 'Ariana', count: 98 },
  ]},
  searches: { today: 482, last_7_days: 3108 },
};

const MOCK_ACTIVITY = {
  user_registrations: [
    { day: '2026-05-16', count: 9 }, { day: '2026-05-17', count: 14 },
    { day: '2026-05-18', count: 7 },  { day: '2026-05-19', count: 18 },
    { day: '2026-05-20', count: 11 }, { day: '2026-05-21', count: 22 },
    { day: '2026-05-22', count: 16 }, { day: '2026-05-23', count: 8 },
  ],
  logins: [
    { day: '2026-05-14', success: 98, failed: 4 }, { day: '2026-05-15', success: 112, failed: 8 },
    { day: '2026-05-16', success: 107, failed: 6 }, { day: '2026-05-17', success: 134, failed: 11 },
    { day: '2026-05-18', success: 91,  failed: 3 }, { day: '2026-05-19', success: 128, failed: 7 },
    { day: '2026-05-20', success: 119, failed: 9 }, { day: '2026-05-21', success: 143, failed: 5 },
    { day: '2026-05-22', success: 102, failed: 6 }, { day: '2026-05-23', success: 88,  failed: 4 },
  ],
  searches: [
    { day: '2026-05-16', count: 388 }, { day: '2026-05-17', count: 412 },
    { day: '2026-05-18', count: 374 }, { day: '2026-05-19', count: 498 },
    { day: '2026-05-20', count: 441 }, { day: '2026-05-21', count: 512 },
    { day: '2026-05-22', count: 467 }, { day: '2026-05-23', count: 482 },
  ],
};

const MOCK_PHARMACIES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Pharmacie ${['El Hilal', 'Centrale', 'Al Amal', 'Ibn Sina', 'El Menzah', 'Essoukra', 'Belvédère', 'Lafayette', 'El Manar', 'Carthage', 'Ennasr', 'Ariana'][i]}`,
  address: `${10 + i} Rue de la République, ${['Tunis', 'Sfax', 'Sousse', 'Monastir', 'Bizerte', 'Nabeul', 'Ariana', 'Tunis', 'Sfax', 'Sousse', 'Tunis', 'Ariana'][i]}`,
  governorate: ['Tunis', 'Sfax', 'Sousse', 'Monastir', 'Bizerte', 'Nabeul', 'Ariana', 'Tunis', 'Sfax', 'Sousse', 'Tunis', 'Ariana'][i],
  phone: `+216 ${71 + i} ${100 + i * 3} ${200 + i}`,
  latitude: 36.8 + (i * 0.04),
  longitude: 10.18 + (i * 0.03),
}));

const MOCK_HEALTH = {
  kpis: [
    { label: 'Overall Status', value: 'Operational', helper: 'All critical services responding', icon: 'CheckCircle2', status: 'healthy' },
    { label: 'API Latency', value: '128 ms', helper: 'Average response time', icon: 'Timer', status: 'healthy' },
    { label: 'Error Rate', value: '0.07%', helper: 'Last 24 hours', icon: 'AlertTriangle', status: 'warning' },
    { label: 'Uptime', value: '99.97%', helper: 'Rolling 30 days', icon: 'Activity', status: 'healthy' },
    { label: 'Last Health Check', value: '14:32', helper: 'Live backend probe', icon: 'Clock3', status: 'info' },
  ],
  services: [
    { name: 'Backend API', icon: 'Server', status: 'healthy', responseTime: '116 ms', lastChecked: '14:32', description: 'FastAPI gateway, authentication, pharmacy and admin endpoints.' },
    { name: 'Database', icon: 'Database', status: 'healthy', responseTime: '42 ms', lastChecked: '14:31', description: 'Primary PostgreSQL connection pool and schema.' },
    { name: 'Mobile App API', icon: 'Smartphone', status: 'healthy', responseTime: '148 ms', lastChecked: '14:31', description: 'Public mobile endpoints for pharmacy search and medicines.' },
    { name: 'Chatbot API', icon: 'Bot', status: 'warning', responseTime: '284 ms', lastChecked: '14:30', description: 'Answer service available with elevated response time.' },
    { name: 'Notification Service', icon: 'Bell', status: 'healthy', responseTime: '94 ms', lastChecked: '14:29', description: 'In-app notification delivery and email dispatch queue.' },
    { name: 'Map Service', icon: 'MapPinned', status: 'healthy', responseTime: '132 ms', lastChecked: '14:29', description: 'Map tiles, coordinates, and pharmacy location previews.' },
  ],
  endpoints: [
    ['GET', '/health', 200, '68 ms', 'healthy', '14:32'],
    ['POST', '/auth/login', 200, '142 ms', 'healthy', '14:32'],
    ['GET', '/pharmacies', 200, '154 ms', 'healthy', '14:31'],
    ['GET', '/medicines', 200, '181 ms', 'healthy', '14:31'],
    ['POST', '/chatbot/answer', 200, '284 ms', 'warning', '14:30'],
    ['POST', '/uploads/pharmacies', 202, '238 ms', 'healthy', '14:28'],
  ],
  databaseMetrics: [
    ['Connection status', 'Connected', 'healthy'],
    ['Query response time', '42 ms', 'healthy'],
    ['Total pharmacies', '2,418', 'info'],
    ['Total medicines', '14,892', 'info'],
  ],
  importMetrics: [
    ['Pharmacy CSV import status', 'Healthy', 'healthy'],
    ['Medicine CSV import status', 'Warning', 'warning'],
    ['Last import time', 'Today at 13:48', 'info'],
    ['Failed rows', '6', 'warning'],
  ],
  jobs: [
    ['Pharmacy sync', 'Healthy', '14:20', '38 sec', '2,418 records synced', 'healthy'],
    ['Medicine sync', 'Warning', '13:48', '1m 12s', 'Completed with 7 warnings', 'warning'],
    ['Database backup', 'Healthy', '02:00', '4m 18s', 'Stored successfully', 'healthy'],
    ['Notifications', 'Healthy', '14:25', '16 sec', '128 delivered', 'healthy'],
    ['Log cleanup', 'Healthy', '03:15', '54 sec', 'Expired logs removed', 'healthy'],
  ],
  logs: [
    ['2026-05-20 14:27:12', 'Warning', 'Medicine Import', '7 rows failed validation: missing code_pct.'],
    ['2026-05-20 14:24:08', 'Info', 'Notification Service', 'Daily admin digest queued.'],
    ['2026-05-20 14:18:44', 'Warning', 'Chatbot API', 'Latency exceeded 350 ms for 3 consecutive checks.'],
    ['2026-05-20 13:59:21', 'Error', 'CSV Import', 'Duplicate pharmacy rows skipped during upload.'],
  ],
  charts: {
    latencyTrend: [
      { check: '13:20', backend: 112, chatbot: 328, mobile: 142 },
      { check: '13:30', backend: 104, chatbot: 318, mobile: 136 },
      { check: '13:40', backend: 119, chatbot: 384, mobile: 146 },
      { check: '13:50', backend: 121, chatbot: 356, mobile: 148 },
      { check: '14:00', backend: 124, chatbot: 364, mobile: 152 },
      { check: '14:10', backend: 130, chatbot: 402, mobile: 161 },
      { check: '14:20', backend: 117, chatbot: 386, mobile: 147 },
      { check: '14:30', backend: 128, chatbot: 376, mobile: 154 },
    ],
    errorRateTrend: [
      { time: '13:20', rate: 0.03 }, { time: '13:30', rate: 0.04 },
      { time: '13:40', rate: 0.06 }, { time: '13:50', rate: 0.06 },
      { time: '14:00', rate: 0.06 }, { time: '14:10', rate: 0.08 },
      { time: '14:20', rate: 0.07 }, { time: '14:30', rate: 0.06 },
    ],
    requestVolume: [
      { hour: '07:00', requests: 732 }, { hour: '08:00', requests: 1080 },
      { hour: '09:00', requests: 1324 }, { hour: '10:00', requests: 1418 },
      { hour: '11:00', requests: 1256 }, { hour: '12:00', requests: 1168 },
      { hour: '13:00', requests: 1226 }, { hour: '14:00', requests: 1312 },
    ],
    endpointLatency: [
      { endpoint: '/health', latency: 68 },
      { endpoint: '/auth/login', latency: 142 },
      { endpoint: '/pharmacies', latency: 154 },
      { endpoint: '/medicines', latency: 181 },
      { endpoint: '/chatbot/answer', latency: 412 },
    ],
  },
};

// ---------------------------------------------------------------------------

async function setupMockRoutes(page) {
  await page.route('**/api/auth/me', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) })
  );
  await page.route('**/api/auth/login', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_TOKENS) })
  );
  await page.route('**/api/admin/analytics/dashboard**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DASHBOARD) })
  );
  await page.route('**/api/admin/analytics/activity**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ACTIVITY) })
  );
  await page.route('**/api/admin/pharmacies**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PHARMACIES) })
  );
  await page.route('**/api/admin/system-health**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_HEALTH) })
  );
}

async function injectAuth(page) {
  await page.evaluate((tokens) => {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'qa_admin', email: 'qa@pharmacie.test', role: 'admin' }));
  }, MOCK_TOKENS);
}

async function captureConsoleErrors(page) {
  const errors = [];
  const warnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
  return { errors, warnings };
}

async function waitForCharts(page) {
  // Wait for canvas elements (Chart.js renders into <canvas>)
  await page.waitForFunction(() => {
    const canvases = document.querySelectorAll('canvas');
    return canvases.length > 0;
  }, { timeout: 8000 }).catch(() => {});
  // Extra settle time for Chart.js animation
  await page.waitForTimeout(1200);
}

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

async function main() {
  console.log('Launching Chromium…');
  const browser = await chromium.launch({ headless: true });

  const results = { dashboard: {}, emergency: {}, consoleErrors: [], consoleWarnings: [] };

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name.toUpperCase()} (${vp.width}×${vp.height}) ===`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const { errors, warnings } = captureConsoleErrors(page);
    await setupMockRoutes(page);

    // ---- Dashboard --------------------------------------------------------
    console.log('  → Dashboard…');
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await injectAuth(page);
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    await waitForCharts(page);

    const dashFile = `${SCREENSHOTS}/dashboard_${vp.name}.png`;
    await page.screenshot({ path: dashFile, fullPage: true });
    console.log(`  ✓ Saved ${dashFile}`);
    results.dashboard[vp.name] = dashFile;

    // ---- Monitoring / Emergency -------------------------------------------
    console.log('  → Monitoring…');
    await page.goto(`${BASE}/emergency`, { waitUntil: 'networkidle' });
    await waitForCharts(page);

    const emFile = `${SCREENSHOTS}/monitoring_${vp.name}.png`;
    await page.screenshot({ path: emFile, fullPage: true });
    console.log(`  ✓ Saved ${emFile}`);
    results.emergency[vp.name] = emFile;

    // collect console noise from this viewport
    results.consoleErrors.push(...errors.map(e => `[${vp.name}] ${e}`));
    results.consoleWarnings.push(...warnings.map(w => `[${vp.name}] ${w}`));

    await context.close();
  }

  // Also take a zoomed-in desktop screenshot of the chart area
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await setupMockRoutes(page);
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await injectAuth(page);
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    await waitForCharts(page);
    // Scroll to chart section
    await page.evaluate(() => window.scrollBy(0, 900));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOTS}/dashboard_charts_zoom.png` });
    await context.close();
  }

  await browser.close();

  console.log('\n=== CONSOLE ERRORS ===');
  if (results.consoleErrors.length === 0) console.log('  None');
  else results.consoleErrors.forEach(e => console.log(' ❌', e));

  console.log('\n=== CONSOLE WARNINGS ===');
  const rechartsWarnings = results.consoleWarnings.filter(w => /recharts/i.test(w));
  const chartjsErrors = results.consoleWarnings.filter(w => /chart\.js|chartjs/i.test(w));
  const i18nWarnings = results.consoleWarnings.filter(w => /dashboard\.|common\.|nav\.|t\(/.test(w));
  const otherWarnings = results.consoleWarnings.filter(w =>
    !rechartsWarnings.includes(w) && !chartjsErrors.includes(w) && !i18nWarnings.includes(w)
  );
  if (rechartsWarnings.length) { console.log('  RECHARTS warnings:'); rechartsWarnings.forEach(w => console.log('  ❌', w)); }
  else console.log('  ✅ No Recharts warnings');
  if (chartjsErrors.length) { console.log('  CHART.JS warnings:'); chartjsErrors.forEach(w => console.log('  ⚠️ ', w)); }
  else console.log('  ✅ No Chart.js registration errors');
  if (i18nWarnings.length) { console.log('  i18n warnings:'); i18nWarnings.forEach(w => console.log('  ⚠️ ', w)); }
  else console.log('  ✅ No missing translation keys');
  if (otherWarnings.length > 0) { console.log('  Other:'); otherWarnings.slice(0, 10).forEach(w => console.log('  ℹ️ ', w)); }

  console.log('\n=== SCREENSHOTS ===');
  Object.entries(results.dashboard).forEach(([vp, f]) => console.log(`  Dashboard ${vp}: ${f}`));
  Object.entries(results.emergency).forEach(([vp, f]) => console.log(`  Monitoring ${vp}: ${f}`));
  console.log(`  Dashboard charts zoom: ${SCREENSHOTS}/dashboard_charts_zoom.png`);

  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
