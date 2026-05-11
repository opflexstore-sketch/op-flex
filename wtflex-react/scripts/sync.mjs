// One-shot sync script: pulls all wtflex.in product + collection JSON,
// downloads every image to public/assets, rewrites image URLs to local paths,
// and saves normalized JSON the React app reads at runtime.
//
// Run: npm run sync
// Re-run anytime to refresh; cached images are skipped.

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', 'public');
const ASSETS_DIR = path.join(ROOT, 'assets');
const DATA_DIR = path.join(ROOT, 'data');
const PRODUCTS_DIR = path.join(DATA_DIR, 'products');
const COLLECTIONS_DIR = path.join(DATA_DIR, 'collections');

const ORIGIN = 'https://wtflex.in';

// Collections the UI references (Categories, Match The Mood, Shop The Look, Featured Caps).
const COLLECTIONS = [
  'tshirts',
  'joggers-unisex',
  'hoodies',
  'shirts',
  'denim-jeans',
  'caps',
  'formal-mood',
  'luxury-mood',
  'gym-mood',
  'summer-mood',
  'basic-mood',
  'baggy-oversized-denim-jeans',
  'boxy-fit-tshirt-for-men-women',
  'oversized-hoodie',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, retries = 4) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/146.0.0.0 Safari/537.36',
          accept: 'application/json',
        },
      });
      if (res.status === 429) {
        const wait = Math.pow(2, i) * 1500;
        console.log(`   429 — backing off ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (e) {
      if (i === retries) throw new Error(`${url} -> ${e.message}`);
      await sleep(1000 * (i + 1));
    }
  }
}

const abs = (url) => (url?.startsWith('//') ? 'https:' + url : url);

function imageLocalPath(url) {
  const u = abs(url);
  let pathname;
  try {
    pathname = new URL(u).pathname;
  } catch {
    return null;
  }
  const ext = path.extname(pathname).toLowerCase() || '.jpg';
  const hash = crypto.createHash('sha256').update(u).digest('hex').slice(0, 12);
  return `/assets/${hash}${ext}`;
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, '').trim();
}

function variantNum(v, key) {
  const x = v?.[key];
  if (typeof x === 'number') return x / 100;
  if (x) return parseFloat(x);
  return null;
}

function normalizeProduct(p) {
  const images = (p.images || [])
    .map((img) => (typeof img === 'string' ? img : img.src))
    .map(abs);
  const featured = abs(p.featured_image || images[0] || null);
  const isPaise = typeof p.price === 'number';
  let price = isPaise ? p.price / 100 : parseFloat(p.price);
  let compareAt = isPaise
    ? p.compare_at_price && p.compare_at_price / 100
    : p.compare_at_price && parseFloat(p.compare_at_price);

  // /products.json does not include top-level price/compare_at_price — only
  // variants have them. Fall back to the first variant so the home grid shows
  // real ₹ values instead of zero.
  if (!price || isNaN(price)) {
    const v = (p.variants || []).find((vv) => vv.price);
    if (v) price = variantNum(v, 'price');
  }
  if (!compareAt) {
    const v = (p.variants || []).find((vv) => vv.compare_at_price);
    if (v) compareAt = variantNum(v, 'compare_at_price');
  }

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: stripHtml(p.body_html || p.description || ''),
    price,
    compareAt,
    save: compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0,
    images,
    featured,
    type: p.product_type || p.type || '',
    tags: p.tags || [],
    available: p.available !== false,
    vendor: p.vendor || '',
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      title: v.title,
      sku: v.sku,
      available: v.available,
      option1: v.option1,
      option2: v.option2,
      option3: v.option3,
      price: typeof v.price === 'number' ? v.price / 100 : parseFloat(v.price),
      compare_at_price:
        typeof v.compare_at_price === 'number'
          ? v.compare_at_price / 100
          : v.compare_at_price
          ? parseFloat(v.compare_at_price)
          : null,
    })),
    options: p.options || [],
    descriptionHtml: p.body_html || p.description || '',
  };
}

function localizeImages(product, urlMap) {
  const remap = (url) => (url && urlMap[url] ? urlMap[url] : url);
  return {
    ...product,
    images: product.images.map(remap),
    featured: remap(product.featured),
  };
}

async function downloadImage(url, dest) {
  if (existsSync(dest)) return 'cached';
  try {
    const res = await fetch(url);
    if (!res.ok) return `error:${res.status}`;
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(dest, buf);
    return 'new';
  } catch (e) {
    return `error:${e.message}`;
  }
}

async function main() {
  console.log('📁 Setting up directories…');
  for (const d of [ASSETS_DIR, PRODUCTS_DIR, COLLECTIONS_DIR]) {
    await fs.mkdir(d, { recursive: true });
  }

  console.log('\n📦 Fetching all products (paginated)…');
  const allProducts = [];
  let page = 1;
  while (true) {
    const url = `${ORIGIN}/products.json?page=${page}&limit=250`;
    process.stdout.write(`   page ${page}… `);
    const data = await getJSON(url);
    const got = (data.products || []).length;
    console.log(`${got} products`);
    if (got === 0) break;
    allProducts.push(...data.products);
    if (got < 250) break;
    page++;
    await sleep(1000);
  }
  console.log(`   ✓ total ${allProducts.length} products`);

  console.log('\n📚 Fetching collections…');
  const collectionMap = {};
  for (const handle of COLLECTIONS) {
    process.stdout.write(`   ${handle.padEnd(40)} `);
    try {
      const data = await getJSON(`${ORIGIN}/collections/${handle}/products.json?limit=50`);
      collectionMap[handle] = data.products || [];
      console.log(`${collectionMap[handle].length} products`);
    } catch (e) {
      console.log(`error: ${e.message}`);
      collectionMap[handle] = [];
    }
    await sleep(1000);
  }

  console.log('\n🖼️  Collecting unique image URLs…');
  const imageUrls = new Set();
  const collect = (p) => {
    (p.images || []).forEach((img) => {
      const src = typeof img === 'string' ? img : img.src;
      if (src) imageUrls.add(abs(src));
    });
    if (p.featured_image) imageUrls.add(abs(p.featured_image));
  };
  allProducts.forEach(collect);
  Object.values(collectionMap).forEach((arr) => arr.forEach(collect));
  console.log(`   ✓ ${imageUrls.size} unique images`);

  console.log('\n⬇️  Downloading images (concurrent x 8)…');
  const urls = [...imageUrls];
  const urlMap = {};
  let counts = { new: 0, cached: 0, error: 0 };
  const CONC = 8;
  for (let i = 0; i < urls.length; i += CONC) {
    const batch = urls.slice(i, i + CONC);
    await Promise.all(
      batch.map(async (url) => {
        const local = imageLocalPath(url);
        if (!local) {
          counts.error++;
          return;
        }
        urlMap[url] = local;
        const dest = path.join(ROOT, local);
        const result = await downloadImage(url, dest);
        if (result === 'new') counts.new++;
        else if (result === 'cached') counts.cached++;
        else counts.error++;
      })
    );
    process.stdout.write(
      `\r   ${i + batch.length}/${urls.length}  · new ${counts.new} · cached ${counts.cached} · err ${counts.error}    `
    );
  }
  console.log('\n   ✓ image phase done');

  console.log('\n💾 Writing normalized JSON…');
  const normalized = allProducts.map(normalizeProduct).map((p) => localizeImages(p, urlMap));
  await fs.writeFile(
    path.join(DATA_DIR, 'products.json'),
    JSON.stringify(normalized, null, 2)
  );
  for (const p of normalized) {
    await fs.writeFile(
      path.join(PRODUCTS_DIR, `${p.handle}.json`),
      JSON.stringify(p, null, 2)
    );
  }
  for (const [handle, products] of Object.entries(collectionMap)) {
    const norm = products.map(normalizeProduct).map((p) => localizeImages(p, urlMap));
    await fs.writeFile(
      path.join(COLLECTIONS_DIR, `${handle}.json`),
      JSON.stringify(norm, null, 2)
    );
  }
  console.log('   ✓ wrote products.json + per-product + collection files');

  console.log(`\n✅ Sync complete. ${normalized.length} products, ${counts.new + counts.cached} images saved.`);
}

main().catch((e) => {
  console.error('\n❌ Sync failed:', e);
  process.exit(1);
});
