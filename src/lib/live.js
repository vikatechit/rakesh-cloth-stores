async function parse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Live catalogue did not return data.');
  }
}

export async function fetchLiveCatalog() {
  return parse(await fetch('/api/catalog', { cache: 'no-store' }));
}

export async function saveLiveProduct(password, product) {
  return parse(await fetch('/api/catalog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, action: 'upsert', product }),
  }));
}

export async function hideLiveProduct(password, id) {
  return parse(await fetch('/api/catalog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, action: 'hide', id }),
  }));
}

export async function saveLivePassword(password, newPassword) {
  return parse(await fetch('/api/catalog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, action: 'password', newPassword }),
  }));
}

export async function uploadLivePhoto(password, { name, mime, data }) {
  return parse(await fetch('/api/photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, name, mime, data }),
  }));
}
