import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  ALL_PRICE_TIER,
  clearAdminToken,
  getAdminToken,
  parsePriceTiers,
  setAdminToken,
  uploadFile,
} from '../api/client';

const StoreContext = createContext(null);
const CART_KEY = 'rks_cart_v4';
const MAX_DISTINCT = 5;

const DEFAULT_SETTINGS = {
  whatsapp_number: '919985728175',
  logo_url: '/logo.png',
  instagram_url: 'https://www.instagram.com/rakesh_mahanthy/',
  youtube_url: 'https://youtube.com/@rakeshclothstores',
  maps_url: 'https://share.google/8JlpdC0pL8h30meut',
  shop_hours: '10:00 AM – 8:30 PM',
};

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [storeSettings, setStoreSettings] = useState(DEFAULT_SETTINGS);
  const [cart, setCart] = useState(loadCart);
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
  const [adminOrders, setAdminOrders] = useState([]);
  const [editingHeroSlide, setEditingHeroSlide] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const persistCart = useCallback((next) => {
    setCart(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  }, []);

  const openModal = useCallback((id) => setModals((m) => ({ ...m, [id]: true })), []);
  const closeModal = useCallback((id) => setModals((m) => ({ ...m, [id]: false })), []);

  const fetchProducts = useCallback(async () => {
    const data = await apiGet('/api/products');
    if (data.success) setProducts(data.products || []);
  }, []);
  const fetchCategories = useCallback(async () => {
    const data = await apiGet('/api/categories');
    if (data.success) setCategories(data.categories || []);
  }, []);
  const fetchHero = useCallback(async () => {
    const data = await apiGet('/api/hero-slides');
    if (data.success) setHeroSlides(data.slides || []);
  }, []);
  const fetchReviews = useCallback(async () => {
    const data = await apiGet('/api/reviews');
    if (data.success) setReviews(data.reviews || []);
  }, []);
  const fetchSettings = useCallback(async () => {
    const data = await apiGet('/api/settings');
    if (data.success) {
      const next = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
      next.price_tiers = parsePriceTiers(next.price_tiers);
      setStoreSettings(next);
    }
  }, []);

  const priceTiers = useMemo(
    () => [ALL_PRICE_TIER, ...parsePriceTiers(storeSettings.price_tiers)],
    [storeSettings.price_tiers]
  );
  const fetchAdminOrders = useCallback(async () => {
    const data = await apiGet('/api/admin/orders', { auth: true });
    if (data.success) setAdminOrders(data.orders || []);
  }, []);

  useEffect(() => {
    const load = () => {
      fetchProducts().catch(() => {});
      fetchCategories().catch(() => {});
      fetchHero().catch(() => {});
      fetchReviews().catch(() => {});
      fetchSettings().catch(() => {});
    };
    load();
    const retry = setTimeout(load, 800);
    return () => clearTimeout(retry);
  }, [fetchProducts, fetchCategories, fetchHero, fetchReviews, fetchSettings]);

  useEffect(() => {
    const onAdminShortcut = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'R' || e.key === 'r' || e.code === 'KeyR')) {
        e.preventDefault();
        e.stopPropagation();
        if (getAdminToken()) openModal('adminDashboardModal');
        else openModal('adminLoginModal');
      }
    };
    window.addEventListener('keydown', onAdminShortcut, true);
    return () => window.removeEventListener('keydown', onAdminShortcut, true);
  }, [openModal]);

  const filteredProducts = useMemo(() => {
    const tier = priceTiers.find((t) => t.id === activePriceTier) || ALL_PRICE_TIER;
    return products.filter((p) => {
      const catOk = activeCategory === 'all' || p.category === activeCategory;
      const priceOk = p.price >= Number(tier.min) && p.price <= Number(tier.max);
      return catOk && priceOk;
    });
  }, [products, activeCategory, activePriceTier, priceTiers]);

  const filterStatusText = useMemo(() => {
    const cat = activeCategory === 'all' ? 'All collections' : activeCategory;
    const tier = priceTiers.find((t) => t.id === activePriceTier);
    return `Showing ${filteredProducts.length} pieces • ${cat} • ${tier?.title || 'All prices'}`;
  }, [filteredProducts.length, activeCategory, activePriceTier, priceTiers]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const addToCartDirect = useCallback(
    (productId) => {
      const p = products.find((x) => x.id === productId);
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
        : [...cart, { id: p.id, name: p.name, price: p.price, qty: 1, image_url: p.image_url, img: p.image_url }];
      persistCart(next);
      openCart();
    },
    [products, cart, persistCart, openCart]
  );

  const updateCartQty = useCallback(
    (id, delta) => {
      const p = products.find((x) => x.id === id);
      const next = cart
        .map((x) => {
          if (x.id !== id) return x;
          const qty = x.qty + delta;
          if (p && qty > p.stock) return { ...x, qty: p.stock };
          return { ...x, qty };
        })
        .filter((x) => x.qty > 0);
      persistCart(next);
    },
    [cart, products, persistCart]
  );

  const openProductDetail = useCallback(
    (id) => {
      const p = products.find((x) => x.id === id);
      setSelectedProduct(p || null);
      setGalleryIndex(0);
      openModal('productDetailModal');
    },
    [products, openModal]
  );

  const openWhatsAppInquiry = useCallback(
    (message) => {
      const num = storeSettings.whatsapp_number || DEFAULT_SETTINGS.whatsapp_number;
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
    },
    [storeSettings.whatsapp_number]
  );

  const orderCartOnWhatsApp = useCallback(() => {
    if (!cart.length) return;
    const num = storeSettings.whatsapp_number || DEFAULT_SETTINGS.whatsapp_number;
    const lines = ['*RAKESH CLOTH STORES — ORDER REQUEST*', '', ...cart.flatMap((p, i) => [
      `${i + 1}. ${p.name} | ₹${p.price.toLocaleString('en-IN')} | Qty: ${p.qty}`,
      `Photo: ${window.location.origin}${p.image_url?.startsWith('http') ? '' : ''}${p.image_url}`,
    ]), '', `Total: ₹${cartTotal.toLocaleString('en-IN')}`, '', 'Please confirm availability.'];
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  }, [cart, cartTotal, storeSettings.whatsapp_number]);

  const placeOrderStart = useCallback(() => {
    if (!cart.length) {
      alert('Please add at least one product.');
      return;
    }
    orderCartOnWhatsApp();
    closeCart();
    openModal('checkoutModal');
  }, [cart.length, orderCartOnWhatsApp, closeCart, openModal]);

  const handleCheckoutSubmit = useCallback(
    async (formData) => {
      try {
        const data = await apiPost('/api/orders', {
          customer_name: formData.name,
          mobile: formData.mobile,
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          payment_method: formData.paymentMethod,
          notes: formData.notes,
          items: cart,
        });
        if (!data.success) {
          alert(data.error || 'Failed to place order.');
          return;
        }
        setLastCreatedOrder(data.order);
        setViewingOrder(data.order);
        persistCart([]);
        closeModal('checkoutModal');
        openModal('orderSuccessModal');
        await fetchProducts();
      } catch (err) {
        alert(err.message || 'Failed to connect to server.');
      }
    },
    [cart, persistCart, closeModal, openModal, fetchProducts]
  );

  const sendWhatsAppReceipt = useCallback(() => {
    const order = lastCreatedOrder || viewingOrder;
    if (!order) return;
    const num = storeSettings.whatsapp_number || DEFAULT_SETTINGS.whatsapp_number;
    const itemsText = (order.items || [])
      .map((i) => `• ${i.name} × ${i.qty} — ₹${(i.price * i.qty).toLocaleString('en-IN')}`)
      .join('\n');
    const msg =
      `*RAKESH CLOTH STORES — ORDER CONFIRMATION*\n\n` +
      `Bill: ${order.bill_no || order.order_number}\n` +
      `Order: ${order.order_number}\n` +
      `Customer: ${order.customer_name}\n` +
      `Mobile: ${order.mobile}\n` +
      `Address: ${order.address}, ${order.city} ${order.pincode || ''}\n` +
      `Status: ${order.order_status}\n` +
      `Total: ₹${Number(order.total_amount).toLocaleString('en-IN')}\n\n` +
      `Items:\n${itemsText}\n\n` +
      `Please confirm my order. Thank you!`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  }, [lastCreatedOrder, viewingOrder, storeSettings.whatsapp_number]);

  const lookupCustomerOrders = useCallback(async (mobile) => {
    try {
      const data = await apiPost('/api/orders/lookup', { mobile });
      return data.orders || [];
    } catch (err) {
      alert(err.message || 'Lookup failed.');
      return null;
    }
  }, []);

  const handleReviewSubmit = useCallback(
    async (payload) => {
      try {
        const data = await apiPost('/api/reviews', payload);
        if (data.success) {
          alert(data.message);
          closeModal('writeReviewModal');
          await fetchReviews();
        }
      } catch (err) {
        alert(err.message);
      }
    },
    [closeModal, fetchReviews]
  );

  const handleReviewMediaUpload = useCallback(async (file) => {
    if (!file) return null;
    try {
      const data = await uploadFile(file, { publicUpload: true });
      if (data.success) return { url: data.url, isVideo: data.isVideo || file.type.startsWith('video') };
    } catch {
      /* fallback */
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ url: e.target.result, isVideo: file.type.startsWith('video') });
      reader.readAsDataURL(file);
    });
  }, []);

  const handleAdminLogin = useCallback(
    async (username, password) => {
      try {
        const data = await apiPost('/api/auth/login', { username, password });
        if (!data.success) {
          alert(data.error || 'Invalid credentials.');
          return false;
        }
        setAdminToken(data.token);
        closeModal('adminLoginModal');
        openModal('adminDashboardModal');
        fetchAdminOrders().catch(() => {});
        return true;
      } catch (err) {
        alert(err.message);
        return false;
      }
    },
    [closeModal, openModal, fetchAdminOrders]
  );

  const logoutAdmin = useCallback(() => {
    clearAdminToken();
    closeModal('adminDashboardModal');
  }, [closeModal]);

  const confirmOrder = useCallback(
    async (id) => {
      const data = await apiPatch(`/api/admin/orders/${id}/status`, { order_status: 'Confirmed' }, { auth: true });
      if (!data.success) throw new Error(data.error);
      await fetchAdminOrders();
      await fetchProducts();
      if (viewingOrder && viewingOrder.id === id) setViewingOrder(data.order);
      return data;
    },
    [fetchAdminOrders, fetchProducts, viewingOrder]
  );

  const finishDelivery = useCallback(
    async (id) => {
      const data = await apiPatch(`/api/admin/orders/${id}/status`, { order_status: 'Delivered' }, { auth: true });
      await fetchAdminOrders();
      return data;
    },
    [fetchAdminOrders]
  );

  const saveProduct = useCallback(
    async (payload) => {
      const data = payload.id
        ? await apiPut(`/api/products/${payload.id}`, payload, { auth: true })
        : await apiPost('/api/products', payload, { auth: true });
      await fetchProducts();
      return data;
    },
    [fetchProducts]
  );

  const restockProduct = useCallback(
    async (id, add) => {
      await apiPatch(`/api/products/${id}/stock`, { add }, { auth: true });
      await fetchProducts();
    },
    [fetchProducts]
  );

  const deleteProduct = useCallback(
    async (id) => {
      await apiDelete(`/api/products/${id}`, { auth: true });
      await fetchProducts();
    },
    [fetchProducts]
  );

  const handleHeroSlideSave = useCallback(
    async (payload) => {
      if (payload.editId) await apiPut(`/api/hero-slides/${payload.editId}`, payload, { auth: true });
      else await apiPost('/api/hero-slides', payload, { auth: true });
      closeModal('heroSlideModal');
      await fetchHero();
    },
    [closeModal, fetchHero]
  );

  const deleteHeroSlide = useCallback(
    async (id) => {
      if (!confirm('Delete this hero slide?')) return;
      await apiDelete(`/api/hero-slides/${id}`, { auth: true });
      await fetchHero();
    },
    [fetchHero]
  );

  const saveSettings = useCallback(
    async (payload) => {
      const data = await apiPut('/api/admin/settings', payload, { auth: true });
      if (data.settings) {
        const next = { ...DEFAULT_SETTINGS, ...data.settings };
        next.price_tiers = parsePriceTiers(next.price_tiers);
        setStoreSettings(next);
      }
      return data;
    },
    []
  );

  const value = {
    products,
    categories,
    heroSlides,
    reviews,
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
    filterCategory: (cat) => {
      setActiveCategory(cat);
      document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' });
    },
    setPriceTier: setActivePriceTier,
    resetFilters: () => {
      setActiveCategory('all');
      setActivePriceTier('all');
    },
    openCart,
    closeCart,
    addToCartDirect,
    updateCartQty,
    openProductDetail,
    openWhatsAppInquiry,
    orderCartOnWhatsApp,
    placeOrderStart,
    handleCheckoutSubmit,
    sendWhatsAppReceipt,
    lookupCustomerOrders,
    handleReviewSubmit,
    handleReviewMediaUpload,
    handleAdminLogin,
    logoutAdmin,
    adminOrders,
    fetchAdminOrders,
    confirmOrder,
    finishDelivery,
    saveProduct,
    restockProduct,
    deleteProduct,
    editingHeroSlide,
    setEditingHeroSlide,
    handleHeroSlideSave,
    deleteHeroSlide,
    editingProduct,
    setEditingProduct,
    saveSettings,
    fetchProducts,
    fetchHero,
    fetchReviews,
    uploadFile,
    activeReviewIndex,
    triggerStackNext: () => setActiveReviewIndex((prev) => (reviews.length ? (prev + 1) % reviews.length : 0)),
    isAdmin: Boolean(getAdminToken()),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
