import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { apiGet, apiPost, orderStatusMeta, uploadFile } from '../../api/client';
import { useStore } from '../../context/StoreContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const chartScaleOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#f5f5f0', font: { family: 'Montserrat' } } } },
  scales: {
    x: { ticks: { color: '#a3b8b0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#a3b8b0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
  },
};

function OverviewTab() {
  const [data, setData] = useState(null);
  useEffect(() => {
    apiGet('/api/admin/analytics', { auth: true }).then(setData).catch(() => {});
  }, []);
  if (!data?.summary) return <p style={{ color: 'var(--gold-400)' }}>Loading analytics…</p>;
  const s = data.summary;
  return (
    <>
      <div className="admin-metrics-summary-grid">
        {[
          ['Total Revenue', `₹${s.totalRevenue.toLocaleString('en-IN')}`],
          ['Today', `₹${s.todaySales.toLocaleString('en-IN')} (${s.todayOrders})`],
          ['Total Orders', s.totalOrders],
          ['Pending', s.pendingOrders],
          ['Confirmed', s.confirmedOrders],
          ['AOV', `₹${s.averageOrderValue.toLocaleString('en-IN')}`],
          ['Products', s.activeProducts],
          ['Stock units', s.totalStock],
          ['Low stock', s.lowStockProducts],
          ['Sold out', s.outOfStockProducts],
        ].map(([label, val]) => (
          <div className="admin-stat-card" key={label}><span>{label}</span><b>{val}</b></div>
        ))}
      </div>
      <div className="admin-charts-grid">
        <div className="chart-card-box">
          <div className="chart-header-row"><span className="chart-title">Weekly Sales</span></div>
          <div className="chart-canvas-holder">
            <Bar data={{ labels: data.weeklyChart.map((d) => d.label), datasets: [{ label: 'Revenue (₹)', data: data.weeklyChart.map((d) => d.revenue), backgroundColor: 'rgba(212,175,55,0.75)', borderColor: '#d4af37' }] }} options={chartScaleOpts} />
          </div>
        </div>
        <div className="chart-card-box">
          <div className="chart-header-row"><span className="chart-title">Monthly Performance</span></div>
          <div className="chart-canvas-holder">
            <Line data={{ labels: data.monthlyChart.map((d) => d.label), datasets: [{ label: 'Monthly Revenue', data: data.monthlyChart.map((d) => d.revenue), borderColor: '#f6e399', backgroundColor: 'rgba(246,227,153,0.15)', fill: true, tension: 0.35 }] }} options={chartScaleOpts} />
          </div>
        </div>
      </div>
    </>
  );
}

function StockTab() {
  const { products, restockProduct, deleteProduct, setEditingProduct } = useStore();
  const [filter, setFilter] = useState('all');
  const list = products.filter((p) => filter === 'all' || (filter === 'available' && p.stock > 2) || (filter === 'low' && p.stock > 0 && p.stock <= 2) || (filter === 'sold' && p.stock === 0));

  const downloadCsv = () => {
    const rows = [['ID', 'Name', 'Category', 'Price', 'Stock', 'Image'], ...products.map((p) => [p.id, p.name, p.category, p.price, p.stock, p.image_url])];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
    a.download = 'rakesh-stock.csv';
    a.click();
  };

  return (
    <>
      <div className="toolbar-row">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Stock</option>
          <option value="available">Available</option>
          <option value="low">Low Stock</option>
          <option value="sold">Sold Out</option>
        </select>
        <button className="admin-nav-tab" onClick={downloadCsv}>Download Excel</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>Image</th><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}>
              <td><img src={p.image_url} alt="" style={{ width: 48, height: 56, objectFit: 'cover', borderRadius: 6 }} /></td>
              <td><b>{p.name}</b><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.category} • #{p.id}</div></td>
              <td>₹{Number(p.price).toLocaleString('en-IN')}</td>
              <td><b>{p.stock}</b></td>
              <td>{p.stock === 0 ? 'SOLD OUT' : p.stock <= 2 ? 'LOW STOCK' : 'AVAILABLE'}</td>
              <td>
                <button className="admin-nav-tab" onClick={() => setEditingProduct(p)}>Edit</button>{' '}
                <button className="admin-nav-tab" onClick={async () => {
                  const n = prompt('How many new pieces arrived?', '5');
                  if (n == null) return;
                  await restockProduct(p.id, parseInt(n, 10));
                }}>+ Stock</button>{' '}
                <button className="admin-logout-btn" onClick={async () => {
                  if (confirm(`Delete ${p.name}?`)) await deleteProduct(p.id);
                }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function OrdersTab({ historyOnly }) {
  const { adminOrders, fetchAdminOrders, confirmOrder, finishDelivery } = useStore();
  const [bill, setBill] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => { fetchAdminOrders().catch(() => {}); }, [fetchAdminOrders]);

  const list = adminOrders.filter((o) => {
    if (historyOnly) {
      if (o.order_status !== 'Delivered' && o.order_status !== 'Cancelled') return false;
    } else if (o.order_status === 'Delivered' || o.order_status === 'Cancelled') return false;
    if (bill && !`${o.bill_no}${o.order_number}`.toLowerCase().includes(bill.toLowerCase())) return false;
    if (date && String(o.created_at || '').slice(0, 10) !== date) return false;
    return true;
  });

  const downloadCsv = () => {
    const rows = [['Bill', 'Order', 'Date', 'Customer', 'Mobile', 'Items', 'Total', 'Status'], ...list.map((o) => [o.bill_no, o.order_number, o.created_at, o.customer_name, o.mobile, (o.items || []).map((i) => `${i.name} x ${i.qty}`).join(' | '), o.total_amount, o.order_status])];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
    a.download = 'rakesh-orders.csv';
    a.click();
  };

  return (
    <>
      <div className="toolbar-row">
        <input placeholder="Bill / Order ID" value={bill} onChange={(e) => setBill(e.target.value)} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="admin-nav-tab" onClick={downloadCsv}>Download Excel</button>
      </div>
      {list.map((o) => {
        const status = orderStatusMeta(o.order_status);
        return (
          <div className="admin-order-card" key={o.id}>
            <div className="admin-order-head">
              <div>
                <b>{o.bill_no}</b> • {o.order_number}<br />
                {o.customer_name} • {o.mobile}<br />
                {o.address}, {o.city}
              </div>
              <span className={`status-badge ${status.key}`}>{status.label}</span>
            </div>
            <div className="order-imgs">
              {(o.items || []).map((p, i) => <img key={i} src={p.img || p.image_url} alt={p.name} title={p.name} />)}
            </div>
            <p>{(o.items || []).map((p) => `${p.name} × ${p.qty}`).join(' • ')}<br /><b>Total ₹{Number(o.total_amount).toLocaleString('en-IN')}</b></p>
            {!historyOnly && o.order_status === 'Pending' ? (
              <button className="gold-luxury-btn" onClick={async () => {
                try {
                  const res = await confirmOrder(o.id);
                  alert(res.message || 'Order confirmed. The customer can now start a WhatsApp video call.');
                } catch (err) {
                  alert(err.message);
                }
              }}>Confirm Order</button>
            ) : null}
            {!historyOnly && o.order_status === 'Confirmed' ? (
              <div className="admin-order-actions">
                <p className="tiny-note" style={{ margin: 0, flex: 1 }}>
                  WhatsApp video is unlocked for this customer. When they message you, tap the video camera in WhatsApp.
                </p>
                <button className="outline-gold-btn" onClick={async () => {
                  if (confirm('Mark delivery finished? It moves to All Orders history.')) await finishDelivery(o.id);
                }}>Delivery Finished</button>
              </div>
            ) : null}
          </div>
        );
      })}
      {!list.length ? <p style={{ color: 'var(--text-muted)' }}>No matching orders.</p> : null}
    </>
  );
}

function AddProductTab() {
  const { saveProduct, editingProduct, setEditingProduct, categories } = useStore();
  const fileRef = useRef(null);
  const [previews, setPreviews] = useState(editingProduct?.images || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPreviews(editingProduct?.images || (editingProduct?.image_url ? [editingProduct.image_url] : []));
  }, [editingProduct]);

  return (
    <form
      className="luxury-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const url = fd.get('image_url').toString().trim();
        const imgs = previews.length ? previews : url ? [url] : [];
        if (!imgs.length) return alert('Upload gallery photos or paste an image URL.');
        setSaving(true);
        try {
          await saveProduct({
            id: editingProduct?.id,
            name: fd.get('name').toString().trim(),
            category: fd.get('category').toString(),
            price: Number(fd.get('price')),
            stock: Number(fd.get('stock')),
            badge: fd.get('badge').toString().trim() || 'NEW',
            fabric: fd.get('fabric').toString().trim(),
            description: fd.get('description').toString().trim(),
            image_url: imgs[0],
            images: imgs,
          });
          alert(editingProduct ? 'Product updated.' : 'Product saved to inventory. Photos are stored on the server.');
          setEditingProduct(null);
          setPreviews([]);
          e.target.reset();
        } catch (err) {
          alert(err.message);
        } finally {
          setSaving(false);
        }
      }}
    >
      <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-400)', marginBottom: 12 }}>
        {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Product'}
      </h3>
      <div className="form-row-2">
        <div className="form-group"><label>Product Name *</label><input name="name" required defaultValue={editingProduct?.name || ''} /></div>
        <div className="form-group">
          <label>Category</label>
          <select name="category" defaultValue={editingProduct?.category || categories[0]?.slug || 'sarees'}>
            {(categories.length ? categories : [
              { slug: 'sarees', title: 'Sarees' },
              { slug: 'pattu', title: 'Pattu' },
              { slug: 'lehengas', title: 'Lehengas' },
              { slug: 'suiting', title: 'Suiting' },
              { slug: 'shirting', title: 'Shirting' },
            ]).map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.title}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row-2">
        <div className="form-group"><label>Price *</label><input name="price" type="number" min="1" required defaultValue={editingProduct?.price || ''} /></div>
        <div className="form-group"><label>Opening Stock *</label><input name="stock" type="number" min="0" required defaultValue={editingProduct?.stock ?? 1} /></div>
      </div>
      <div className="form-row-2">
        <div className="form-group"><label>Badge</label><input name="badge" defaultValue={editingProduct?.badge || 'NEW'} /></div>
        <div className="form-group"><label>Fabric</label><input name="fabric" defaultValue={editingProduct?.fabric || ''} /></div>
      </div>
      <div className="form-group"><label>Description</label><textarea name="description" rows={2} defaultValue={editingProduct?.description || ''} /></div>
      <div className="form-group">
        <label>Gallery images from your device (recommended)</label>
        <div className="image-upload-dropzone" onClick={() => fileRef.current?.click()}>
          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={async (e) => {
              const files = [...(e.target.files || [])].slice(0, 6);
              for (const file of files) {
                try {
                  const data = await uploadFile(file);
                  if (data.success) setPreviews((prev) => [...prev, data.url]);
                  else alert(data.error || 'Upload failed');
                } catch (err) {
                  alert('Upload failed: ' + err.message);
                }
              }
            }}
          />
          <span style={{ color: 'var(--gold-400)' }}>Click to upload saree photos from gallery or camera</span>
        </div>
        <div className="preview-thumb-box">
          {previews.map((src) => <img key={src} src={src} alt="preview" />)}
        </div>
      </div>
      <div className="form-group">
        <label>Or paste an image URL</label>
        <input name="image_url" placeholder="https://..." defaultValue={editingProduct?.image_url || ''} />
      </div>
      <button type="submit" className="gold-luxury-btn btn-full" disabled={saving}>{saving ? 'Saving…' : 'Save Product to Inventory ›'}</button>
    </form>
  );
}

