/**
 * Phase 5 Visual QA — Upload pages (Pharmacies, Garde, Medicines)
 */
import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOTS = 'screenshots';
const BASE = 'http://localhost:5173';
const MOCK_TOKENS = { access_token: 'mock_access_token_qa', refresh_token: 'mock_refresh_token_qa' };
const MOCK_USER = { id: 1, username: 'qa_admin', email: 'qa@pharmacie.test', role: 'admin' };

const MOCK_GARDES = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  date: `2026-05-${String(18 + i).padStart(2, '0')}`,
  pharmacy_name: `Pharmacie ${['El Hilal', 'Centrale', 'Al Amal', 'Ibn Sina', 'El Menzah', 'Essoukra'][i]}`,
  start_time: '08:00',
  end_time: '20:00',
}));

const MOCK_MEDICINES = Array.from({ length: 5 }, (_, i) => ({
  code_pct: `${1000 + i}`,
  nom_commercial: `Médicament ${String.fromCharCode(65 + i)}`,
  dci: `DCI-${i + 1}`,
  prix_public_dt: `${(2.5 + i * 0.8).toFixed(2)}`,
  categorie_remboursement: 'A',
  ap: 'OUI',
}));

const MOCK_UPLOAD_RESULT = { total_rows: 24, successful: 22, failed: 2, errors: [], warnings: [] };
const MOCK_UPLOAD_RESULT_WITH_WARNINGS = {
  total_rows: 30, successful: 25, failed: 3, warnings: [{ row_number: 4, error_message: 'Missing DCI field' }], errors: [],
};

if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });

async function setupMockRoutes(page) {
  await page.route('**/api/auth/me', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
  await page.route('**/api/auth/login', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_TOKENS) }));
  await page.route('**/api/admin/gardes**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_GARDES) }));
  await page.route('**/api/admin/medicines**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MEDICINES) }));
  await page.route('**/api/admin/upload', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_UPLOAD_RESULT) }));
  await page.route('**/api/admin/gardes/upload', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_UPLOAD_RESULT) }));
  await page.route('**/api/admin/medicines/upload', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_UPLOAD_RESULT_WITH_WARNINGS) }));
}

async function injectAuth(page) {
  await page.evaluate((t) => {
    localStorage.setItem('access_token', t.access_token);
    localStorage.setItem('refresh_token', t.refresh_token);
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'qa_admin', email: 'qa@test', role: 'admin' }));
  }, MOCK_TOKENS);
}

