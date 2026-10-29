import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CATALOG, HERO_SLIDES, REVIEWS } from '../data/catalog';
import { BRAND, CATEGORIES, PRICE_TIERS, SHOP_ADDRESS, formatWhatsapp, waLink } from '../data/brand';
import { checkPassword, fetchOrders, fetchProducts, fetchSettings, postAction, uploadImage } from '../lib/sheets';
import { fetchLiveCatalog, hideLiveProduct, saveLivePassword, saveLiveProduct, uploadLivePhoto } from '../lib/live';
import { orderStamp } from '../lib/format';
import { processPhoto } from '../lib/image';

const StoreContext = createContext(null);

const K = {
  cart: 'rks_cart_v5',
  orders: 'rks_orders_v5',
  custom: 'rks_custom_products_v5',
  hidden: 'rks_hidden_v5',
  hash: 'rks_admin_hash_v5',
  script: 'rks_script_url_v5',
  reviews: 'rks_reviews_v5',
  whatsapp: 'rks_whatsapp_v5',
  addresses: 'rks_addresses_v5',
  social: 'rks_social_v5',
  email: 'rks_email_v5',
  hours: 'rks_hours_v5',
  logo: 'rks_logo_v5',
  maps: 'rks_maps_v5',
  hero: 'rks_hero_v5',
  categories: 'rks_categories_v5',
};

