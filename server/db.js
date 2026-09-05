/**
 * Rakesh Cloth Stores — SQLite database (Node 22+ built-in sqlite)
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DATA_DIR = process.env.DATA_DIR || __dirname;
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'store.db');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const DEFAULT_PRICE_TIERS = [
  { id: 'r1', title: '₹500 – ₹1,500', desc: 'Daily & festive', min: 500, max: 1500 },
  { id: 'r2', title: '₹1,501 – ₹3,000', desc: 'Party wear', min: 1501, max: 3000 },
  { id: 'r3', title: '₹3,001 – ₹5,000', desc: 'Designer', min: 3001, max: 5000 },
  { id: 'r4', title: '₹5,001 – ₹10,000', desc: 'Pattu & premium', min: 5001, max: 10000 },
  { id: 'r5', title: '₹10,001 – ₹20,000', desc: 'Bridal luxury', min: 10001, max: 20000 },
];

function tableHasColumn(table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'sarees',
      price REAL NOT NULL,
      original_price REAL,
      stock INTEGER NOT NULL DEFAULT 0,
      badge TEXT DEFAULT 'NEW',
      fabric TEXT,
      description TEXT,
      image_url TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hero_slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      label TEXT NOT NULL,
      link TEXT DEFAULT '#collections',
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      bill_no TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      pincode TEXT DEFAULT '',
      payment_method TEXT NOT NULL DEFAULT 'Cash On Delivery (COD)',
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      order_status TEXT NOT NULL DEFAULT 'Pending',
      total_amount REAL NOT NULL,
      notes TEXT,
      items TEXT NOT NULL DEFAULT '[]',
      video_room TEXT,
      stock_deducted INTEGER DEFAULT 0,
      confirmed_at TEXT,
      delivered_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      rating INTEGER NOT NULL,
      outfit TEXT NOT NULL,
      comment TEXT NOT NULL,
      media_url TEXT,
      is_video INTEGER DEFAULT 0,
      approved INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      whatsapp_number TEXT NOT NULL DEFAULT '919985728175',
      shop_hours TEXT DEFAULT '10:00 AM – 8:30 PM',
      video_start TEXT DEFAULT '10:00',
      video_end TEXT DEFAULT '20:30',
      instagram_url TEXT DEFAULT 'https://www.instagram.com/rakesh_mahanthy/',
      youtube_url TEXT DEFAULT 'https://youtube.com/@rakeshclothstores',
      maps_url TEXT DEFAULT 'https://share.google/8JlpdC0pL8h30meut',
      logo_url TEXT DEFAULT '/logo.png',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      cta TEXT NOT NULL DEFAULT 'EXPLORE →',
      image_url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  if (!tableHasColumn('store_settings', 'price_tiers')) {
    db.exec('ALTER TABLE store_settings ADD COLUMN price_tiers TEXT');
  }

  const adminRow = db.prepare('SELECT count(*) as count FROM admins').get();
  if (!adminRow || adminRow.count === 0) {
    const defaultHash = bcrypt.hashSync('1234', 10);
    db.prepare('INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)').run('admin', defaultHash, 'admin');
    console.log('Default admin initialized: user=admin, pin=1234');
  }

  const settingsRow = db.prepare('SELECT count(*) as count FROM store_settings').get();
  if (!settingsRow || settingsRow.count === 0) {
    db.prepare(`
      INSERT INTO store_settings (id, whatsapp_number, logo_url, price_tiers)
      VALUES (1, '919985728175', '/logo.png', ?)
    `).run(JSON.stringify(DEFAULT_PRICE_TIERS));
  } else {
    const current = db.prepare('SELECT price_tiers FROM store_settings WHERE id = 1').get();
    if (!current?.price_tiers) {
      db.prepare('UPDATE store_settings SET price_tiers = ? WHERE id = 1').run(JSON.stringify(DEFAULT_PRICE_TIERS));
    }
  }

  const catRow = db.prepare('SELECT count(*) as count FROM categories').get();
  if (!catRow || catRow.count === 0) {
    const defaultCategories = [
      { slug: 'sarees', title: 'DESIGNER SAREES', cta: 'SHOP SAREES →', image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80', sort_order: 1 },
      { slug: 'pattu', title: 'PATTU SAREES', cta: 'ROYAL SILK →', image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80', sort_order: 2 },
      { slug: 'lehengas', title: 'LEHENGAS', cta: 'BRIDAL SETS →', image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=800&auto=format&fit=crop&q=80', sort_order: 3 },
      { slug: 'suiting', title: 'SUITING', cta: 'PREMIUM PIECES →', image_url: 'https://images.unsplash.com/photo-1594938298603-c8148cfe4511?w=800&auto=format&fit=crop&q=80', sort_order: 4 },
      { slug: 'shirting', title: 'SHIRTING', cta: 'FINE FABRICS →', image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80', sort_order: 5 },
    ];
    const insertCat = db.prepare('INSERT INTO categories (slug, title, cta, image_url, sort_order) VALUES (?, ?, ?, ?, ?)');
    for (const c of defaultCategories) insertCat.run(c.slug, c.title, c.cta, c.image_url, c.sort_order);
  }

  const heroRow = db.prepare('SELECT count(*) as count FROM hero_slides').get();
  if (!heroRow || heroRow.count === 0) {
    const defaultSlides = [
      { image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80', label: 'Designer Sarees', link: '#collections', sort_order: 1 },
      { image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80', label: 'Pattu Collection', link: '#collections', sort_order: 2 },
      { image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=900&auto=format&fit=crop&q=80', label: 'Bridal Lehengas', link: '#collections', sort_order: 3 },
    ];
    const insertSlide = db.prepare('INSERT INTO hero_slides (image_url, label, link, sort_order) VALUES (?, ?, ?, ?)');
    for (const s of defaultSlides) insertSlide.run(s.image_url, s.label, s.link, s.sort_order);
  }

  const productRow = db.prepare('SELECT count(*) as count FROM products').get();
  if (!productRow || productRow.count === 0) {
    const defaults = [
      { name: 'Royal Wine Silk Saree', category: 'sarees', price: 1299, stock: 7, badge: 'NEW', fabric: 'Soft silk blend', description: 'Everyday festive saree with rich wine drape and gold border.', image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80' },
      { name: 'Festive Pink Silk Saree', category: 'sarees', price: 2499, stock: 5, badge: 'FESTIVE', fabric: 'Silk', description: 'Bright festive pink silk with elegant fall and pallu shine.', image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=900&auto=format&fit=crop&q=80' },
      { name: 'Classic Red Designer Saree', category: 'sarees', price: 3499, stock: 4, badge: 'BESTSELLER', fabric: 'Designer silk', description: 'Statement red designer saree for functions and receptions.', image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80' },
      { name: 'Royal Blue Pattu Saree', category: 'pattu', price: 6999, stock: 3, badge: 'PATTU', fabric: 'Pattu silk', description: 'Traditional pattu weave with temple-inspired border.', image_url: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=900&auto=format&fit=crop&q=80' },
      { name: 'Violet Grand Pattu Saree', category: 'pattu', price: 9999, stock: 2, badge: 'PREMIUM', fabric: 'Pure pattu', description: 'Grand violet pattu saree for weddings and family events.', image_url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=900&auto=format&fit=crop&q=80' },
      { name: 'Bridal Gold Silk Saree', category: 'pattu', price: 14999, stock: 2, badge: 'BRIDAL', fabric: 'Bridal silk', description: 'Heavy bridal gold silk for muhurtham and reception looks.', image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80' },
      { name: 'Designer Emerald Saree', category: 'sarees', price: 4999, stock: 6, badge: 'NEW', fabric: 'Designer weave', description: 'Emerald designer drape with rich contrast border.', image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80' },
      { name: 'Temple Border Pattu', category: 'pattu', price: 19999, stock: 1, badge: 'HERITAGE', fabric: 'Heritage pattu', description: 'Museum-grade temple border pattu for heirloom occasions.', image_url: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=900&auto=format&fit=crop&q=80' },
      { name: 'Soft Festive Saree', category: 'sarees', price: 899, stock: 8, badge: 'VALUE', fabric: 'Soft silk', description: 'Light festive saree for daily pooja and family visits.', image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=900&auto=format&fit=crop&q=80' },
      { name: 'Elegant Daily Wear', category: 'sarees', price: 1499, stock: 9, badge: 'DAILY', fabric: 'Comfort silk', description: 'Easy-drape daily wear with a premium boutique finish.', image_url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=900&auto=format&fit=crop&q=80' },
      { name: 'Bridal Rose Lehenga', category: 'lehengas', price: 12999, stock: 2, badge: 'BRIDAL', fabric: 'Embroidered georgette', description: 'Rose bridal lehenga with rich embroidery and flare.', image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=900&auto=format&fit=crop&q=80' },
      { name: 'Premium Suiting Piece', category: 'suiting', price: 2499, stock: 10, badge: 'MEN', fabric: 'Suiting blend', description: 'Premium suiting piece for tailored trousers and coats.', image_url: 'https://images.unsplash.com/photo-1594938298603-c8148cfe4511?w=900&auto=format&fit=crop&q=80' },
    ];
    const insert = db.prepare(`
      INSERT INTO products (name, category, price, stock, badge, fabric, description, image_url, images)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of defaults) {
      insert.run(p.name, p.category, p.price, p.stock, p.badge, p.fabric, p.description, p.image_url, JSON.stringify([p.image_url]));
    }
  }

  const reviewRow = db.prepare('SELECT count(*) as count FROM reviews').get();
  if (!reviewRow || reviewRow.count === 0) {
    const reviews = [
      { name: 'Lakshmi R.', city: 'Gajuwaka, Vizag', rating: 5, outfit: 'Royal Blue Pattu Saree', comment: 'Beautiful quality and the shop confirmed my order on video call. Felt like a premium boutique experience.', media_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80', is_video: 0 },
      { name: 'Sravani K.', city: 'Kurmannapalem', rating: 5, outfit: 'Festive Pink Silk Saree', comment: 'Simple price ranges, large photos, and fast Vizag delivery. The saree looked exactly like the uploaded picture.', media_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=600&auto=format&fit=crop&q=80', is_video: 0 },
      { name: 'Meena Devi', city: 'Anakapalle', rating: 5, outfit: 'Bridal Gold Silk Saree', comment: 'After confirmation they joined a video call and showed the zari closely. Very trustworthy store.', media_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80', is_video: 0 },
    ];
    const insertRev = db.prepare('INSERT INTO reviews (name, city, rating, outfit, comment, media_url, is_video) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const r of reviews) insertRev.run(r.name, r.city, r.rating, r.outfit, r.comment, r.media_url, r.is_video);
  }
}

initDatabase();

db.parseJson = parseJson;
db.DEFAULT_PRICE_TIERS = DEFAULT_PRICE_TIERS;
module.exports = db;
