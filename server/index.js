/**
 * Rakesh Cloth Stores — production Express server
 * Permanent SQLite storage, JWT admin auth, real image uploads, WhatsApp order flow.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8081;
const JWT_SECRET = process.env.JWT_SECRET || 'rakesh_cloth_stores_premium_jwt_2026';
const DIST_DIR = path.join(__dirname, '../dist');
const IS_PRODUCTION =
  process.env.NODE_ENV === 'production' || fs.existsSync(path.join(DIST_DIR, 'index.html'));

const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
];
const EXTRA_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = [...new Set([...DEFAULT_ORIGINS, ...EXTRA_ORIGINS])];

app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

function resolveDataDir() {
  const preferred = process.env.DATA_DIR || __dirname;
  try {
    if (!fs.existsSync(preferred)) fs.mkdirSync(preferred, { recursive: true });
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    return __dirname;
  }
}
const DATA_DIR = resolveDataDir();
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `rks-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const mime = String(file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();
    const okMime = /^(image|video)\//.test(mime);
    const okExt = /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|mp4|mov|m4v|webm|3gp)$/i.test(ext);
    const ok = okMime || okExt;
    cb(ok ? null : new Error('Only image or video files are allowed.'), !!ok);
  },
});

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Access denied. Please log in.' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Malformed authorization token.' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ success: false, error: 'Session expired. Please log in again.' });
  }
}

function mapProduct(r) {
  const images = db.parseJson(r.images, r.image_url ? [r.image_url] : []);
  return { ...r, images: Array.isArray(images) && images.length ? images : [r.image_url] };
}

function mapOrder(r) {
  return {
    ...r,
    items: db.parseJson(r.items, []),
  };
}

function slugifyCategory(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'category';
}

// Auth
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Admin ID and password are required.' });
  }
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ success: false, error: 'Invalid admin ID or password.' });
  }
  const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ success: true, token, admin: { username: admin.username, role: admin.role } });
});

app.get('/api/auth/verify', authenticateAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

app.post('/api/auth/change-password', authenticateAdmin, (req, res) => {
  const { currentPassword, newPassword, newUsername } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Current password and new password are required.' });
  }
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
    return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
  }
  const updatedUser = newUsername && newUsername.trim() ? newUsername.trim() : admin.username;
  db.prepare('UPDATE admins SET username = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(updatedUser, bcrypt.hashSync(newPassword, 10), admin.id);
  res.json({ success: true, message: 'Admin login updated successfully.' });
});

// Settings
app.get('/api/settings', (_req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM store_settings WHERE id = 1').get();
    const mapped = settings
      ? { ...settings, price_tiers: db.parseJson(settings.price_tiers, db.DEFAULT_PRICE_TIERS) }
      : {};
    res.json({ success: true, settings: mapped });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/settings', authenticateAdmin, (req, res) => {
  try {
    const { whatsapp_number, instagram_url, youtube_url, maps_url, logo_url, shop_hours, price_tiers } = req.body || {};
    let tiersJson = null;
    if (price_tiers != null) {
      const list = Array.isArray(price_tiers) ? price_tiers : db.parseJson(price_tiers, []);
      const cleaned = list
        .filter((t) => t && t.title)
        .map((t, i) => ({
          id: String(t.id || `r${i + 1}`).replace(/[^a-z0-9_-]/gi, '') || `r${i + 1}`,
          title: String(t.title).trim(),
          desc: String(t.desc || '').trim(),
          min: Number(t.min) || 0,
          max: Number(t.max) || 0,
        }))
        .filter((t) => t.max >= t.min);
      if (!cleaned.length) {
        return res.status(400).json({ success: false, error: 'Add at least one valid price range.' });
      }
      tiersJson = JSON.stringify(cleaned);
    }
    db.prepare(`
      UPDATE store_settings SET
        whatsapp_number = COALESCE(?, whatsapp_number),
        instagram_url = COALESCE(?, instagram_url),
        youtube_url = COALESCE(?, youtube_url),
        maps_url = COALESCE(?, maps_url),
        logo_url = COALESCE(?, logo_url),
        shop_hours = COALESCE(?, shop_hours),
        price_tiers = COALESCE(?, price_tiers),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(whatsapp_number, instagram_url, youtube_url, maps_url, logo_url, shop_hours, tiersJson);
    const updated = db.prepare('SELECT * FROM store_settings WHERE id = 1').get();
    res.json({
      success: true,
      settings: { ...updated, price_tiers: db.parseJson(updated.price_tiers, db.DEFAULT_PRICE_TIERS) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Products
app.get('/api/products', (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY id DESC').all();
    res.json({ success: true, products: rows.map(mapProduct) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/products', authenticateAdmin, (req, res) => {
  try {
    const { name, category, price, original_price, stock, badge, fabric, description, image_url, images } = req.body || {};
    if (!name || price === undefined || !image_url) {
      return res.status(400).json({ success: false, error: 'Product name, price and image are required.' });
    }
    const imgs = Array.isArray(images) && images.length ? images : [image_url];
    const info = db.prepare(`
      INSERT INTO products (name, category, price, original_price, stock, badge, fabric, description, image_url, images)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      category || 'sarees',
      Number(price),
      original_price ? Number(original_price) : null,
      Number(stock) || 0,
      badge || 'NEW',
      fabric || '',
      description || '',
      image_url,
      JSON.stringify(imgs)
    );
    const product = mapProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(Number(info.lastInsertRowid)));
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', authenticateAdmin, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Product not found.' });
    const p = { ...existing, ...req.body };
    const imgs = Array.isArray(p.images) ? p.images : db.parseJson(existing.images, [existing.image_url]);
    db.prepare(`
      UPDATE products SET
        name = ?, category = ?, price = ?, original_price = ?, stock = ?, badge = ?,
        fabric = ?, description = ?, image_url = ?, images = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      p.name,
      p.category,
      Number(p.price),
      p.original_price ? Number(p.original_price) : null,
      Number(p.stock),
      p.badge || 'NEW',
      p.fabric || '',
      p.description || '',
      p.image_url,
      JSON.stringify(imgs),
      req.params.id
    );
    res.json({ success: true, product: mapProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/products/:id/stock', authenticateAdmin, (req, res) => {
  try {
    const add = Number(req.body?.add);
    if (!Number.isFinite(add) || add === 0) {
      return res.status(400).json({ success: false, error: 'Enter a valid stock quantity.' });
    }
    db.prepare('UPDATE products SET stock = MAX(0, stock + ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(add, req.params.id);
    res.json({ success: true, product: mapProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('UPDATE products SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Product removed from catalogue.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Categories & hero
app.get('/api/categories', (_req, res) => {
  try {
    res.json({ success: true, categories: db.prepare('SELECT * FROM categories WHERE active = 1 ORDER BY sort_order ASC').all() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/categories', authenticateAdmin, (req, res) => {
  try {
    const { title, cta, image_url, slug, sort_order } = req.body || {};
    if (!title || !image_url) {
      return res.status(400).json({ success: false, error: 'Category name and image are required.' });
    }
    const existing = db.prepare('SELECT slug FROM categories').all().map((row) => row.slug);
    let unique = slugifyCategory(slug || title);
    let n = 2;
    while (existing.includes(unique)) unique = `${slugifyCategory(slug || title)}-${n++}`;
    const maxSort = db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM categories').get().m;
    const info = db.prepare(
      'INSERT INTO categories (slug, title, cta, image_url, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).run(unique, title.trim(), String(cta || 'EXPLORE →').trim(), image_url, Number(sort_order) || maxSort + 1);
    res.json({ success: true, category: db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(info.lastInsertRowid)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/categories/:id', authenticateAdmin, (req, res) => {
  try {
    const { title, cta, image_url, sort_order } = req.body || {};
    db.prepare(`
      UPDATE categories SET
        title = COALESCE(?, title),
        cta = COALESCE(?, cta),
        image_url = COALESCE(?, image_url),
        sort_order = COALESCE(?, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title || null, cta || null, image_url || null, sort_order ?? null, req.params.id);
    res.json({ success: true, category: db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/categories/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('UPDATE categories SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/hero-slides', (_req, res) => {
  try {
    res.json({ success: true, slides: db.prepare('SELECT * FROM hero_slides WHERE active = 1 ORDER BY sort_order ASC, id ASC').all() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/hero-slides', authenticateAdmin, (req, res) => {
  try {
    const { image_url, label, link, sort_order } = req.body || {};
    if (!image_url || !label) return res.status(400).json({ success: false, error: 'Slide image and label are required.' });
    const info = db.prepare('INSERT INTO hero_slides (image_url, label, link, sort_order) VALUES (?, ?, ?, ?)')
      .run(image_url, label, link || '#collections', Number(sort_order) || 0);
    res.json({ success: true, slide: db.prepare('SELECT * FROM hero_slides WHERE id = ?').get(Number(info.lastInsertRowid)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/hero-slides/:id', authenticateAdmin, (req, res) => {
  try {
    const { image_url, label, link, sort_order } = req.body || {};
    db.prepare(`
      UPDATE hero_slides SET
        image_url = COALESCE(?, image_url),
        label = COALESCE(?, label),
        link = COALESCE(?, link),
        sort_order = COALESCE(?, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(image_url, label, link, sort_order, req.params.id);
    res.json({ success: true, slide: db.prepare('SELECT * FROM hero_slides WHERE id = ?').get(req.params.id) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/hero-slides/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM hero_slides WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reviews
app.get('/api/reviews', (_req, res) => {
  try {
    res.json({ success: true, reviews: db.prepare('SELECT * FROM reviews WHERE approved = 1 ORDER BY id DESC').all() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/reviews', (req, res) => {
  try {
    const { name, city, rating, outfit, comment, media_url, is_video } = req.body || {};
    if (!name || !city || !outfit || !comment) {
      return res.status(400).json({ success: false, error: 'Please complete all review fields.' });
    }
    db.prepare('INSERT INTO reviews (name, city, rating, outfit, comment, media_url, is_video) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(name, city, Number(rating) || 5, outfit, comment, media_url || null, is_video ? 1 : 0);
    res.json({ success: true, message: 'Thank you. Your review is now live on the website.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/reviews/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Orders — stock is reserved only when admin CONFIRMS (Rakesh business rule)
app.post('/api/orders', (req, res) => {
  const { customer_name, mobile, address, city, pincode, payment_method, notes, items } = req.body || {};
  if (!customer_name || !mobile || !address || !city || !items || !items.length) {
    return res.status(400).json({ success: false, error: 'Customer details and products are required.' });
  }
  const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
  if (cleanMobile.length !== 10) {
    return res.status(400).json({ success: false, error: 'Please provide a valid 10-digit mobile number.' });
  }
  if (items.length > 5) {
    return res.status(400).json({ success: false, error: 'Maximum 5 different products per order.' });
  }

  try {
    let calculatedTotal = 0;
    const validatedItems = [];
    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(item.id);
      if (!product) throw new Error(`Product is no longer available.`);
      const qty = Math.max(1, parseInt(item.qty, 10) || 1);
      if (product.stock < qty) throw new Error(`Insufficient stock for "${product.name}". Only ${product.stock} available.`);
      calculatedTotal += product.price * qty;
      validatedItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty,
        img: product.image_url,
        image_url: product.image_url,
        total: product.price * qty,
      });
    }

    const stamp = Date.now().toString().slice(-8);
    const orderNumber = 'RKS' + stamp;
    const billNo = 'RKS-' + stamp;
    const info = db.prepare(`
      INSERT INTO orders (
        order_number, bill_no, customer_name, mobile, address, city, pincode,
        payment_method, payment_status, order_status, total_amount, notes, items
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderNumber,
      billNo,
      customer_name.trim(),
      cleanMobile,
      address.trim(),
      city.trim(),
      String(pincode || '').trim(),
      payment_method || 'Cash On Delivery (COD)',
      'Pending',
      'Pending',
      calculatedTotal,
      notes || '',
      JSON.stringify(validatedItems)
    );

    const created = mapOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(info.lastInsertRowid)));
    res.json({ success: true, message: 'Order placed. Waiting for store confirmation.', order: created });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/orders/lookup', (req, res) => {
  try {
    const cleanMobile = String(req.body?.mobile || '').replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number.' });
    }
    const orders = db.prepare('SELECT * FROM orders WHERE mobile = ? ORDER BY id DESC').all(cleanMobile).map(mapOrder);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/orders', authenticateAdmin, (_req, res) => {
  try {
    res.json({ success: true, orders: db.prepare('SELECT * FROM orders ORDER BY id DESC').all().map(mapOrder) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/orders/:id/status', authenticateAdmin, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });

    const nextStatus = req.body?.order_status;
    if (!nextStatus) return res.status(400).json({ success: false, error: 'Order status is required.' });

    if (nextStatus === 'Confirmed' && order.order_status === 'Pending') {
      const items = db.parseJson(order.items, []);
      db.exec('BEGIN');
      try {
        for (const item of items) {
          const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.id);
          if (!product || product.stock < item.qty) {
            throw new Error(`Not enough stock for ${item.name}. Restock before confirming.`);
          }
          db.prepare('UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(item.qty, item.id);
        }
        db.prepare(`
          UPDATE orders SET
            order_status = 'Confirmed',
            stock_deducted = 1,
            confirmed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(order.id);
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    } else if (nextStatus === 'Delivered') {
      db.prepare(`
        UPDATE orders SET order_status = 'Delivered', delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(order.id);
    } else if (nextStatus === 'Cancelled' && order.order_status === 'Confirmed' && order.stock_deducted) {
      const items = db.parseJson(order.items, []);
      db.exec('BEGIN');
      try {
        for (const item of items) {
          db.prepare('UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(item.qty, item.id);
        }
        db.prepare(`
          UPDATE orders SET order_status = 'Cancelled', stock_deducted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(order.id);
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    } else {
      db.prepare('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nextStatus, order.id);
    }

    const updated = mapOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id));
    res.json({
      success: true,
      order: updated,
      message: nextStatus === 'Confirmed'
        ? 'Order confirmed. The customer can now start a WhatsApp video call.'
        : 'Order updated.',
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/orders/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/analytics', authenticateAdmin, (_req, res) => {
  try {
    const totalOrdersRow = db.prepare('SELECT count(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders').get();
    const pendingOrdersCount = db.prepare("SELECT count(*) as count FROM orders WHERE order_status = 'Pending'").get().count;
    const confirmedOrdersCount = db.prepare("SELECT count(*) as count FROM orders WHERE order_status = 'Confirmed'").get().count;
    const today = new Date().toISOString().slice(0, 10);
    const todaySalesRow = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue, count(*) as count FROM orders WHERE date(created_at) = date(?)
    `).get(today);
    const totalStock = db.prepare('SELECT COALESCE(SUM(stock), 0) as stock FROM products WHERE active = 1').get().stock;
    const activeProducts = db.prepare('SELECT count(*) as count FROM products WHERE active = 1').get().count;
    const lowStockProducts = db.prepare('SELECT count(*) as count FROM products WHERE active = 1 AND stock > 0 AND stock <= 2').get().count;
    const outOfStockProducts = db.prepare('SELECT count(*) as count FROM products WHERE active = 1 AND stock = 0').get().count;

    const weeklyDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      const dayData = db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as revenue, count(*) as count FROM orders WHERE date(created_at) = date(?)
      `).get(dayStr);
      weeklyDays.push({ date: dayStr, label: dayName, revenue: dayData.revenue, orders: dayData.count });
    }

    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const yearMonth = d.toISOString().slice(0, 7);
      const monthLabel = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const mData = db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as revenue, count(*) as count FROM orders WHERE strftime('%Y-%m', created_at) = ?
      `).get(yearMonth);
      monthlyData.push({ month: yearMonth, label: monthLabel, revenue: mData.revenue, orders: mData.count });
    }

    res.json({
      success: true,
      summary: {
        totalRevenue: totalOrdersRow.revenue,
        todaySales: todaySalesRow.revenue,
        todayOrders: todaySalesRow.count,
        totalOrders: totalOrdersRow.count,
        pendingOrders: pendingOrdersCount,
        confirmedOrders: confirmedOrdersCount,
        averageOrderValue: totalOrdersRow.count ? Math.round(totalOrdersRow.revenue / totalOrdersRow.count) : 0,
        totalStock,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
      },
      weeklyChart: weeklyDays,
      monthlyChart: monthlyData,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function sendUploadResult(req, res) {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });
  const fileUrl = `/uploads/${req.file.filename}`;
  const ext = path.extname(req.file.originalname || req.file.filename || '').toLowerCase();
  const isVideo = String(req.file.mimetype || '').startsWith('video') || /\.(mp4|mov|m4v|webm|3gp)$/i.test(ext);
  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size,
    isVideo,
  });
}

app.post('/api/upload', authenticateAdmin, upload.single('file'), (req, res) => sendUploadResult(req, res));
app.post('/api/upload/public', upload.single('file'), (req, res) => sendUploadResult(req, res));
app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only image or video files are allowed.') {
    return res.status(400).json({ success: false, error: err.message || 'Upload failed.' });
  }
  return next(err);
});

if (IS_PRODUCTION) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nRAKESH CLOTH STORES server online`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Database: ${path.join(DATA_DIR, 'store.db')}`);
  console.log(`Uploads: ${UPLOADS_DIR}`);
  console.log(`Mode: ${IS_PRODUCTION ? 'production (serving dist)' : 'api-only (Vite on :5173)'}\n`);
});
