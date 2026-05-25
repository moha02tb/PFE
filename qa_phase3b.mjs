/**
 * Phase 3 Visual QA — tablet + mobile + console errors
 */
import { chromium } from 'playwright';

const SCREENSHOTS = 'screenshots';
const BASE = 'http://localhost:5173';
const MOCK_TOKENS = { access_token: 'mock_access_token_qa', refresh_token: 'mock_refresh_token_qa' };
const MOCK_USER = { id: 1, username: 'qa_admin', email: 'qa@pharmacie.test', role: 'admin' };

const MOCK_DASHBOARD = {
  totals: { users: 1420, admins: 8, pharmacies: 2418, gardes: 341 },
  growth: { users_last_30_days: 87, pharmacies_last_30_days: 12 },
  auth: { login_success_last_30_days: 3204, login_failed_last_30_days: 178 },
  pharmacies: { bulk_uploads_last_30_days: 3, top_governorates: [
    { governorate: 'Tunis', count: 412 }, { governorate: 'Sfax', count: 287 },
    { governorate: 'Sousse', count: 201 }, { governorate: 'Monastir', count: 154 },
    { governorate: 'Bizerte', count: 132 }, { governorate: 'Nabeul', count: 117 },
    { governorate: 'Ariana', count: 98 },
  ]},
  searches: { today: 482, last_7_days: 3108 },
};
const MOCK_ACTIVITY = {
  user_registrations: [
    { day: '2026-05-16', count: 9 }, { day: '2026-05-17', count: 14 },
    { day: '2026-05-18', count: 7 }, { day: '2026-05-19', count: 18 },
    { day: '2026-05-20', count: 11 }, { day: '2026-05-21', count: 22 },
    { day: '2026-05-22', count: 16 }, { day: '2026-05-23', count: 8 },
  ],
  logins: [
    { day: '2026-05-14', success: 98, failed: 4 }, { day: '2026-05-15', success: 112, failed: 8 },
    { day: '2026-05-16', success: 107, failed: 6 }, { day: '2026-05-17', success: 134, failed: 11 },
    { day: '2026-05-18', success: 91, failed: 3 }, { day: '2026-05-19', success: 128, failed: 7 },
    { day: '2026-05-20', success: 119, failed: 9 }, { day: '2026-05-21', success: 143, failed: 5 },
    { day: '2026-05-22', success: 102, failed: 6 }, { day: '2026-05-23', success: 88, failed: 4 },
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
  name: `Pharmacie ${['El Hilal','Centrale','Al Amal','Ibn Sina','El Menzah','Essoukra','Belvédère','Lafayette','El Manar','Carthage','Ennasr','Ariana'][i]}`,
  address: `${10+i} Rue de la République, Tunis`,
  governorate: ['Tunis','Sfax','Sousse','Monastir','Bizerte','Nabeul','Ariana','Tunis','Sfax','Sousse','Tunis','Ariana'][i],
  phone: `+216 71 ${100+i} ${200+i}`,
  latitude: 36.8 + (i * 0.04), longitude: 10.18 + (i * 0.03),
}));
const MOCK_HEALTH = {
  kpis: [
    { label:'Overall Status', value:'Operational', helper:'All services responding', icon:'CheckCircle2', status:'healthy' },
    { label:'API Latency', value:'128 ms', helper:'Average response time', icon:'Timer', status:'healthy' },
    { label:'Error Rate', value:'0.07%', helper:'Last 24 hours', icon:'AlertTriangle', status:'warning' },
    { label:'Uptime', value:'99.97%', helper:'Rolling 30 days', icon:'Activity', status:'healthy' },
    { label:'Last Health Check', value:'14:32', helper:'Live backend probe', icon:'Clock3', status:'info' },
  ],
  services: [
    { name:'Backend API', icon:'Server', status:'healthy', responseTime:'116 ms', lastChecked:'14:32', description:'FastAPI gateway.' },
    { name:'Database', icon:'Database', status:'healthy', responseTime:'42 ms', lastChecked:'14:31', description:'PostgreSQL pool.' },
    { name:'Mobile App API', icon:'Smartphone', status:'healthy', responseTime:'148 ms', lastChecked:'14:31', description:'Public endpoints.' },
    { name:'Chatbot API', icon:'Bot', status:'warning', responseTime:'284 ms', lastChecked:'14:30', description:'Elevated latency.' },
    { name:'Notification Service', icon:'Bell', status:'healthy', responseTime:'94 ms', lastChecked:'14:29', description:'Email dispatch.' },
    { name:'Map Service', icon:'MapPinned', status:'healthy', responseTime:'132 ms', lastChecked:'14:29', description:'Map tiles.' },
  ],
  endpoints: [
    ['GET','/health',200,'68 ms','healthy','14:32'],
    ['POST','/auth/login',200,'142 ms','healthy','14:32'],
    ['GET','/pharmacies',200,'154 ms','healthy','14:31'],
    ['GET','/medicines',200,'181 ms','healthy','14:31'],
    ['POST','/chatbot/answer',200,'284 ms','warning','14:30'],
  ],
  databaseMetrics: [
    ['Connection status','Connected','healthy'],['Query response time','42 ms','healthy'],
    ['Total pharmacies','2,418','info'],['Failed queries today','2','warning'],
  ],
  importMetrics: [
    ['Pharmacy CSV','Healthy','healthy'],['Medicine CSV','Warning','warning'],
    ['Last import','Today 13:48','info'],['Failed rows','6','warning'],
  ],
  jobs: [
    ['Pharmacy sync','Healthy','14:20','38 sec','2,418 records synced','healthy'],
    ['Medicine sync','Warning','13:48','1m 12s','7 warnings','warning'],
    ['DB backup','Healthy','02:00','4m 18s','Stored','healthy'],
    ['Notifications','Healthy','14:25','16 sec','128 delivered','healthy'],
    ['Log cleanup','Healthy','03:15','54 sec','Removed','healthy'],
  ],
  logs: [
    ['2026-05-20 14:27','Warning','Medicine Import','7 rows failed.'],
    ['2026-05-20 14:24','Info','Notification','Digest queued.'],
    ['2026-05-20 14:18','Warning','Chatbot API','Latency > 350ms x3.'],
    ['2026-05-20 13:59','Error','CSV Import','Duplicate rows skipped.'],
  ],
  charts: {
    latencyTrend: [
      {check:'13:20',backend:112,chatbot:328,mobile:142},{check:'13:30',backend:104,chatbot:318,mobile:136},
      {check:'13:40',backend:119,chatbot:384,mobile:146},{check:'13:50',backend:121,chatbot:356,mobile:148},
      {check:'14:00',backend:124,chatbot:364,mobile:152},{check:'14:10',backend:130,chatbot:402,mobile:161},
      {check:'14:20',backend:117,chatbot:386,mobile:147},{check:'14:30',backend:128,chatbot:376,mobile:154},
    ],
    errorRateTrend: [
      {time:'13:20',rate:0.03},{time:'13:30',rate:0.04},{time:'13:40',rate:0.06},{time:'13:50',rate:0.06},
      {time:'14:00',rate:0.06},{time:'14:10',rate:0.08},{time:'14:20',rate:0.07},{time:'14:30',rate:0.06},
    ],
    requestVolume: [
      {hour:'07:00',requests:732},{hour:'08:00',requests:1080},{hour:'09:00',requests:1324},
      {hour:'10:00',requests:1418},{hour:'11:00',requests:1256},{hour:'12:00',requests:1168},
      {hour:'13:00',requests:1226},{hour:'14:00',requests:1312},
    ],
    endpointLatency: [
      {endpoint:'/health',latency:68},{endpoint:'/auth/login',latency:142},
      {endpoint:'/pharmacies',latency:154},{endpoint:'/medicines',latency:181},
      {endpoint:'/chatbot/answer',latency:412},
    ],
  },
};