function HeroTab() {
  const { heroSlides, deleteHeroSlide, handleHeroSlideSave } = useStore();
  const fileRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('');

  return (
    <>
      <form
        className="luxury-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          await handleHeroSlideSave({
            label: fd.get('label').toString().trim(),
            link: '#collections',
            sort_order: Number(fd.get('sort_order')) || 0,
            image_url: imageUrl || fd.get('image_url').toString().trim(),
          });
          e.target.reset();
          setImageUrl('');
        }}
      >
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-400)' }}>Add Hero Showcase Slide</h3>
        <div className="form-row-2">
          <div className="form-group"><label>Label *</label><input name="label" required placeholder="Bridal Pattu" /></div>
          <div className="form-group"><label>Sort</label><input name="sort_order" type="number" defaultValue={1} /></div>
        </div>
        <div className="image-upload-dropzone" onClick={() => fileRef.current?.click()}>
          <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const data = await uploadFile(file);
            if (data.success) setImageUrl(data.url);
          }} />
          <span style={{ color: 'var(--gold-400)' }}>Upload a high-resolution saree / model photo</span>
          {imageUrl ? <div className="preview-thumb-box"><img src={imageUrl} alt="" /></div> : null}
        </div>
        <div className="form-group" style={{ marginTop: 10 }}>
          <input name="image_url" placeholder="Or paste image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
        <button className="gold-luxury-btn" type="submit">Save Slide ›</button>
      </form>
      <table className="admin-table">
        <thead><tr><th>Image</th><th>Label</th><th></th></tr></thead>
        <tbody>
          {heroSlides.map((s) => (
            <tr key={s.id}>
              <td><img src={s.image_url} alt="" style={{ width: 70, height: 46, objectFit: 'cover' }} /></td>
              <td>{s.label}</td>
              <td><button className="admin-logout-btn" onClick={() => deleteHeroSlide(s.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function PriceRangesTab() {
  const { storeSettings, saveSettings } = useStore();
  const [tiers, setTiers] = useState([]);

  useEffect(() => {
    const list = Array.isArray(storeSettings.price_tiers) && storeSettings.price_tiers.length
      ? storeSettings.price_tiers
      : [
          { id: 'r1', title: '₹500 – ₹1,500', desc: 'Daily & festive', min: 500, max: 1500 },
          { id: 'r2', title: '₹1,501 – ₹3,000', desc: 'Party wear', min: 1501, max: 3000 },
          { id: 'r3', title: '₹3,001 – ₹5,000', desc: 'Designer', min: 3001, max: 5000 },
          { id: 'r4', title: '₹5,001 – ₹10,000', desc: 'Pattu & premium', min: 5001, max: 10000 },
          { id: 'r5', title: '₹10,001 – ₹20,000', desc: 'Bridal luxury', min: 10001, max: 20000 },
        ];
    setTiers(list.map((t) => ({ ...t })));
  }, [storeSettings.price_tiers]);

  const updateRow = (index, field, value) => {
    setTiers((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  return (
    <form
      className="luxury-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const cleaned = tiers
          .map((t, i) => ({
            id: t.id || `r${i + 1}`,
            title: String(t.title || '').trim(),
            desc: String(t.desc || '').trim(),
            min: Number(t.min) || 0,
            max: Number(t.max) || 0,
          }))
          .filter((t) => t.title);
        if (!cleaned.length) return alert('Keep at least one price range.');
        if (cleaned.some((t) => t.max < t.min)) return alert('Each range max must be greater than or equal to min.');
        await saveSettings({ price_tiers: cleaned });
        alert('Price range options updated. Customers will see them on the shop page.');
      }}
    >
      <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-400)', marginBottom: 8 }}>Edit Price Range Options</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
        These buttons appear on the homepage. “All Prices” always stays as the first option.
      </p>
      {tiers.map((t, i) => (
        <div className="price-range-row" key={t.id || i}>
          <div className="form-group"><label>Label</label><input value={t.title} onChange={(e) => updateRow(i, 'title', e.target.value)} placeholder="₹500 – ₹1,500" required /></div>
          <div className="form-group"><label>Short note</label><input value={t.desc || ''} onChange={(e) => updateRow(i, 'desc', e.target.value)} placeholder="Daily & festive" /></div>
          <div className="form-group"><label>Min ₹</label><input type="number" min="0" value={t.min} onChange={(e) => updateRow(i, 'min', e.target.value)} required /></div>
          <div className="form-group"><label>Max ₹</label><input type="number" min="0" value={t.max} onChange={(e) => updateRow(i, 'max', e.target.value)} required /></div>
          <button type="button" className="admin-logout-btn" onClick={() => setTiers((prev) => prev.filter((_, idx) => idx !== i))}>Remove</button>
        </div>
      ))}
      <div className="toolbar-row" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="admin-nav-tab"
          onClick={() => setTiers((prev) => [...prev, { id: `r${Date.now()}`, title: '', desc: '', min: 0, max: 1000 }])}
        >
          + Add Price Range
        </button>
        <button type="submit" className="gold-luxury-btn">Save Price Ranges ›</button>
      </div>
    </form>
  );
}

function CategoriesTab() {
  const { categories, saveCategory, deleteCategory } = useStore();
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [newCat, setNewCat] = useState({ title: '', cta: 'EXPLORE →', image_url: '', slug: '' });
  const newFileRef = useRef(null);
  const fileRefs = useRef({});

  useEffect(() => {
    const next = {};
    categories.forEach((c) => {
      next[c.id] = { title: c.title, cta: c.cta, image_url: c.image_url, slug: c.slug };
    });
    setDrafts(next);
  }, [categories]);

  const updateDraft = (id, field, value) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const saveRow = async (id) => {
    const row = drafts[id];
    if (!row?.title || !row?.image_url) return alert('Category name and image are required.');
    setSavingId(id);
    try {
      await saveCategory({ id, ...row });
      alert('Category saved. Customers will see it under Shop by Category.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const uploadInto = async (file, setter) => {
    if (!file) return;
    try {
      const data = await uploadFile(file);
      if (data.success) setter(data.url);
      else alert(data.error || 'Upload failed');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };

  return (
    <>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
        Change Shop by Category photos from your computer or by pasting an image URL. Title and button text are also editable.
      </p>
      {categories.map((cat) => {
        const row = drafts[cat.id] || cat;
        return (
          <div className="admin-category-editor" key={cat.id}>
            <img src={row.image_url} alt={row.title} />
            <div>
              <div className="form-row-2">
                <div className="form-group"><label>Name</label><input value={row.title || ''} onChange={(e) => updateDraft(cat.id, 'title', e.target.value)} /></div>
                <div className="form-group"><label>Button text</label><input value={row.cta || ''} onChange={(e) => updateDraft(cat.id, 'cta', e.target.value)} /></div>
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input value={row.image_url || ''} onChange={(e) => updateDraft(cat.id, 'image_url', e.target.value)} placeholder="https://... or upload below" />
              </div>
              <div className="toolbar-row">
                <button type="button" className="admin-nav-tab" onClick={() => fileRefs.current[cat.id]?.click()}>Upload from computer</button>
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => { fileRefs.current[cat.id] = el; }}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    uploadInto(file, (url) => updateDraft(cat.id, 'image_url', url));
                  }}
                />
                <button type="button" className="gold-luxury-btn" disabled={savingId === cat.id} onClick={() => saveRow(cat.id)}>
                  {savingId === cat.id ? 'Saving…' : 'Save Category'}
                </button>
                <button type="button" className="admin-logout-btn" onClick={async () => {
                  if (confirm(`Remove ${cat.title} from Shop by Category?`)) await deleteCategory(cat.id);
                }}>Remove</button>
              </div>
            </div>
          </div>
        );
      })}

      <form
        className="luxury-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!newCat.title.trim() || !newCat.image_url.trim()) return alert('Name and image are required.');
          try {
            await saveCategory(newCat);
            setNewCat({ title: '', cta: 'EXPLORE →', image_url: '', slug: '' });
            alert('New category added.');
          } catch (err) {
            alert(err.message);
          }
        }}
      >
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-400)' }}>Add Category</h3>
        <div className="form-row-2">
          <div className="form-group"><label>Name *</label><input value={newCat.title} onChange={(e) => setNewCat((p) => ({ ...p, title: e.target.value }))} placeholder="Kids Wear" required /></div>
          <div className="form-group"><label>Button text</label><input value={newCat.cta} onChange={(e) => setNewCat((p) => ({ ...p, cta: e.target.value }))} /></div>
        </div>
        <div className="image-upload-dropzone" onClick={() => newFileRef.current?.click()}>
          <input type="file" ref={newFileRef} accept="image/*" style={{ display: 'none' }} onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            uploadInto(file, (url) => setNewCat((p) => ({ ...p, image_url: url })));
          }} />
          <span style={{ color: 'var(--gold-400)' }}>Upload a category photo from your computer</span>
          {newCat.image_url ? <div className="preview-thumb-box"><img src={newCat.image_url} alt="" /></div> : null}
        </div>
        <div className="form-group" style={{ marginTop: 10 }}>
          <label>Or paste image URL</label>
          <input value={newCat.image_url} onChange={(e) => setNewCat((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
        </div>
        <button className="gold-luxury-btn" type="submit">Add Category ›</button>
      </form>
    </>
  );
}

function SettingsTab() {
  const { storeSettings, saveSettings } = useStore();
  return (
    <>
      <form
        className="luxury-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          await saveSettings({
            whatsapp_number: fd.get('whatsapp_number').toString().trim(),
            instagram_url: fd.get('instagram_url').toString().trim(),
            youtube_url: fd.get('youtube_url').toString().trim(),
            maps_url: fd.get('maps_url').toString().trim(),
            shop_hours: fd.get('shop_hours').toString().trim(),
          });
          alert('Store settings saved.');
        }}
      >
        <div className="form-group"><label>WhatsApp number</label><input name="whatsapp_number" defaultValue={storeSettings.whatsapp_number} /></div>
        <div className="form-group"><label>Instagram URL</label><input name="instagram_url" defaultValue={storeSettings.instagram_url} /></div>
        <div className="form-group"><label>YouTube URL</label><input name="youtube_url" defaultValue={storeSettings.youtube_url} /></div>
        <div className="form-group"><label>Google Maps URL</label><input name="maps_url" defaultValue={storeSettings.maps_url} /></div>
        <div className="form-group"><label>Shop hours</label><input name="shop_hours" defaultValue={storeSettings.shop_hours} /></div>
        <button className="gold-luxury-btn btn-full" type="submit">Save Settings ›</button>
      </form>
      <form
        className="luxury-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          try {
            await apiPost('/api/auth/change-password', {
              currentPassword: fd.get('currentPassword'),
              newPassword: fd.get('newPassword'),
              newUsername: fd.get('newUsername'),
            }, { auth: true });
            alert('Admin ID and password updated.');
            e.target.reset();
          } catch (err) {
            alert(err.message);
          }
        }}
      >
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-400)' }}>Change Admin Login</h3>
        <div className="form-group"><label>New Admin ID</label><input name="newUsername" defaultValue="admin" /></div>
        <div className="form-group"><label>Current Password *</label><input name="currentPassword" type="password" required /></div>
        <div className="form-group"><label>New Password *</label><input name="newPassword" type="password" required /></div>
        <button className="gold-luxury-btn btn-full" type="submit">Save Login ›</button>
      </form>
    </>
  );
}

