// Renders tools/cv-ru.html and tools/cv-en.html to the resume PDFs in assets/ (one A4 page each).
// Needs Playwright with Chromium: node tools/cv-pdf.js
const path = require('path');
const { chromium } = require('playwright');

const jobs = [['cv-ru.html', 'denis-berzhanin-resume.pdf'], ['cv-en.html', 'denis-berzhanin-cv-en.pdf']];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [src, out] of jobs) {
    await page.goto('file://' + path.join(__dirname, src), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const extra = await page.evaluate(() => document.body.scrollHeight - document.body.clientHeight);
    if (extra > 1) throw new Error(`${src}: content is ${extra}px taller than one A4 page`);
    await page.pdf({ path: path.join(__dirname, '..', 'assets', out), format: 'A4', printBackground: true, pageRanges: '1' });
  }
  await browser.close();
})();