async function main() {
  console.log('Launching Chromium…');
  const browser = await chromium.launch({ headless: true });
  const allErrors = [];
  const allWarnings = [];

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') allErrors.push(msg.text());
    if (msg.type() === 'warning') allWarnings.push(msg.text());
  });
  page.on('pageerror', err => allErrors.push(`PAGE_ERROR: ${err.message}`));

  await setupMockRoutes(page);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await injectAuth(page);

  // ── UPLOAD PHARMACIES ─────────────────────────────────────────────────────
  console.log('\n=== UPLOAD PHARMACIES ===');

  await page.goto(`${BASE}/upload-pharmacies`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  // Default state
  await page.screenshot({ path: `${SCREENSHOTS}/upload_pharmacies_default.png`, fullPage: true });
  console.log('  ✓ upload_pharmacies_default.png');

  // Trigger error: set a non-CSV file to activate the CSV-only validation error
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'wrong_file.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not a csv file\n'),
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOTS}/upload_pharmacies_error.png`, fullPage: true });
  console.log('  ✓ upload_pharmacies_error.png');

  // Set a valid CSV to test selected state
  await fileInput.setInputFiles({
    name: 'pharmacies_batch.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('name,latitude,longitude\nPharmacie Test,36.8,10.18\n'),
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOTS}/upload_pharmacies_file_selected.png`, fullPage: true });
  console.log('  ✓ upload_pharmacies_file_selected.png');

  // Submit to get result stats (button now enabled)
  await page.locator('button:has-text("Start Upload")').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SCREENSHOTS}/upload_pharmacies_result.png`, fullPage: true });
  console.log('  ✓ upload_pharmacies_result.png');

  // ── UPLOAD GARDE ──────────────────────────────────────────────────────────
  console.log('\n=== UPLOAD GARDE ===');

  await page.goto(`${BASE}/upload-garde`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);

  // Skeleton loading state — capture immediately before API resolves
  // (API is instant with mock, so take screenshot right after navigation)
  await page.screenshot({ path: `${SCREENSHOTS}/upload_garde_default.png`, fullPage: true });
  console.log('  ✓ upload_garde_default.png (recent rows loaded)');

  // Trigger error via non-CSV file
  const gardeFileInput = page.locator('input[type="file"]');
  await gardeFileInput.setInputFiles({
    name: 'wrong_file.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not a csv\n'),
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOTS}/upload_garde_error.png`, fullPage: true });
  console.log('  ✓ upload_garde_error.png');

  // Set valid CSV to test selected state + preview rows / format detection
  await gardeFileInput.setInputFiles({
    name: 'garde_schedule.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('date,pharmacy_name,start_time,end_time\n2026-05-24,Pharmacie Test,08:00,20:00\n2026-05-25,Pharmacie B,08:00,20:00\n'),
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SCREENSHOTS}/upload_garde_file_selected.png`, fullPage: true });
  console.log('  ✓ upload_garde_file_selected.png');

  // Submit to get result
  await page.locator('button:has-text("Upload garde")').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SCREENSHOTS}/upload_garde_result.png`, fullPage: true });
  console.log('  ✓ upload_garde_result.png');

  // ── UPLOAD MEDICINES ─────────────────────────────────────────────────────
  console.log('\n=== UPLOAD MEDICINES ===');

  await page.goto(`${BASE}/upload-medicines`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);

  await page.screenshot({ path: `${SCREENSHOTS}/upload_medicines_default.png`, fullPage: true });
  console.log('  ✓ upload_medicines_default.png (recent medicines loaded)');

  // Trigger error via non-CSV file
  const medFileInput = page.locator('input[type="file"]');
  await medFileInput.setInputFiles({
    name: 'wrong.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not a csv\n'),
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOTS}/upload_medicines_error.png`, fullPage: true });
  console.log('  ✓ upload_medicines_error.png');

  // Set valid CSV
  await medFileInput.setInputFiles({
    name: 'medicines.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('code_pct,nom_commercial,prix_public_DT,tarif_reference_DT,categorie_remboursement,dci,ap\n1234,Paracetamol,1.5,1.2,A,paracetamol,OUI\n'),
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOTS}/upload_medicines_file_selected.png`, fullPage: true });
  console.log('  ✓ upload_medicines_file_selected.png');

  // Submit to get result with warnings
  await page.locator('button:has-text("Upload medicines")').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SCREENSHOTS}/upload_medicines_result.png`, fullPage: true });
  console.log('  ✓ upload_medicines_result.png');

  // ── TABLET VIEW ──────────────────────────────────────────────────────────
  console.log('\n=== TABLET (768×1024) ===');
  await ctx.close();

  const tabCtx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const tabPage = await tabCtx.newPage();
  tabPage.on('console', msg => {
    if (msg.type() === 'error') allErrors.push(`[tablet] ${msg.text()}`);
  });
  await setupMockRoutes(tabPage);
  await tabPage.goto(BASE, { waitUntil: 'networkidle' });
  await injectAuth(tabPage);

  await tabPage.goto(`${BASE}/upload-pharmacies`, { waitUntil: 'networkidle' });
  await tabPage.waitForTimeout(400);
  await tabPage.screenshot({ path: `${SCREENSHOTS}/upload_pharmacies_tablet.png`, fullPage: true });
  console.log('  ✓ upload_pharmacies_tablet.png');

  await tabPage.goto(`${BASE}/upload-garde`, { waitUntil: 'networkidle' });
  await tabPage.waitForTimeout(400);
  await tabPage.screenshot({ path: `${SCREENSHOTS}/upload_garde_tablet.png`, fullPage: true });
  console.log('  ✓ upload_garde_tablet.png');

  await tabPage.goto(`${BASE}/upload-medicines`, { waitUntil: 'networkidle' });
  await tabPage.waitForTimeout(400);
  await tabPage.screenshot({ path: `${SCREENSHOTS}/upload_medicines_tablet.png`, fullPage: true });
  console.log('  ✓ upload_medicines_tablet.png');

  await tabCtx.close();
  await browser.close();

  // ── RESULTS ───────────────────────────────────────────────────────────────
  console.log('\n=== CONSOLE ERRORS ===');
  if (!allErrors.length) console.log('  ✅ None');
  else allErrors.forEach(e => console.log('  ❌', e));

  console.log('\n=== CONSOLE WARNINGS ===');
  const i18nW = allWarnings.filter(w => /Missing translation|upload\./i.test(w));
  console.log(i18nW.length ? `  ⚠️  i18n warnings: ${i18nW.length}` : '  ✅ No missing translation keys');
  if (allWarnings.length > 0) {
    allWarnings.slice(0, 15).forEach(w => console.log('  ℹ️ ', w));
  }
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
