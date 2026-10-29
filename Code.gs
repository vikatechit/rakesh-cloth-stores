function book() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

const HEADERS = {
  Products: ['Product ID', 'Name', 'Category', 'Price', 'Stock', 'Badge', 'Fabric', 'Image URL', 'Description', 'Available'],
  Orders: ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Items JSON', 'Subtotal', 'Note', 'Status'],
  Customers: ['Phone', 'Name', 'Address', 'First Order', 'Last Order', 'Orders Count'],
  Enquiries: ['Enquiry ID', 'Date', 'Name', 'Phone', 'Message', 'Status'],
  Reviews: ['Review ID', 'Date', 'Name', 'City', 'Outfit', 'Rating', 'Comment', 'Media URL', 'Is Video', 'Status'],
  Settings: ['Key', 'Value'],
  Categories: ['Category', 'Display Order', 'Active']
};

const SEED = [
  ['RKS-001', 'Royal Wine Silk Saree', 'sarees', 1299, 7, 'NEW', 'Soft silk blend', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80', 'Everyday festive saree with rich wine drape and gold border.', 'YES'],
  ['RKS-002', 'Festive Pink Silk Saree', 'sarees', 2499, 5, 'FESTIVE', 'Silk', 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=900&auto=format&fit=crop&q=80', 'Bright festive pink silk with elegant fall and pallu shine.', 'YES'],
  ['RKS-003', 'Classic Red Designer Saree', 'sarees', 3499, 4, 'BESTSELLER', 'Designer silk', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80', 'Statement red designer saree for functions and receptions.', 'YES'],
  ['RKS-004', 'Royal Blue Pattu Saree', 'pattu', 6999, 3, 'PATTU', 'Pattu silk', 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=900&auto=format&fit=crop&q=80', 'Traditional pattu weave with temple-inspired border.', 'YES'],
  ['RKS-005', 'Violet Grand Pattu Saree', 'pattu', 9999, 2, 'PREMIUM', 'Pure pattu', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=900&auto=format&fit=crop&q=80', 'Grand violet pattu saree for weddings and family events.', 'YES'],
  ['RKS-006', 'Bridal Gold Silk Saree', 'pattu', 14999, 2, 'BRIDAL', 'Bridal silk', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80', 'Heavy bridal gold silk for muhurtham and reception looks.', 'YES'],
  ['RKS-007', 'Designer Emerald Saree', 'sarees', 4999, 6, 'NEW', 'Designer weave', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80', 'Emerald designer drape with rich contrast border.', 'YES'],
  ['RKS-008', 'Temple Border Pattu', 'pattu', 19999, 1, 'HERITAGE', 'Heritage pattu', 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=900&auto=format&fit=crop&q=80', 'Museum-grade temple border pattu for heirloom occasions.', 'YES'],
  ['RKS-009', 'Soft Festive Saree', 'sarees', 899, 8, 'VALUE', 'Soft silk', 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=900&auto=format&fit=crop&q=80', 'Light festive saree for daily pooja and family visits.', 'YES'],
  ['RKS-010', 'Elegant Daily Wear', 'sarees', 1499, 9, 'DAILY', 'Comfort silk', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=900&auto=format&fit=crop&q=80', 'Easy-drape daily wear with a premium boutique finish.', 'YES'],
  ['RKS-011', 'Bridal Rose Lehenga', 'lehengas', 12999, 2, 'BRIDAL', 'Embroidered georgette', 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=900&auto=format&fit=crop&q=80', 'Rose bridal lehenga with rich embroidery and flare.', 'YES'],
  ['RKS-012', 'Premium Suiting Piece', 'suiting', 2499, 10, 'MEN', 'Suiting blend', 'https://images.unsplash.com/photo-1594938298603-c8148cfe4511?w=800&auto=format&fit=crop&q=80', 'Premium suiting piece for tailored trousers and coats.', 'YES']
];

function getAdminPassword() {
  const s = book().getSheetByName('Settings');
  const v = s.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][0]) === 'ADMIN_PASSWORD' && v[i][1]) return String(v[i][1]);
  }
  return '1234';
}

function passwordOk(value) {
  return String(value || '') === getAdminPassword();
}

function setup() {
  const ss = book();
  Object.keys(HEADERS).forEach(function (n) {
    const s = ss.getSheetByName(n) || ss.insertSheet(n);
    if (s.getLastRow() === 0) {
      s.getRange(1, 1, 1, HEADERS[n].length).setValues([HEADERS[n]]);
    }
    s.setFrozenRows(1);
  });
  const settings = ss.getSheetByName('Settings');
  var vals = settings.getDataRange().getValues();
  ensureSetting(settings, vals, 'ADMIN_PASSWORD', '1234');
  vals = settings.getDataRange().getValues();
  ensureSetting(settings, vals, 'WHATSAPP', '919985728175');
  vals = settings.getDataRange().getValues();
  ensureSetting(settings, vals, 'CONTACT_EMAIL', '');
  vals = settings.getDataRange().getValues();
  ensureSetting(settings, vals, 'INSTAGRAM', 'https://www.instagram.com/rakesh_mahanthy/');
  vals = settings.getDataRange().getValues();
  ensureSetting(settings, vals, 'FACEBOOK', '');
  vals = settings.getDataRange().getValues();
  ensureSetting(settings, vals, 'YOUTUBE', 'https://youtube.com/@rakeshclothstores');
  vals = settings.getDataRange().getValues();
  ensureSetting(settings, vals, 'MAPS', 'https://share.google/8JlpdC0pL8h30meut');
  vals = settings.getDataRange().getValues();
  ensureSetting(settings, vals, 'HOURS', '10:00 AM – 8:30 PM');
  vals = settings.getDataRange().getValues();
  ensureSetting(settings, vals, 'SHOP_ADDRESSES', JSON.stringify([{
    id: 'shop-vizag',
    label: 'Rakesh Cloth Stores',
    line1: 'Near Duvvada Bridge, opposite Dama Convention',
    line2: 'Kurmannapalem, Gajuwaka',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    pin: '530046'
  }]));
  const p = ss.getSheetByName('Products');
  if (p.getLastRow() <= 1) {
    p.getRange(2, 1, SEED.length, SEED[0].length).setValues(SEED);
  }
}

function rememberCustomer(ss, customer) {
  if (!customer) return;
  var phone = String(customer.phone || '').trim();
  if (!phone) return;
  var sheet = ss.getSheetByName('Customers');
  var rows = sheet.getDataRange().getValues();
  var now = new Date();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === phone) {
      var count = Number(rows[i][5] || 0) + 1;
      sheet.getRange(i + 1, 2, 1, 5).setValues([[
        customer.name || rows[i][1],
        customer.address || rows[i][2],
        rows[i][3] || now,
        now,
        count
      ]]);
      return;
    }
  }
  sheet.appendRow([phone, customer.name || '', customer.address || '', now, now, 1]);
}

function ensureSetting(settings, rows, key, value) {
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === key) return;
  }
  settings.appendRow([key, value]);
}

function setSetting(settings, key, value) {
  const rows = settings.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === key) {
      settings.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  settings.appendRow([key, value]);
}

function readSettings() {
  const rows = book().getSheetByName('Settings').getDataRange().getValues();
  const out = {
    whatsapp: '919985728175',
    email: '',
    instagram: 'https://www.instagram.com/rakesh_mahanthy/',
    facebook: '',
    youtube: 'https://youtube.com/@rakeshclothstores',
    maps: 'https://share.google/8JlpdC0pL8h30meut',
    hours: '10:00 AM – 8:30 PM',
    logo: '',
    addresses: [],
    hero: [],
    categories: []
  };
  for (var n = 1; n < rows.length; n++) {
    var key = String(rows[n][0] || '');
    var val = rows[n][1] == null ? '' : String(rows[n][1]);
    if (key === 'WHATSAPP' && val) out.whatsapp = val.replace(/\D/g, '');
    else if (key === 'CONTACT_EMAIL') out.email = val;
    else if (key === 'INSTAGRAM') out.instagram = val;
    else if (key === 'FACEBOOK') out.facebook = val;
    else if (key === 'YOUTUBE') out.youtube = val;
    else if (key === 'MAPS') out.maps = val;
    else if (key === 'HOURS') out.hours = val;
    else if (key === 'LOGO') out.logo = val;
    else if (key === 'SHOP_ADDRESSES') {
      try { out.addresses = val ? JSON.parse(val) : []; } catch (err) { out.addresses = []; }
    } else if (key === 'HERO_SLIDES') {
      try { out.hero = val ? JSON.parse(val) : []; } catch (err) { out.hero = []; }
    } else if (key === 'CATEGORIES_JSON') {
      try { out.categories = val ? JSON.parse(val) : []; } catch (err) { out.categories = []; }
    }
  }
  return out;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function productFromRow(r) {
  return {
    id: String(r[0] || ''),
    name: String(r[1] || ''),
    category: String(r[2] || 'sarees'),
    cat: String(r[2] || 'sarees'),
    price: r[3] === '' || r[3] == null ? null : Number(r[3]),
    stock: r[4] === '' || r[4] == null ? 1 : Number(r[4]),
    badge: String(r[5] || ''),
    fabric: String(r[6] || ''),
    img: String(r[7] || ''),
    image_url: String(r[7] || ''),
    desc: String(r[8] || ''),
    description: String(r[8] || ''),
    available: String(r[9] || 'YES')
  };
}

function doGet(e) {
  setup();
  const action = (e.parameter.action || '').toLowerCase();

  if (action === 'login') {
    if (!passwordOk(e.parameter.password)) return json({ ok: false, error: 'Unauthorized' });
    return json({ ok: true });
  }

  if (action === 'settings') {
    return json(Object.assign({ ok: true }, readSettings()));
  }

  if (action === 'orders') {
    if (!passwordOk(e.parameter.password)) return json({ ok: false, error: 'Unauthorized' });
    const o = book().getSheetByName('Orders');
    const rows = o.getDataRange().getValues();
    return json({
      ok: true,
      orders: rows.slice(1).filter(function (r) { return String(r[0] || '').trim(); }).map(function (r) {
        return {
          id: String(r[0]),
          date: r[1] instanceof Date ? r[1].toISOString() : String(r[1] || ''),
          name: String(r[2] || ''),
          phone: String(r[3] || ''),
          address: String(r[4] || ''),
          items: String(r[5] || '[]'),
          total: Number(r[6] || 0),
          note: String(r[7] || ''),
          status: String(r[8] || 'New')
        };
      })
    });
  }

  if (action === 'lookup') {
    const phone = String(e.parameter.phone || '').replace(/\D/g, '').slice(-10);
    const o = book().getSheetByName('Orders');
    const rows = o.getDataRange().getValues();
    return json({
      ok: true,
      orders: rows.slice(1).filter(function (r) {
        return String(r[3] || '').replace(/\D/g, '').slice(-10) === phone;
      }).map(function (r) {
        return {
          id: String(r[0]),
          date: r[1] instanceof Date ? r[1].toISOString() : String(r[1] || ''),
          name: String(r[2] || ''),
          phone: String(r[3] || ''),
          address: String(r[4] || ''),
          items: String(r[5] || '[]'),
          total: Number(r[6] || 0),
          note: String(r[7] || ''),
          status: String(r[8] || 'New')
        };
      })
    });
  }

  if (action === 'products') {
    const p = book().getSheetByName('Products');
    const v = p.getDataRange().getValues();
    return json({
      ok: true,
      products: v.slice(1).filter(function (r) { return String(r[1] || '').trim(); }).map(productFromRow)
    });
  }

  if (action === 'reviews') {
    const s = book().getSheetByName('Reviews');
    const v = s.getDataRange().getValues();
    return json({
      ok: true,
      reviews: v.slice(1).filter(function (r) { return String(r[0] || '').trim(); }).map(function (r) {
        return {
          id: String(r[0]),
          name: String(r[2] || ''),
          city: String(r[3] || ''),
          outfit: String(r[4] || ''),
          rating: Number(r[5] || 5),
          comment: String(r[6] || ''),
          media_url: String(r[7] || ''),
          is_video: Number(r[8] || 0)
        };
      })
    });
  }

  return json({
    ok: true,
    brand: 'Rakesh Cloth Stores',
    tagline: 'Quality Matters',
    whatsapp: '+91 99857 28175',
    message: 'Rakesh Cloth Stores backend ready'
  });
}

function doPost(e) {
  setup();
  try {
    const action = (e.parameter.action || '').toLowerCase();
    const payload = JSON.parse(e.parameter.payload || '{}');
    const ss = book();
    const tz = Session.getScriptTimeZone() || 'Asia/Kolkata';

    if (action === 'order') {
      const orderId = 'RKS-' + Utilities.formatDate(new Date(), tz, 'yyyyMMdd-HHmmss');
      ss.getSheetByName('Orders').appendRow([
        orderId,
        new Date(),
        payload.customer && payload.customer.name || '',
        payload.customer && payload.customer.phone || '',
        payload.customer && payload.customer.address || '',
        JSON.stringify(payload.items || []),
        Number(payload.total || 0),
        payload.customer && payload.customer.note || '',
        'New'
      ]);
      rememberCustomer(ss, payload.customer);
      return json({ ok: true, order_id: orderId });
    }

    if (action === 'addproduct') {
      if (!passwordOk(payload.password)) return json({ ok: false, error: 'Unauthorized' });
      ss.getSheetByName('Products').appendRow([
        payload.id || ('RKS-' + Date.now()),
        payload.name || '',
        payload.category || payload.cat || 'sarees',
        payload.price == null ? '' : payload.price,
        payload.stock == null ? 1 : payload.stock,
        payload.badge || '',
        payload.fabric || '',
        payload.image_url || payload.img || '',
        payload.description || payload.desc || '',
        payload.available || 'YES'
      ]);
      return json({ ok: true });
    }

    if (action === 'updateproduct') {
      if (!passwordOk(payload.password)) return json({ ok: false, error: 'Unauthorized' });
      const products = ss.getSheetByName('Products');
      const rows = products.getDataRange().getValues();
      for (var u = 1; u < rows.length; u++) {
        if (String(rows[u][0]) === String(payload.id || '')) {
          if (payload.name != null) products.getRange(u + 1, 2).setValue(payload.name);
          if (payload.category != null || payload.cat != null) products.getRange(u + 1, 3).setValue(payload.category || payload.cat);
          if (payload.price != null) products.getRange(u + 1, 4).setValue(payload.price);
          if (payload.stock != null) products.getRange(u + 1, 5).setValue(payload.stock);
          if (payload.badge != null) products.getRange(u + 1, 6).setValue(payload.badge);
          if (payload.fabric != null) products.getRange(u + 1, 7).setValue(payload.fabric);
          if (payload.image_url != null || payload.img != null) products.getRange(u + 1, 8).setValue(payload.image_url || payload.img);
          if (payload.description != null || payload.desc != null) products.getRange(u + 1, 9).setValue(payload.description || payload.desc);
          if (payload.available != null) products.getRange(u + 1, 10).setValue(payload.available);
          return json({ ok: true });
        }
      }
      return json({ ok: false, error: 'Product not found' });
    }

    if (action === 'status') {
      if (!passwordOk(payload.password)) return json({ ok: false, error: 'Unauthorized' });
      const orders = ss.getSheetByName('Orders');
      const rows = orders.getDataRange().getValues();
      for (var s = 1; s < rows.length; s++) {
        if (String(rows[s][0]) === String(payload.orderId || '')) {
          orders.getRange(s + 1, 9).setValue(payload.status || 'New');
          return json({ ok: true });
        }
      }
      return json({ ok: false, error: 'Order not found' });
    }

    if (action === 'deleteorder') {
      if (!passwordOk(payload.password)) return json({ ok: false, error: 'Unauthorized' });
      const orders = ss.getSheetByName('Orders');
      const rows = orders.getDataRange().getValues();
      for (var d = rows.length - 1; d >= 1; d--) {
        if (String(rows[d][0]) === String(payload.orderId || '')) orders.deleteRow(d + 1);
      }
      return json({ ok: true });
    }

    if (action === 'shop') {
      if (!passwordOk(payload.password)) return json({ ok: false, error: 'Unauthorized' });
      const settings = ss.getSheetByName('Settings');
      if (Array.isArray(payload.addresses)) setSetting(settings, 'SHOP_ADDRESSES', JSON.stringify(payload.addresses));
      if (payload.email != null) setSetting(settings, 'CONTACT_EMAIL', String(payload.email || '').trim());
      if (payload.instagram != null) setSetting(settings, 'INSTAGRAM', String(payload.instagram || '').trim());
      if (payload.facebook != null) setSetting(settings, 'FACEBOOK', String(payload.facebook || '').trim());
      if (payload.youtube != null) setSetting(settings, 'YOUTUBE', String(payload.youtube || '').trim());
      if (payload.maps != null) setSetting(settings, 'MAPS', String(payload.maps || '').trim());
      if (payload.hours != null) setSetting(settings, 'HOURS', String(payload.hours || '').trim());
      if (payload.logo != null) setSetting(settings, 'LOGO', String(payload.logo || '').trim());
      if (Array.isArray(payload.hero)) setSetting(settings, 'HERO_SLIDES', JSON.stringify(payload.hero));
      if (Array.isArray(payload.categories)) setSetting(settings, 'CATEGORIES_JSON', JSON.stringify(payload.categories));
      return json({ ok: true });
    }

    if (action === 'password') {
      if (!passwordOk(payload.password)) return json({ ok: false, error: 'Unauthorized' });
      setSetting(ss.getSheetByName('Settings'), 'ADMIN_PASSWORD', payload.newPassword || '');
      return json({ ok: true });
    }

    if (action === 'whatsapp') {
      if (!passwordOk(payload.password)) return json({ ok: false, error: 'Unauthorized' });
      const phone = String(payload.whatsapp || '').replace(/\D/g, '');
      setSetting(ss.getSheetByName('Settings'), 'WHATSAPP', phone);
      return json({ ok: true, whatsapp: phone });
    }

    if (action === 'enquiry') {
      const enquiryId = 'ENQ-' + Utilities.formatDate(new Date(), tz, 'yyyyMMdd-HHmmss');
      ss.getSheetByName('Enquiries').appendRow([
        enquiryId,
        new Date(),
        payload.name || '',
        payload.phone || '',
        payload.message || '',
        'New'
      ]);
      return json({ ok: true, enquiry_id: enquiryId });
    }

    if (action === 'review') {
      const reviewId = payload.id || ('RV-' + Utilities.formatDate(new Date(), tz, 'yyyyMMdd-HHmmss'));
      ss.getSheetByName('Reviews').appendRow([
        reviewId,
        new Date(),
        payload.name || '',
        payload.city || '',
        payload.outfit || '',
        Number(payload.rating || 5),
        payload.comment || '',
        payload.media_url || '',
        payload.is_video ? 1 : 0,
        'New'
      ]);
      return json({ ok: true, review_id: reviewId });
    }

    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function onOpen() {
  setup();
}
