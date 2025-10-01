#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {});
}

async function exportPage(browser, url, outFile) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.emulateMediaType('screen');
  await page.pdf({ path: outFile, format: 'A4', printBackground: true });
  await page.close();
}

async function main() {
  const base = process.env.APP_URL || 'http://localhost:8080';
  const outDir = path.resolve(__dirname, '../dist/legal-pdfs');
  await ensureDir(outDir);

  const targets = [
    { path: '/privacy-policy', name: 'politica-de-privacidad.pdf' },
    { path: '/terms-of-service', name: 'terminos-y-condiciones.pdf' },
    { path: '/cookie-policy', name: 'politica-de-cookies.pdf' },
    { path: '/legal-notice', name: 'aviso-legal.pdf' },
  ];

  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    for (const t of targets) {
      const url = base + t.path;
      const outFile = path.join(outDir, t.name);
      console.log('Exporting', url, '→', outFile);
      await exportPage(browser, url, outFile);
    }
  } finally {
    await browser.close();
  }
  console.log('✅ PDFs generados en', outDir);
}

main().catch((e) => {
  console.error('Error exportando PDFs:', e);
  process.exit(1);
});






