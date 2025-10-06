/*
Genera versiones WebP optimizadas para las imágenes de modelos.
- Busca URLs en src/pages/Index.tsx con la forma ".../models/<Name>.jpg"
- Descarga los JPG a public/models/
- Genera WebP (ancho máximo 1200, alto máximo 1600, calidad 75)
*/

const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const INDEX_FILE = path.join(PROJECT_ROOT, 'src', 'pages', 'Index.tsx');
const MODELS_DIR = path.join(PROJECT_ROOT, 'public', 'models');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          fs.unlink(dest, () => {});
          return reject(new Error(`Download failed ${res.statusCode} for ${url}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(dest)));
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

async function toWebp(inputPath, outputPath) {
  await sharp(inputPath)
    .resize({ width: 1200, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(outputPath);
}

async function main() {
  ensureDir(MODELS_DIR);
  const src = fs.readFileSync(INDEX_FILE, 'utf8');
  const regex = /image_url:\s*"(https?:\/\/[^\"]+\/models\/([A-Za-z0-9_-]+)\.jpg)"/g;
  const urls = new Map();
  let m;
  while ((m = regex.exec(src)) !== null) {
    const fullUrl = m[1];
    const name = m[2];
    urls.set(name, fullUrl);
  }
  if (urls.size === 0) {
    console.log('No image URLs found in Index.tsx');
    return;
  }
  console.log(`Found ${urls.size} model images`);

  for (const [name, url] of urls.entries()) {
    const jpgPath = path.join(MODELS_DIR, `${name}.jpg`);
    const webpPath = path.join(MODELS_DIR, `${name}.webp`);

    try {
      if (!fs.existsSync(jpgPath)) {
        console.log(`Downloading ${url} -> ${jpgPath}`);
        await download(url, jpgPath);
      } else {
        console.log(`JPG exists: ${jpgPath}`);
      }
      console.log(`Generating WebP -> ${webpPath}`);
      await toWebp(jpgPath, webpPath);
    } catch (e) {
      console.warn(`Failed processing ${name}:`, e.message);
    }
  }
  console.log('Done. Check public/models/ for .webp files.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
