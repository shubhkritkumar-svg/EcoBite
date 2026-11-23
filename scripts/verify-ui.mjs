import fs from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:5173';
const OUT = 'docs/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});

const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});

const settle = (ms = 900) => page.waitForTimeout(ms);

const scrollThrough = async (target) => {
  const height = await target.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await target.evaluate((top) => window.scrollTo(0, top), y);
    await target.waitForTimeout(100);
  }
  await target.evaluate(() => window.scrollTo(0, 0));
  await target.waitForTimeout(500);
};

const shot = async (name) => {
  await scrollThrough(page);
  await settle();
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(`screenshot: ${name}.png`);
};

try {
  // 1. Home
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.getByRole('heading', { name: /Good food/i }).waitFor();
  await shot('home');

  // 2. Restaurants listing
  await page.goto(`${BASE}/restaurants`, { waitUntil: 'load' });
  await page.locator('a[href^="/restaurants/"]').first().waitFor();
  await shot('restaurants');

  // 3. Restaurant menu + add to cart
  await page.goto(`${BASE}/restaurants/the-green-tiffin`, { waitUntil: 'load' });
  const addButton = page.locator('button[aria-label^="Add "]').first();
  await addButton.waitFor();
  await addButton.click();
  await settle(400);
  await shot('restaurant-menu');

  // 4. Cart
  await page.goto(`${BASE}/cart`, { waitUntil: 'load' });
  await page.getByRole('heading', { name: 'Your cart' }).waitFor();
  await shot('cart');

  // 5. Signup page (visual only)
  await page.goto(`${BASE}/signup`, { waitUntil: 'load' });
  await page.getByRole('heading', { name: 'Create your EcoBite account' }).waitFor();
  await shot('signup');

  // 6. Login (demo customer) and checkout
  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  await page.getByRole('button', { name: /Customer demo/i }).click();
  await shot('login');
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

  await page.goto(`${BASE}/checkout`, { waitUntil: 'load' });
  await page.getByRole('heading', { name: 'Checkout' }).waitFor();
  await shot('checkout');

  await page.getByRole('button', { name: /Place order/i }).click();
  await page.waitForURL(/\/orders\/[0-9a-f]{24}/i, { timeout: 20000 });
  await page.getByText('Order placed successfully!').waitFor();
  await shot('order-tracking');

  // 7. Simulated tracking advance
  await page.getByRole('button', { name: /Advance simulated status/i }).click();
  await page.getByText(/Status advanced to/i).waitFor();
  await page.getByRole('button', { name: /Advance simulated status/i }).click();
  await settle(800);
  await shot('order-tracking-progress');

  // 8. Eco dashboard
  await page.goto(`${BASE}/eco`, { waitUntil: 'load' });
  await page.getByRole('heading', { name: 'Your green journey' }).waitFor();
  await shot('eco-dashboard');

  // 9. Profile & order history
  await page.goto(`${BASE}/profile`, { waitUntil: 'load' });
  await page.getByRole('heading', { name: 'Order history' }).waitFor();
  await shot('profile');

  // 10. Admin: a separate clean session signed in with the admin demo
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  adminPage.on('pageerror', (error) => errors.push(`admin pageerror: ${error.message}`));
  adminPage.on('console', (message) => {
    if (message.type() === 'error') errors.push(`admin console: ${message.text()}`);
  });
  const adminShot = async (name) => {
    await scrollThrough(adminPage);
    await adminPage.waitForTimeout(900);
    await adminPage.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    console.log(`screenshot: ${name}.png`);
  };

  await adminPage.goto(`${BASE}/login`, { waitUntil: 'load' });
  await adminPage.getByRole('button', { name: /Admin demo/i }).click();
  await adminPage.locator('form button[type="submit"]').click();
  await adminPage.getByRole('heading', { name: 'Operations dashboard' }).waitFor({ timeout: 20000 });

  const adminSelect = adminPage.locator('tbody select').first();
  await adminSelect.waitFor();
  await adminSelect.selectOption('confirmed');
  await adminPage.getByText(/updated to confirmed/i).waitFor();
  await adminShot('admin-orders');

  await adminPage.getByRole('button', { name: 'Restaurants', exact: true }).click();
  await adminPage.getByRole('button', { name: /Add restaurant/i }).waitFor();
  await adminShot('admin-restaurants');

  await adminPage.getByRole('button', { name: 'Menu items', exact: true }).click();
  await adminPage.getByRole('button', { name: /Add menu item/i }).waitFor();
  await adminShot('admin-menus');

  // 11. Mobile homepage
  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(`${BASE}/`, { waitUntil: 'load' });
  await mobile.getByRole('heading', { name: /Good food/i }).waitFor();
  await scrollThrough(mobile);
  await mobile.waitForTimeout(900);
  await mobile.screenshot({ path: `${OUT}/home-mobile.png`, fullPage: true });
  console.log('screenshot: home-mobile.png');
  await mobile.close();
} catch (error) {
  console.error('E2E FAILED:', error.message);
  await page.screenshot({ path: `${OUT}/failure.png`, fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  console.log('\nConsole/page errors:', errors.length ? errors : 'none');
  await browser.close();
}
