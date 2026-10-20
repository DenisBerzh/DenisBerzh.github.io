// Renders tools/cv-en.html to assets/denis-berzhanin-cv-en.pdf (one A4 page).
// Needs Playwright with Chromium: node tools/cv-pdf.js
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(__dirname, 'cv-en.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(__dirname, '..', 'assets', 'denis-berzhanin-cv-en.pdf'), format: 'A4', printBackground: true, pageRanges: '1' });
  await browser.close();
})();
