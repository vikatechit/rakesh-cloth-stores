import { json, passwordOk, publicProduct, readCatalog, writeCatalog, hashPassword } from './_store.js';

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });

  try {
    if (req.method === 'GET') {
      const catalog = await readCatalog();
      return json(res, 200, { ok: true, products: catalog.products });
    }

    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

    const body = req.body || {};
    const catalog = await readCatalog();
    if (!passwordOk(body.password, catalog)) {
      return json(res, 401, { ok: false, error: 'Unauthorized' });
    }

    if (body.action === 'password') {
      const next = String(body.newPassword || '');
      if (next.length < 4) return json(res, 400, { ok: false, error: 'Use at least 4 characters.' });
      const saved = await writeCatalog({ ...catalog, passwordHash: hashPassword(next) });
      return json(res, 200, { ok: true, products: saved.products });
    }

    if (body.action === 'hide') {
      const id = String(body.id || '');
      const products = catalog.products.map((p) => (p.id === id ? { ...p, available: 'NO' } : p));
      const saved = await writeCatalog({ ...catalog, products });
      return json(res, 200, { ok: true, products: saved.products });
    }

    const product = publicProduct(body.product || body);
    if (!product.id || !product.name) {
      return json(res, 400, { ok: false, error: 'Item name is required.' });
    }

    const existing = catalog.products.findIndex((p) => p.id === product.id || p.name.toLowerCase() === product.name.toLowerCase());
    const products = [...catalog.products];
    if (existing >= 0) products[existing] = { ...products[existing], ...product, id: products[existing].id || product.id };
    else products.unshift(product);

    const saved = await writeCatalog({ ...catalog, products });
    return json(res, 200, { ok: true, products: saved.products, product });
  } catch (err) {
    return json(res, 500, { ok: false, error: 'Could not save the live catalogue.' });
  }
}