const MAX_DISTINCT = 5;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function openExternalUrl(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function sheetImage(src) {
  if (!src) return '';
  if (/^https?:/i.test(src) || src.startsWith('/') || src.startsWith('data:')) return src;
  return `/${String(src).replace(/^\.?\//, '')}`;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function categorySlug(value) {
  const raw = String(value || '').trim();
  const match = CATEGORIES.find(
    (c) => c.id === raw || c.slug === raw || c.title.toLowerCase() === raw.toLowerCase() || c.short.toLowerCase() === raw.toLowerCase()
  );
  return match?.slug || slugify(raw) || 'sarees';
}

function normalizeProduct(p, local) {
  const image = sheetImage(p.image_url || p.img) || local?.image_url || BRAND.logo;
  const stock = p.stock == null || p.stock === '' ? (local?.stock ?? 1) : Number(p.stock);
  return {
    id: p.id || local?.id || `RKS-${Date.now()}`,
    name: p.name || local?.name || 'Boutique piece',
    category: categorySlug(p.category || p.cat || local?.category),
    price: p.price === '' || p.price == null || Number.isNaN(Number(p.price)) ? Number(local?.price || 0) : Number(p.price),
    stock: Number.isNaN(stock) ? 1 : stock,
    badge: p.badge || local?.badge || '',
    fabric: p.fabric || local?.fabric || '',
    description: p.description || p.desc || local?.description || 'Premium ethnic wear from Rakesh Cloth Stores, Kurmannapalem.',
    image_url: image,
    img: image,
    images: Array.isArray(p.images) && p.images.length ? p.images : [image],
    available: String(p.available || 'YES').toUpperCase() === 'NO' ? 'NO' : 'YES',
    active: String(p.available || 'YES').toUpperCase() === 'NO' ? 0 : 1,
  };
}

function normalizeOrder(order) {
  let items = order.items || [];
  if (typeof items === 'string') {
    try { items = JSON.parse(items || '[]'); } catch { items = []; }
  }
  const status = order.status || order.order_status || 'New';
  const id = order.id || order.order_number || orderStamp();
  const name = order.name || order.customer_name || '';
  const phone = String(order.phone || order.mobile || '').replace(/\D/g, '');
  const address = order.address || '';
  return {
    ...order,
    id,
    order_number: order.order_number || id,
    bill_no: order.bill_no || id,
    date: order.date || order.created_at || new Date().toISOString(),
    created_at: order.created_at || order.date || new Date().toISOString(),
    name,
    customer_name: name,
    phone,
    mobile: phone.slice(-10),
    address,
    city: order.city || '',
    pincode: order.pincode || '',
    note: order.note || order.notes || '',
    notes: order.notes || order.note || '',
    payment_method: order.payment_method || order.paymentMethod || '',
    items,
    total: Number(order.total ?? order.total_amount ?? 0),
    total_amount: Number(order.total_amount ?? order.total ?? 0),
    status,
    order_status: status,
  };
}

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = read(K.cart, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [custom, setCustom] = useState(() => read(K.custom, []));
  const [hidden, setHidden] = useState(() => read(K.hidden, []));
  const [orders, setOrders] = useState(() => read(K.orders, []).map(normalizeOrder));
  const [localReviews, setLocalReviews] = useState(() => {
    const saved = read(K.reviews, []);
    return saved.length ? saved : REVIEWS;
  });
  const [scriptUrl, setScriptUrlState] = useState(() => localStorage.getItem(K.script) || BRAND.scriptUrl);
  const [whatsapp, setWhatsappState] = useState(() => localStorage.getItem(K.whatsapp) || BRAND.whatsapp);
  const [addresses, setAddresses] = useState(() => {
    const saved = read(K.addresses, []);
    return saved.length ? saved : [SHOP_ADDRESS];
  });
  const [social, setSocial] = useState(() => read(K.social, {
    instagram: BRAND.instagram,
    facebook: BRAND.facebook,
    youtube: BRAND.youtube,
    maps: BRAND.maps,
  }));
  const [email, setEmail] = useState(() => localStorage.getItem(K.email) || BRAND.email);
  const [hours, setHours] = useState(() => localStorage.getItem(K.hours) || BRAND.hours);
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem(K.logo) || BRAND.logo);
  const [heroSlides, setHeroSlides] = useState(() => {
    const saved = read(K.hero, []);
    return saved.length ? saved : HERO_SLIDES;
  });
  const [categoryRows, setCategoryRows] = useState(() => {
    const saved = read(K.categories, []);
    return saved.length ? saved : CATEGORIES;
  });
  const [sheetProducts, setSheetProducts] = useState(null);
  const [liveProducts, setLiveProducts] = useState([]);
  const [sheetNote, setSheetNote] = useState('');
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('rks_admin_session_v5') === 'yes');
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [modals, setModals] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePriceTier, setActivePriceTier] = useState('all');
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [toast, setToast] = useState('');

  useEffect(() => { localStorage.setItem(K.cart, JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    try { localStorage.setItem(K.custom, JSON.stringify(custom)); } catch { /* photo quota */ }
  }, [custom]);
  useEffect(() => { localStorage.setItem(K.hidden, JSON.stringify(hidden)); }, [hidden]);
  useEffect(() => { localStorage.setItem(K.orders, JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem(K.reviews, JSON.stringify(localReviews)); }, [localReviews]);
  useEffect(() => { localStorage.setItem(K.hero, JSON.stringify(heroSlides)); }, [heroSlides]);
  useEffect(() => { localStorage.setItem(K.categories, JSON.stringify(categoryRows)); }, [categoryRows]);

  const phone = formatWhatsapp(whatsapp);

  const persistCart = useCallback((next) => setCart(next), []);
  const openModal = useCallback((id) => setModals((m) => ({ ...m, [id]: true })), []);
  const closeModal = useCallback((id) => setModals((m) => ({ ...m, [id]: false })), []);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(''), 2600);
  };

  useEffect(() => {
    if (!scriptUrl) return undefined;
    let cancel = false;
    fetchSettings(scriptUrl)
      .then((data) => {
        if (cancel || !data?.ok) return;
        if (data.whatsapp) {
          const next = formatWhatsapp(data.whatsapp);
          localStorage.setItem(K.whatsapp, next.whatsapp);
          setWhatsappState(next.whatsapp);
        }
        if (Array.isArray(data.addresses) && data.addresses.length) {
          localStorage.setItem(K.addresses, JSON.stringify(data.addresses));
          setAddresses(data.addresses);
        }
        const nextSocial = {
          instagram: data.instagram ?? BRAND.instagram,
          facebook: data.facebook ?? '',
          youtube: data.youtube ?? BRAND.youtube,
          maps: data.maps ?? BRAND.maps,
        };
        localStorage.setItem(K.social, JSON.stringify(nextSocial));
        setSocial(nextSocial);
        if (data.email != null) {
          localStorage.setItem(K.email, data.email);
          setEmail(data.email);
        }
        if (data.hours) {
          localStorage.setItem(K.hours, data.hours);
          setHours(data.hours);
        }
        if (data.logo) {
          localStorage.setItem(K.logo, data.logo);
          setLogoUrl(data.logo);
        }
        if (Array.isArray(data.hero) && data.hero.length) setHeroSlides(data.hero);
        if (Array.isArray(data.categories) && data.categories.length) setCategoryRows(data.categories);
      })
      .catch(() => {});
    return () => { cancel = true; };
  }, [scriptUrl]);

  const allProducts = useMemo(() => {
    const map = new Map();
    const add = (list) => {
      (list || []).forEach((raw) => {
        const prev = map.get(raw.id);
        const p = normalizeProduct(raw, prev);
        map.set(p.id, p);
      });
    };
    add(CATALOG);
    add(sheetProducts);
    add(liveProducts);
    add(custom);
    const catalogIds = new Set(CATALOG.map((p) => p.id));
    return [...map.values()].sort((a, b) => Number(catalogIds.has(a.id)) - Number(catalogIds.has(b.id)));
  }, [sheetProducts, liveProducts, custom]);

  const products = useMemo(
    () => allProducts.filter((p) => !hidden.includes(p.id) && p.available !== 'NO' && p.stock > 0),
    [allProducts, hidden]
  );

  const storefrontProducts = useMemo(
    () => allProducts.filter((p) => !hidden.includes(p.id) && p.available !== 'NO'),
    [allProducts, hidden]
  );

  useEffect(() => {
    let cancel = false;
    fetchLiveCatalog()
      .then((data) => {
        if (cancel || !data?.ok || !Array.isArray(data.products)) return;
        setLiveProducts(data.products.map((p) => normalizeProduct(p)));
        if (data.products.length) setSheetNote('Catalogue is live on every phone.');
      })
      .catch(() => {});
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    if (!scriptUrl) {
      setSheetProducts(null);
      return undefined;
    }
    let cancel = false;
    setSheetNote('Reading products from Google Sheet…');
    fetchProducts(scriptUrl)
      .then((data) => {
        if (cancel) return;
        if (data?.ok && Array.isArray(data.products) && data.products.length) {
          setSheetProducts(data.products.map((p) => normalizeProduct(p, CATALOG.find((c) => c.id === p.id || c.name.toLowerCase() === String(p.name || '').toLowerCase()))));
          setSheetNote('Prices and items are live from your Google Sheet.');
        } else {
          setSheetProducts(null);
          setSheetNote('Sheet connected, but the Products tab is empty. The website catalogue is showing.');
        }
      })
      .catch(() => {
        if (cancel) return;
        setSheetProducts(null);
        setSheetNote('Could not reach Google Sheet. The website catalogue is showing.');
      });
    return () => { cancel = true; };
  }, [scriptUrl]);

  const priceTiers = PRICE_TIERS;
  const filteredProducts = useMemo(() => {
    const tier = priceTiers.find((t) => t.id === activePriceTier) || PRICE_TIERS[0];
    return storefrontProducts.filter((p) => {
      const catOk = activeCategory === 'all' || p.category === activeCategory;
      const priceOk = p.price >= Number(tier.min) && p.price <= Number(tier.max);
      return catOk && priceOk;
    });
  }, [storefrontProducts, activeCategory, activePriceTier, priceTiers]);

  const filterStatusText = useMemo(() => {
    const cat = activeCategory === 'all' ? 'All collections' : activeCategory;
    const tier = priceTiers.find((t) => t.id === activePriceTier);
    return `Showing ${filteredProducts.length} pieces • ${cat} • ${tier?.title || 'All prices'}`;
  }, [filteredProducts.length, activeCategory, activePriceTier, priceTiers]);

  const cartCount = cart.reduce((s, i) => s + Number(i.qty || 0), 0);
  const cartTotal = cart.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0);

  const storeSettings = useMemo(() => ({
    whatsapp_number: phone.whatsapp,
    logo_url: logoUrl || BRAND.logo,
    instagram_url: social.instagram,
    youtube_url: social.youtube,
    facebook_url: social.facebook,
    maps_url: social.maps || BRAND.maps,
    shop_hours: hours,
    email,
  }), [phone.whatsapp, logoUrl, social, hours, email]);

  const productById = (id) => allProducts.find((p) => p.id === id) || CATALOG.find((p) => p.id === id);

  const addToCartDirect = useCallback((productId) => {
    const p = productById(productId);
    if (!p || p.stock < 1) return;
    const existing = cart.find((x) => x.id === productId);
    if (!existing && cart.length >= MAX_DISTINCT) {
      alert('Maximum 5 different products can be added to the bag.');
      return;
    }
    if (existing && existing.qty >= p.stock) {
      alert('No more stock available for this piece.');
      return;
    }
    const next = existing
      ? cart.map((x) => (x.id === productId ? { ...x, qty: x.qty + 1 } : x))
      : [...cart, { id: p.id, name: p.name, price: p.price, qty: 1, image_url: p.image_url, img: p.image_url, category: p.category }];
    persistCart(next);
    openCart();
    showToast(`${p.name} added to your bag`);
  }, [cart, persistCart, openCart, allProducts]);

  const updateCartQty = useCallback((id, delta) => {
    const p = productById(id);
    const next = cart
      .map((x) => {
        if (x.id !== id) return x;
        const qty = x.qty + delta;
        if (p && qty > p.stock) return { ...x, qty: p.stock };
        return { ...x, qty };
      })
      .filter((x) => x.qty > 0);
    persistCart(next);
  }, [cart, persistCart, allProducts]);

  const openProductDetail = useCallback((id) => {
    setSelectedProduct(productById(id) || null);
    setGalleryIndex(0);
    openModal('productDetailModal');
  }, [openModal, allProducts]);

  const openWhatsAppInquiry = useCallback((message) => {
    openExternalUrl(waLink(message, phone.whatsapp));
  }, [phone.whatsapp]);

  const orderCartOnWhatsApp = useCallback(() => {
    if (!cart.length) return;
    const lines = ['*RAKESH CLOTH STORES — ORDER REQUEST*', '', ...cart.flatMap((p, i) => [
      `${i + 1}. ${p.name} | ₹${Number(p.price).toLocaleString('en-IN')} | Qty: ${p.qty}`,
      p.image_url ? `Photo: ${p.image_url}` : '',
    ]), '', `Total: ₹${cartTotal.toLocaleString('en-IN')}`, '', 'Please confirm availability.'];
    openExternalUrl(waLink(lines.filter(Boolean).join('\n'), phone.whatsapp));
  }, [cart, cartTotal, phone.whatsapp]);

  const placeOrderStart = useCallback(() => {
    if (!cart.length) {
      alert('Please add at least one product.');
      return;
    }
    closeCart();
  }, [cart.length, closeCart]);

  const placeOrder = async (customer) => {
    const id = orderStamp();
    const order = normalizeOrder({
      id,
      date: new Date().toISOString(),
      name: customer.name,
      phone: customer.phone || customer.mobile,
      address: [customer.address, customer.city, customer.pincode].filter(Boolean).join(', '),
      city: customer.city || '',
      pincode: customer.pincode || '',
      note: customer.note || customer.notes || '',
      payment_method: customer.paymentMethod || customer.payment_method || '',
      items: cart.map((line) => ({
        id: line.id,
        name: line.name,
        qty: line.qty,
        price: line.price,
        image_url: line.image_url,
        img: line.image_url,
        cat: line.category,
        category: line.category,
        lineTotal: Number(line.price) * Number(line.qty),
      })),
      total: cartTotal,
      status: 'New',
    });
    setOrders((prev) => [order, ...prev]);
    persistCart([]);
    setLastCreatedOrder(order);
    setViewingOrder(order);
    if (scriptUrl) {
      try {
        const data = await postAction(scriptUrl, 'order', {
          customer: {
            name: order.name,
            phone: order.phone,
            address: order.address,
            note: [order.payment_method, order.note].filter(Boolean).join(' | '),
          },
          items: order.items,
          total: order.total,
        });
        if (data?.order_id) {
          const next = { ...order, id: data.order_id, order_number: data.order_id, bill_no: data.order_id };
          setOrders((prev) => prev.map((o) => (o.id === id ? next : o)));
          setLastCreatedOrder(next);
          setViewingOrder(next);
          return next;
        }
      } catch {
        /* local copy already saved */
      }
    }
    return order;
  };

  const handleCheckoutSubmit = useCallback(async (formData) => {
    if (!cart.length) {
      alert('Please add at least one product.');
      return null;
    }
    return placeOrder({
      name: formData.name,
      phone: formData.mobile || formData.phone,
      mobile: formData.mobile || formData.phone,
      address: formData.address,
      city: formData.city,
      pincode: formData.pincode,
      paymentMethod: formData.paymentMethod,
      note: formData.notes || formData.note,
    });
  }, [cart, cartTotal, scriptUrl, persistCart]);

  const sendWhatsAppReceipt = useCallback(() => {
    const order = lastCreatedOrder || viewingOrder;
    if (!order) return;
    const itemsText = (order.items || [])
      .map((i) => `• ${i.name} × ${i.qty} — ₹${(Number(i.price) * Number(i.qty)).toLocaleString('en-IN')}`)
      .join('\n');
    const msg =
      `*RAKESH CLOTH STORES — ORDER CONFIRMATION*\n\n` +
      `Bill: ${order.bill_no || order.id}\n` +
      `Order: ${order.order_number || order.id}\n` +
      `Customer: ${order.customer_name}\n` +
      `Mobile: ${order.mobile}\n` +
      `Address: ${order.address}\n` +
      `Status: ${order.order_status}\n` +
      `Total: ₹${Number(order.total_amount).toLocaleString('en-IN')}\n\n` +
      `Items:\n${itemsText}\n\n` +
      `Please confirm my order. Thank you!`;
    openExternalUrl(waLink(msg, phone.whatsapp));
  }, [lastCreatedOrder, viewingOrder, phone.whatsapp]);

  const openWhatsAppVideoCall = useCallback((order) => {
    if (!order || String(order.order_status) !== 'Confirmed') {
      alert('WhatsApp video call opens only after the store confirms your order.');
      return;
    }
    const itemsText = (order.items || []).map((i) => `• ${i.name} × ${i.qty}`).join('\n');
    const msg =
      `Hello Rakesh Cloth Stores,\n\n` +
      `My order is confirmed. Please start a *WhatsApp video call* so I can see the product live.\n\n` +
      `Bill: ${order.bill_no || order.id}\n` +
      `Order: ${order.order_number || order.id}\n` +
      `Customer: ${order.customer_name}\n` +
      `Mobile: ${order.mobile}\n\n` +
      `Items:\n${itemsText}\n\n` +
      `Thank you.`;
    openExternalUrl(waLink(msg, phone.whatsapp));
  }, [phone.whatsapp]);

  const lookupCustomerOrders = useCallback(async (mobile) => {
    const digits = String(mobile || '').replace(/\D/g, '').slice(-10);
    if (digits.length < 10) {
      alert('Enter a 10-digit mobile number.');
      return [];
    }
    const local = orders.filter((o) => String(o.mobile || o.phone || '').replace(/\D/g, '').slice(-10) === digits);
    if (!scriptUrl) return local;
    try {
      const u = new URL(scriptUrl);
      u.searchParams.set('action', 'lookup');
      u.searchParams.set('phone', digits);
      u.searchParams.set('v', String(Date.now()));
      const data = JSON.parse(await (await fetch(u.toString())).text());
      if (data?.ok && Array.isArray(data.orders)) {
        const remote = data.orders.map(normalizeOrder);
        const byId = new Map([...local, ...remote].map((o) => [o.id, o]));
        return [...byId.values()];
      }
    } catch {
      /* local lookup is enough */
    }
    return local;
  }, [orders, scriptUrl]);

  const handleReviewSubmit = useCallback(async (payload) => {
    const row = {
      id: `rv-${Date.now()}`,
      name: payload.name,
      city: payload.city,
      outfit: payload.outfit,
      rating: payload.rating || 5,
      comment: payload.comment,
      media_url: payload.media_url || '',
      is_video: payload.is_video ? 1 : 0,
    };
    setLocalReviews((prev) => [row, ...prev]);
    if (scriptUrl) {
      try { await postAction(scriptUrl, 'review', row); } catch { /* local is enough */ }
    }
    alert('Thank you. Your look is saved.');
    closeModal('writeReviewModal');
  }, [scriptUrl, closeModal]);

  const handleReviewMediaUpload = useCallback(async (file) => {
    if (!file) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ url: e.target.result, isVideo: file.type.startsWith('video') });
      reader.readAsDataURL(file);
    });
  }, []);

  const localPasswordOk = async (password) => {
    const hash = await sha256(password);
    const saved = localStorage.getItem(K.hash);
    if (!saved) return hash === await sha256(BRAND.defaultPassword);
    return hash === saved;
  };

  const passwordMatches = async (password) => {
    if (await localPasswordOk(password)) return true;
    if (!scriptUrl) return false;
    try {
      const data = await checkPassword(scriptUrl, password);
      if (data?.ok === false && /unauthor/i.test(String(data.error || ''))) return false;
      if (data?.ok) return true;
      const sheetOrders = await fetchOrders(scriptUrl, password);
      if (sheetOrders?.ok) return true;
      if (sheetOrders && sheetOrders.ok === false) return false;
    } catch {
      /* sheet unreachable */
    }
    return false;
  };

  const login = async (password) => {
    const ok = await passwordMatches(password);
    if (!ok) return false;
    localStorage.setItem(K.hash, await sha256(password));
    sessionStorage.setItem('rks_admin_session_v5', 'yes');
    sessionStorage.setItem('rks_admin_pw', password);
    setAuthed(true);
    return true;
  };

  const logout = () => {
    sessionStorage.removeItem('rks_admin_session_v5');
    sessionStorage.removeItem('rks_admin_pw');
    setAuthed(false);
  };

  const handleAdminLogin = useCallback(async (_username, password) => {
    const ok = await login(password);
    if (!ok) {
      alert('Invalid password.');
      return false;
    }
    closeModal('adminLoginModal');
    window.location.assign('/admin');
    return true;
  }, []);

  const changePassword = async (current, next) => {
    if (!(await passwordMatches(current))) return { ok: false, error: 'Current password is incorrect.' };
    if (!next || next.length < 4) return { ok: false, error: 'Use at least 4 characters.' };
    if (scriptUrl) {
      try {
        const data = await postAction(scriptUrl, 'password', { password: current, newPassword: next });
        if (!data?.ok) return { ok: false, error: data?.error || 'Google Sheet did not accept the new password.' };
      } catch {
        return { ok: false, error: 'Google Sheet could not be reached, so the password was not changed.' };
      }
    }
    localStorage.setItem(K.hash, await sha256(next));
    sessionStorage.setItem('rks_admin_pw', next);
    try { await saveLivePassword(current, next); } catch { /* local password still works on this phone */ }
    return { ok: true };
  };

  const setScriptUrl = (url) => {
    const clean = url.trim();
    localStorage.setItem(K.script, clean);
    setScriptUrlState(clean);
  };

  const syncOrders = async () => {
    if (!scriptUrl) return { ok: false, error: 'Paste the Google Apps Script URL in Settings first.' };
    const password = sessionStorage.getItem('rks_admin_pw') || '';
    const data = await fetchOrders(scriptUrl, password);
    if (!data?.ok) return { ok: false, error: data?.error || 'Sheet refused the request.' };
    const incoming = (data.orders || []).map(normalizeOrder).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    setOrders(incoming);
    return { ok: true, count: incoming.length };
  };

  const updateStatus = async (orderId, status) => {
    const previous = orders.find((o) => o.id === orderId)?.status || 'New';
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status, order_status: status } : o)));
    if (viewingOrder?.id === orderId) setViewingOrder((o) => ({ ...o, status, order_status: status }));
    if (!scriptUrl) return { ok: true };
    const password = sessionStorage.getItem('rks_admin_pw') || '';
    try {
      const data = await postAction(scriptUrl, 'status', { password, orderId, status });
      if (!data?.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: previous, order_status: previous } : o)));
        return { ok: false, error: data?.error || 'Could not save the status.' };
      }
    } catch {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: previous, order_status: previous } : o)));
      return { ok: false, error: 'Could not reach Google Sheet.' };
    }
    return { ok: true };
  };

  const confirmOrder = useCallback(async (id) => updateStatus(id, 'Confirmed'), [orders, scriptUrl, viewingOrder]);
  const finishDelivery = useCallback(async (id) => updateStatus(id, 'Delivered'), [orders, scriptUrl]);

  const deleteOrder = async (orderId) => {
    if (!scriptUrl) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      return { ok: true };
    }
    const password = sessionStorage.getItem('rks_admin_pw') || '';
    try {
      const data = await postAction(scriptUrl, 'deleteorder', { password, orderId });
      if (!data?.ok) return { ok: false, error: data?.error || 'Could not delete that order.' };
    } catch {
      return { ok: false, error: 'Could not reach Google Sheet.' };
    }
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    return { ok: true };
  };

  const saveShop = async (patch) => {
    if (Array.isArray(patch.addresses)) {
      localStorage.setItem(K.addresses, JSON.stringify(patch.addresses));
      setAddresses(patch.addresses);
    }
    if (patch.email != null) {
      localStorage.setItem(K.email, patch.email);
      setEmail(patch.email);
    }
    if (patch.hours != null) {
      localStorage.setItem(K.hours, patch.hours);
      setHours(patch.hours);
    }
    if (patch.logo != null) {
      localStorage.setItem(K.logo, patch.logo);
      setLogoUrl(patch.logo);
    }
    if (patch.instagram != null || patch.facebook != null || patch.youtube != null || patch.maps != null) {
      const next = {
        instagram: patch.instagram ?? social.instagram,
        facebook: patch.facebook ?? social.facebook,
        youtube: patch.youtube ?? social.youtube,
        maps: patch.maps ?? social.maps,
      };
      localStorage.setItem(K.social, JSON.stringify(next));
      setSocial(next);
    }
    if (Array.isArray(patch.hero)) setHeroSlides(patch.hero);
    if (Array.isArray(patch.categories)) setCategoryRows(patch.categories);
    if (!scriptUrl) {
      return { ok: true, warning: 'Saved on this browser. Connect the Google Sheet so every visitor sees it.' };
    }
    const password = sessionStorage.getItem('rks_admin_pw') || '';
    try {
      const data = await postAction(scriptUrl, 'shop', { password, ...patch });
      if (!data?.ok) return { ok: true, warning: data?.error || 'Saved locally. Google Sheet did not accept the change.' };
    } catch {
      return { ok: true, warning: 'Saved on this website. Google Sheet could not be updated.' };
    }
    return { ok: true };
  };

  const applyLiveProducts = (data) => {
    if (data?.ok && Array.isArray(data.products)) {
      setLiveProducts(data.products.map((p) => normalizeProduct(p)));
    }
  };

  const saveProductPhoto = async (file) => {
    if (!file) return { ok: false, error: 'Choose a photo first.' };
    let processed;
    try {
      processed = await processPhoto(file);
    } catch (err) {
      return { ok: false, error: err?.message || 'This photo could not be used.' };
    }
    const password = sessionStorage.getItem('rks_admin_pw') || '';
    const base64 = processed.dataUrl.split(',')[1] || '';
    try {
      const live = await uploadLivePhoto(password, {
        name: processed.name,
        mime: processed.mime,
        data: base64,
      });
      if (live?.ok && live.url) return { ok: true, url: live.url };
    } catch {
      /* try Google Drive next */
    }
    if (scriptUrl) {
      try {
        const data = await uploadImage(scriptUrl, {
          password,
          name: processed.name,
          mime: processed.mime,
          data: base64,
        });
        if (data?.ok && data.url) return { ok: true, url: data.url };
      } catch {
        /* fall through */
      }
    }
    return { ok: false, error: 'The photo could not be saved for every phone. Check the internet and try again.' };
  };

  const addProduct = async (draft) => {
    const name = String(draft.name || '').trim();
    if (!name) return { ok: false, error: 'Item name is required.' };
    if (allProducts.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: 'That item is already on the website.' };
    }
    const product = normalizeProduct({
      id: draft.id || `RKS-${Date.now()}`,
      name,
      category: draft.category || draft.cat || 'sarees',
      price: draft.price === '' || draft.price == null ? 0 : Number(draft.price),
      stock: draft.stock === '' || draft.stock == null ? 1 : Number(draft.stock),
      badge: draft.badge || 'NEW',
      fabric: draft.fabric || '',
      img: (draft.img || draft.image_url || '').trim() || BRAND.logo,
      desc: (draft.desc || draft.description || '').trim(),
      available: 'YES',
    });
    if (String(product.image_url || '').startsWith('data:')) {
      return { ok: false, error: 'Save the photo with Take photo or Gallery first so every phone can see it.' };
    }
    setCustom((prev) => [product, ...prev]);
    const password = sessionStorage.getItem('rks_admin_pw') || '';
    try {
      const live = await saveLiveProduct(password, product);
      if (!live?.ok) {
        return { ok: false, error: live?.error || 'Could not publish this piece to the live website.' };
      }
      applyLiveProducts(live);
    } catch {
      return { ok: false, error: 'Could not publish this piece to the live website. Try again.' };
    }
    if (scriptUrl) {
      try {
        await postAction(scriptUrl, 'addproduct', {
          password,
          ...product,
          cat: product.category,
          img: product.image_url,
          image_url: product.image_url,
          desc: product.description,
        });
      } catch {
        /* live site already has the item */
      }
    }
    return { ok: true, product };
  };

  const updateProduct = async (id, patch) => {
    const current = productById(id);
    const apply = (p) => (p.id === id ? normalizeProduct({ ...p, ...patch }) : p);
    setCustom((prev) => prev.map(apply));
    setSheetProducts((prev) => (prev ? prev.map(apply) : prev));
    setLiveProducts((prev) => prev.map(apply));
    const next = normalizeProduct({ ...(current || {}), ...patch, id });
    const password = sessionStorage.getItem('rks_admin_pw') || '';
    try {
      const live = await saveLiveProduct(password, next);
      if (live?.ok) applyLiveProducts(live);
      else return { ok: false, error: live?.error || 'Could not update the live website.' };
    } catch {
      return { ok: false, error: 'Could not update the live website. Try again.' };
    }
    if (scriptUrl) {
      try { await postAction(scriptUrl, 'updateproduct', { password, id, ...patch }); } catch { /* live site already updated */ }
    }
    return { ok: true };
  };

  const deleteProduct = async (id) => {
    setHidden((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setCustom((prev) => prev.filter((p) => p.id !== id));
    const password = sessionStorage.getItem('rks_admin_pw') || '';
    try {
      const live = await hideLiveProduct(password, id);
      if (live?.ok) applyLiveProducts(live);
    } catch {
      /* still hidden on this phone */
    }
    if (scriptUrl) {
      try { await postAction(scriptUrl, 'updateproduct', { password, id, available: 'NO' }); } catch { /* local hide */ }
    }
    return { ok: true };
  };

  const restockProduct = async (id, add) => {
    const p = productById(id);
    if (!p) return { ok: false, error: 'Product not found.' };
    return updateProduct(id, { stock: Number(p.stock || 0) + Number(add || 0) });
  };

  const setWhatsapp = async (input) => {
    const next = formatWhatsapp(input);
    if (next.whatsapp.length < 12) return { ok: false, error: 'Enter a valid 10-digit mobile number.' };
    localStorage.setItem(K.whatsapp, next.whatsapp);
    setWhatsappState(next.whatsapp);
    if (!scriptUrl) {
      return { ok: true, warning: 'WhatsApp updated on this browser. Connect the Google Sheet so every visitor sees it.' };
    }
    try {
      const password = sessionStorage.getItem('rks_admin_pw') || '';
      const data = await postAction(scriptUrl, 'whatsapp', { password, whatsapp: next.whatsapp });
      if (data && data.ok === false) return { ok: true, warning: 'Updated on this website. Google Sheet rejected the change: ' + (data.error || 'unknown') };
    } catch {
      return { ok: true, warning: 'Updated on this website. Google Sheet could not be updated.' };
    }
    return { ok: true };
  };

  const saveEnquiry = async (enquiry) => {
    if (scriptUrl) {
      try { await postAction(scriptUrl, 'enquiry', enquiry); } catch { /* ignore */ }
    }
    return { ok: true };
  };

  const value = {
    products: storefrontProducts,
    allProducts,
    categories: categoryRows,
    heroSlides,
    reviews: localReviews,
    storeSettings,
    cart,
    cartOpen,
    cartCount,
    cartTotal,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    modals,
    openModal,
    closeModal,
    selectedProduct,
    galleryIndex,
    setGalleryIndex,
    lastCreatedOrder,
    viewingOrder,
    setViewingOrder,
    activeCategory,
    activePriceTier,
    priceTiers,
    filteredProducts,
    filterStatusText,
    filterCategory: (cat) => setActiveCategory(cat || 'all'),
    setPriceTier: setActivePriceTier,
    setActiveCategory,
    resetFilters: () => {
      setActiveCategory('all');
      setActivePriceTier('all');
    },
    openCart,
    closeCart,
    setCartOpen,
    addToCartDirect,
    updateCartQty,
    openProductDetail,
    openWhatsAppInquiry,
    orderCartOnWhatsApp,
    placeOrderStart,
    placeOrder,
    handleCheckoutSubmit,
    sendWhatsAppReceipt,
    openWhatsAppVideoCall,
    lookupCustomerOrders,
    handleReviewSubmit,
    handleReviewMediaUpload,
    handleAdminLogin,
    logoutAdmin: logout,
    adminOrders: orders,
    orders,
    fetchAdminOrders: syncOrders,
    confirmOrder,
    finishDelivery,
    saveProduct: async (payload) => (payload.id ? updateProduct(payload.id, payload) : addProduct(payload)),
    restockProduct,
    deleteProduct,
    addProduct,
    updateProduct,
    editingHeroSlide: null,
    setEditingHeroSlide: () => {},
    handleHeroSlideSave: async (payload) => {
      const next = payload.editId
        ? heroSlides.map((s) => (s.id === payload.editId ? { ...s, ...payload } : s))
        : [{ id: `h-${Date.now()}`, image_url: payload.image_url, label: payload.label, link: payload.link || '/shop' }, ...heroSlides];
      setHeroSlides(next);
      await saveShop({ hero: next });
    },
    deleteHeroSlide: async (id) => {
      const next = heroSlides.filter((s) => s.id !== id);
      setHeroSlides(next);
      await saveShop({ hero: next });
    },
    editingProduct: null,
    setEditingProduct: () => {},
    saveSettings: async (payload) => {
      if (payload.whatsapp_number) await setWhatsapp(payload.whatsapp_number);
      return saveShop({
        hours: payload.shop_hours,
        logo: payload.logo_url,
        instagram: payload.instagram_url,
        youtube: payload.youtube_url,
        maps: payload.maps_url,
      });
    },
    saveCategory: async (payload) => {
      const row = {
        id: payload.id || payload.slug || slugify(payload.title),
        slug: payload.slug || slugify(payload.title),
        title: payload.title,
        short: payload.short || payload.title,
        cta: payload.cta || 'SHOP →',
        image_url: payload.image_url,
      };
      const next = payload.id
        ? categoryRows.map((c) => (c.id === payload.id ? { ...c, ...row } : c))
        : [...categoryRows, row];
      setCategoryRows(next);
      return saveShop({ categories: next });
    },
    deleteCategory: async (id) => {
      const next = categoryRows.filter((c) => c.id !== id);
      setCategoryRows(next);
      return saveShop({ categories: next });
    },
    fetchCategories: async () => {},
    fetchProducts: async () => {},
    fetchHero: async () => {},
    fetchReviews: async () => {},
    uploadFile: saveProductPhoto,
    saveProductPhoto,
    activeReviewIndex,
    triggerStackNext: () => setActiveReviewIndex((prev) => (localReviews.length ? (prev + 1) % localReviews.length : 0)),
    isAdmin: authed,
    authed,
    login,
    logout,
    changePassword,
    passwordMatches,
    scriptUrl,
    setScriptUrl,
    sheetNote,
    toast,
    showToast,
    whatsapp: phone.whatsapp,
    whatsappDisplay: phone.whatsappDisplay,
    setWhatsapp,
    addresses,
    social,
    email,
    hours,
    saveShop,
    saveEnquiry,
    syncOrders,
    updateStatus,
    deleteOrder,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
