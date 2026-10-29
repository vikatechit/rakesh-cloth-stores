import { createHash } from 'crypto';
import { list, put } from '@vercel/blob';

export const CATALOG_PATH = 'catalog/products.json';

export function hashPassword(value) {
  return createHash('sha256').update(String(value || '')).digest('hex');
}

export function publicProduct(product = {}) {
  const image = String(product.image_url || product.img || '').startsWith('data:')
    ? ''
    : String(product.image_url || product.img || '');
  return {
    id: String(product.id || ''),
    name: String(product.name || '').trim(),
    category: String(product.category || product.cat || 'sarees'),
    price: product.price == null || product.price === '' ? 0 : Number(product.price),
    stock: product.stock == null || product.stock === '' ? 1 : Number(product.stock),
    badge: String(product.badge || ''),
    fabric: String(product.fabric || ''),
    description: String(product.description || product.desc || ''),
    image_url: image,
    img: image,
    available: String(product.available || 'YES').toUpperCase() === 'NO' ? 'NO' : 'YES',
  };
}

export function passwordOk(password, catalog) {
  const incoming = String(password || '');
  if (!incoming) return false;
  const incomingHash = hashPassword(incoming);
  if (catalog?.passwordHash) return incomingHash === catalog.passwordHash;
  return incoming === '1234' || incomingHash === hashPassword('1234');
}

export async function readCatalog() {
  const { blobs } = await list({ prefix: CATALOG_PATH, limit: 20 });
  const match = (blobs || []).find((item) => item.pathname === CATALOG_PATH);
  if (!match?.url) return { products: [], passwordHash: '' };
  const res = await fetch(match.url, { cache: 'no-store' });
  if (!res.ok) return { products: [], passwordHash: '' };
  const data = await res.json();
  return {
    products: Array.isArray(data.products) ? data.products : [],
    passwordHash: String(data.passwordHash || ''),
  };
}

export async function writeCatalog(catalog) {
  const payload = {
    products: (catalog.products || []).map(publicProduct).filter((p) => p.id && p.name),
    passwordHash: String(catalog.passwordHash || ''),
    updatedAt: new Date().toISOString(),
  };
  const blob = await put(CATALOG_PATH, JSON.stringify(payload), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
  return { ...payload, url: blob.url };
}

export function json(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res.status(status).json(body);
}