async function setupMockRoutes(page) {
  await page.route('**/api/auth/me', r => r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(MOCK_USER) }));
  await page.route('**/api/auth/login', r => r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(MOCK_TOKENS) }));
  await page.route('**/api/admin/analytics/dashboard**', r => r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(MOCK_DASHBOARD) }));
  await page.route('**/api/admin/analytics/activity**', r => r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(MOCK_ACTIVITY) }));
  await page.route('**/api/admin/pharmacies**', r => r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(MOCK_PHARMACIES) }));
  await page.route('**/api/admin/system-health**', r => r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(MOCK_HEALTH) }));
}

async function injectAuth(page) {
  await page.evaluate((t) => {
    localStorage.setItem('access_token', t.access_token);
    localStorage.setItem('refresh_token', t.refresh_token);
    localStorage.setItem('user', JSON.stringify({ id:1, username:'qa_admin', email:'qa@test', role:'admin' }));
  }, MOCK_TOKENS);
}

async function waitForCharts(page) {
  await page.waitForFunction(() => document.querySelectorAll('canvas').length > 0, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1400);
}

async function runViewport(browser, name, width, height, allErrors, allWarnings) {
  console.log(`\n=== ${name.toUpperCase()} (${width}×${height}) ===`);
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

  // Dashboard
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await waitForCharts(page);
  const df = `${SCREENSHOTS}/dashboard_${name}.png`;
  await page.screenshot({ path: df, fullPage: true });
  console.log(`  ✓ ${df}`);

  // Monitoring
  await page.goto(`${BASE}/emergency`, { waitUntil: 'networkidle' });
  await waitForCharts(page);
  const mf = `${SCREENSHOTS}/monitoring_${name}.png`;
  await page.screenshot({ path: mf, fullPage: true });
  console.log(`  ✓ ${mf}`);

  allErrors.push(...errors.map(e => `[${name}] ${e}`));
  allWarnings.push(...warnings.map(w => `[${name}] ${w}`));
  await ctx.close();
}