export default function AdminDashboard() {
  const { modals, logoutAdmin, editingProduct } = useStore();
  const [tab, setTab] = useState(editingProduct ? 'add' : 'dashboard');

  useEffect(() => {
    if (editingProduct) setTab('add');
  }, [editingProduct]);

  if (!modals.adminDashboardModal) return null;

  const tabs = [
    ['dashboard', 'Dashboard'],
    ['stock', 'Stock'],
    ['orders', 'Orders'],
    ['add', 'Add Product'],
    ['history', 'All Orders'],
    ['hero', 'Hero Slides'],
    ['categories', 'Categories'],
    ['prices', 'Price Ranges'],
    ['settings', 'Settings'],
  ];

  return (
    <div className="modal-overlay active" onClick={() => {}}>
      <div className="modal-card modal-xl admin-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="admin-topbar">
          <div className="admin-title-badge">
            <h3>Rakesh Cloth Stores — Control Room</h3>
            <span className="admin-role-tag">ADMIN</span>
          </div>
          <div className="admin-topbar-actions">
            {tabs.map(([id, label]) => (
              <button key={id} className={`admin-nav-tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{label}</button>
            ))}
            <button className="admin-logout-btn" onClick={logoutAdmin}>Logout</button>
          </div>
        </div>
        <div className="admin-tab-content-area">
          {tab === 'dashboard' && <OverviewTab />}
          {tab === 'stock' && <StockTab />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'add' && <AddProductTab />}
          {tab === 'history' && <OrdersTab historyOnly />}
          {tab === 'hero' && <HeroTab />}
          {tab === 'categories' && <CategoriesTab />}
          {tab === 'prices' && <PriceRangesTab />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}
