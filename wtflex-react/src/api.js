// All product / collection data is pre-synced into /public/data by
// `npm run sync`. Images live in /public/assets. No network calls to
// wtflex.in at runtime — we serve everything from the local origin.

const BASE = `${import.meta.env.BASE_URL}data`;

// In-memory cache so repeat fetches in a single session reuse the response.
const cache = new Map();
async function loadJSON(url) {
  if (cache.has(url)) return cache.get(url);
  const promise = fetch(url).then((res) => {
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return res.json();
  });
  cache.set(url, promise);
  try {
    return await promise;
  } catch (e) {
    cache.delete(url);
    throw e;
  }
}

export async function fetchProducts({ limit = 30 } = {}) {
  const all = await loadJSON(`${BASE}/products.json`);
  return all.slice(0, limit);
}

export async function fetchProductByHandle(handle) {
  return loadJSON(`${BASE}/products/${handle}.json`);
}

export async function fetchCollectionProducts(handle, { limit = 50 } = {}) {
  const products = await loadJSON(`${BASE}/collections/${handle}.json`);
  return products.slice(0, limit);
}

// Used by Categories / Match-the-Mood / Shop-the-Look to render preview imagery.
export async function fetchCollectionPreviews(handles) {
  const entries = await Promise.all(
    handles.map(async (handle) => {
      try {
        const products = await fetchCollectionProducts(handle, { limit: 4 });
        const first = products[0];
        return [
          handle,
          {
            image:
              first?.featured ||
              products.find((p) => p.featured)?.featured ||
              null,
            sampleProducts: products,
          },
        ];
      } catch {
        return [handle, null];
      }
    })
  );
  return Object.fromEntries(entries);
}

export function formatPrice(n) {
  return '₹' + Math.round(n || 0).toLocaleString('en-IN');
}