async function main() {
  console.log('Launching Chromium…');
  const browser = await chromium.launch({ headless: true });
  const allErrors = [];
  const allWarnings = [];

  await runViewport(browser, 'tablet', 768, 1024, allErrors, allWarnings);
  await runViewport(browser, 'mobile', 390, 844, allErrors, allWarnings);

  // Charts zoom at desktop
  {
    const ctx = await browser.newContext({ viewport: { width:1440, height:900 } });
    const page = await ctx.newPage();
    await setupMockRoutes(page);
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await injectAuth(page);
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    await waitForCharts(page);
    await page.evaluate(() => window.scrollBy(0, 1100));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOTS}/dashboard_charts_zoom.png` });
    console.log(`  ✓ ${SCREENSHOTS}/dashboard_charts_zoom.png`);
    await ctx.close();
  }

  await browser.close();

  console.log('\n=== CONSOLE ERRORS ===');
  if (!allErrors.length) console.log('  ✅ None');
  else allErrors.forEach(e => console.log('  ❌', e));

  console.log('\n=== CONSOLE WARNINGS ===');
  const rechartsW = allWarnings.filter(w => /recharts/i.test(w));
  const chartjsW  = allWarnings.filter(w => /chart\.js|chartjs/i.test(w));
  const i18nW     = allWarnings.filter(w => /dashboard\.|common\.|nav\.|Missing translation/i.test(w));
  console.log(rechartsW.length ? `  ❌ Recharts warnings: ${rechartsW.length}` : '  ✅ No Recharts warnings');
  console.log(chartjsW.length  ? `  ⚠️  Chart.js errors: ${chartjsW.length}` : '  ✅ No Chart.js registration errors');
  console.log(i18nW.length     ? `  ⚠️  i18n warnings: ${i18nW.length}` : '  ✅ No missing translation keys');
  if (allWarnings.length > 0) {
    console.log('  Other warnings:');
    allWarnings.slice(0, 15).forEach(w => console.log('  ℹ️ ', w));
  }
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
