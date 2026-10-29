import { put } from '@vercel/blob';
import { json, passwordOk, readCatalog } from './_store.js';

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const catalog = await readCatalog();
    if (!passwordOk(body.password, catalog)) {
      return json(res, 401, { ok: false, error: 'Unauthorized' });
    }

    const raw = String(body.data || '').replace(/^data:image\/[^;]+;base64,/, '');
    if (!raw) return json(res, 400, { ok: false, error: 'No photo data' });

    const bytes = Buffer.from(raw, 'base64');
    if (!bytes.length) return json(res, 400, { ok: false, error: 'This photo could not be saved.' });

    const safeName = String(body.name || 'product.jpg')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'product.jpg';
    const pathname = `photos/${Date.now()}-${safeName.replace(/\.[^.]+$/, '')}.jpg`;

    const blob = await put(pathname, bytes, {
      access: 'public',
      addRandomSuffix: true,
      contentType: body.mime || 'image/jpeg',
    });

    return json(res, 200, { ok: true, url: blob.url });
  } catch (err) {
    return json(res, 500, { ok: false, error: 'Could not save this photo on the live website.' });
  }
}
