import { useEffect, useMemo, useState } from 'react';
import Seo from '../components/Seo';
import { BRAND, CATEGORIES, cleanUrl } from '../data/brand';
import { useStore } from '../context/Store';
import { money } from '../lib/format';
import { downloadOrdersExcel } from '../lib/excel';

const STATUSES = ['New', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered', 'Cancelled'];
const EMPTY_ADDRESS = { id: '', label: '', line1: '', line2: '', city: '', state: '', pin: '' };
const EMPTY_PRODUCT = { name: '', category: 'sarees', price: '', stock: '1', badge: 'NEW', fabric: '', img: '', desc: '' };

function PasswordField({ label, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <label className="rks-admin-label">{label}
      <span className="pw-field">
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} required />
        <button type="button" className="text-btn" onClick={() => setShow((v) => !v)}>{show ? 'Hide' : 'Show'}</button>
      </span>
    </label>
  );
}

export default function Admin() {
  const store = useStore();
  const [tab, setTab] = useState('overview');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [gate, setGate] = useState(false);
  const [gatePw, setGatePw] = useState('');
  const [draft, setDraft] = useState(EMPTY_PRODUCT);
  const [pwForm, setPwForm] = useState({ current: '', next: '' });
  const [sheet, setSheet] = useState(store.scriptUrl);
  const [waInput, setWaInput] = useState(store.whatsappDisplay);
  const [emailInput, setEmailInput] = useState(store.email);
  const [hoursInput, setHoursInput] = useState(store.hours);
  const [socialForm, setSocialForm] = useState(store.social);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [heroForm, setHeroForm] = useState({ label: '', image_url: '', link: '/shop' });
  const [catForm, setCatForm] = useState({ title: '', cta: 'SHOP →', image_url: '' });
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    const byCat = {};
    let sales = 0;
    store.orders.forEach((order) => {
      sales += Number(order.total || 0);
      (order.items || []).forEach((item) => {
        const value = Number(item.lineTotal || (item.price * item.qty) || 0);
        const key = item.cat || item.category || 'Other';
        byCat[key] = (byCat[key] || 0) + value;
      });
    });
    return { sales, byCat };
  }, [store.orders]);

  useEffect(() => {
    if (!store.authed) return undefined;
    let cancel = false;
    store.syncOrders().then((result) => {
      if (cancel || !result.ok) return;
      setNotice(`Loaded ${result.count} orders from the Google Sheet.`);
    }).catch(() => {});
    return () => { cancel = true; };
  }, [store.authed]);

  useEffect(() => { setEmailInput(store.email); }, [store.email]);
  useEffect(() => { setHoursInput(store.hours); }, [store.hours]);
  useEffect(() => { setSocialForm(store.social); }, [store.social]);
  useEffect(() => { setWaInput(store.whatsappDisplay); }, [store.whatsappDisplay]);

  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await store.login(password);
    setBusy(false);
    setError(ok ? '' : 'Incorrect password.');
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    if (!/^[1-9][0-9]{5}$/.test(addressForm.pin.trim())) {
      setError('Enter a 6-digit PIN code.');
      return;
    }
    const next = {
      id: addressForm.id || `addr-${Date.now()}`,
      label: addressForm.label.trim() || 'Shop',
      line1: addressForm.line1.trim(),
      line2: addressForm.line2.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      pin: addressForm.pin.trim(),
    };
    const list = addressForm.id
      ? store.addresses.map((item) => (item.id === next.id ? next : item))
      : [...store.addresses, next];
    setBusy(true);
    const result = await store.saveShop({ addresses: list });
    setBusy(false);
    setError(result.ok ? '' : result.error);
    setNotice(result.ok ? (result.warning || 'Shop address saved.') : '');
    if (result.ok) setAddressForm(EMPTY_ADDRESS);
  };

  const download = async (e) => {
    e.preventDefault();
    const ok = await store.passwordMatches(gatePw);
    if (!ok) {
      setError('Password did not match. The Excel file was not created.');
      return;
    }
    downloadOrdersExcel(store.orders);
    setGate(false);
    setGatePw('');
    setError('');
    setNotice('Excel file downloaded.');
  };

  if (!store.authed) {
    return (
      <section className="section-container page-pad admin-page">
        <Seo title="Admin | Rakesh Cloth Stores" description="Private admin sign-in." noindex />
        <div className="rks-panel" style={{ maxWidth: 420, margin: '40px auto' }}>
          <p className="rks-kicker">Private</p>
          <h1>Admin</h1>
          <p>Password access for orders, catalogue and shop settings. Default password is 1234 until you change it.</p>
          <form className="luxury-form" onSubmit={login}>
            <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            {error ? <p className="rks-err">{error}</p> : null}
            <button className="gold-luxury-btn btn-full" type="submit" disabled={busy}>{busy ? 'Opening…' : 'Enter dashboard'}</button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="section-container page-pad admin-page">
      <Seo title="Dashboard | Rakesh Cloth Stores Admin" description="Order and catalogue dashboard." noindex />
      <div className="admin-top">
        <div>
          <p className="rks-kicker">Admin</p>
          <h1>Dashboard</h1>
          <p className="muted">{store.sheetNote}</p>
        </div>
        <button type="button" className="outline-gold-btn" onClick={store.logout}>Log out</button>
      </div>
      <div className="rks-tabs">
        {['overview', 'orders', 'catalogue', 'settings', 'where'].map((id) => (
          <button key={id} type="button" className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{id}</button>
        ))}
      </div>
      {notice ? <p className="rks-ok">{notice}</p> : null}
      {error && tab !== 'catalogue' && !gate ? <p className="rks-err">{error}</p> : null}

      {tab === 'overview' && (
        <>
          <div className="kpi-grid">
            <article><span>Orders</span><strong>{store.orders.length}</strong></article>
            <article><span>Sales recorded</span><strong>{money(stats.sales)}</strong></article>
            <article><span>Live pieces</span><strong>{store.products.length}</strong></article>
          </div>
          <div className="rks-panel">
            <h2>Sales by category</h2>
            <Bars rows={Object.entries(stats.byCat).map(([label, value]) => ({ label, value }))} format={money} empty="Place or sync an order to draw this chart." />
          </div>
          <button type="button" className="gold-luxury-btn" onClick={async () => {
            const result = await store.syncOrders();
            setNotice(result.ok ? `Synced ${result.count} orders from Google Sheet.` : result.error);
          }}>Refresh from Google Sheet</button>
        </>
      )}

      {tab === 'orders' && (
        <>
          <div className="btn-row">
            <button type="button" className="gold-luxury-btn" onClick={() => { setGate(true); setError(''); }}>Download Excel</button>
            <button type="button" className="outline-gold-btn" onClick={async () => {
              const result = await store.syncOrders();
              setNotice(result.ok ? `Synced ${result.count} orders from Google Sheet.` : result.error);
            }}>Sync sheet</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {store.orders.length === 0 && <tr><td colSpan={5}>No orders yet. Orders placed on any phone appear here after the Google Sheet is connected.</td></tr>}
                {store.orders.map((order) => (
                  <tr key={order.id}>
                    <td data-label="Order">{order.id}<br /><span className="muted">{order.date ? new Date(order.date).toLocaleString('en-IN') : ''}</span></td>
                    <td data-label="Customer">
                      <strong>{order.name}</strong><br />
                      {order.phone}<br />
                      {order.address}
                      {order.note ? <><br /><span className="muted">{order.note}</span></> : null}
                    </td>
                    <td data-label="Items">{(order.items || []).map((item) => `${item.name} × ${item.qty}`).join(', ')}</td>
                    <td data-label="Total">{money(order.total || 0)}</td>
                    <td data-label="Status">
                      <div className="order-actions">
                        <select value={order.status || 'New'} onChange={async (e) => {
                          const result = await store.updateStatus(order.id, e.target.value);
                          setNotice(result.ok ? `Status saved for ${order.id}. Video call unlocks when status is Confirmed.` : '');
                          setError(result.ok ? '' : result.error);
                        }}>
                          {STATUSES.map((status) => <option key={status}>{status}</option>)}
                        </select>
                        <button type="button" className="text-btn" onClick={async () => {
                          if (!window.confirm(`Delete order ${order.id}?`)) return;
                          const result = await store.deleteOrder(order.id);
                          setNotice(result.ok ? `Deleted ${order.id}.` : '');
                          setError(result.ok ? '' : result.error);
                        }}>Delete order</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'catalogue' && (
        <div className="rks-split">
          <form className="luxury-form rks-panel" onSubmit={async (e) => {
            e.preventDefault();
            const result = await store.addProduct(draft);
            setNotice(result.ok ? `${draft.name} is now on the website. ${result.warning || ''}` : '');
            setError(result.ok ? '' : result.error);
            if (result.ok) setDraft(EMPTY_PRODUCT);
          }}>
            <h2>Add piece</h2>
            <div className="form-group">
              <label>Name</label>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
              </select>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Price ₹</label>
                <input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} inputMode="decimal" required />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} inputMode="numeric" />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Badge</label>
                <input value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Fabric</label>
                <input value={draft.fabric} onChange={(e) => setDraft({ ...draft, fabric: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input value={draft.img} onChange={(e) => setDraft({ ...draft, img: e.target.value })} placeholder="https://…" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} rows={3} />
            </div>
            {error && tab === 'catalogue' ? <p className="rks-err">{error}</p> : null}
            <button className="gold-luxury-btn btn-full" type="submit">Publish on website</button>
          </form>
          <div className="rks-panel">
            <h2>Live catalogue</h2>
            <ul className="plain">
              {store.allProducts.map((p) => (
                <li key={p.id}>
                  <strong>{p.name}</strong> · {p.category} · {money(p.price)} · stock {p.stock}
                  <div className="btn-row" style={{ marginTop: 6 }}>
                    <button type="button" className="text-btn" onClick={async () => {
                      const add = Number(window.prompt('Add stock quantity', '1') || 0);
                      if (!add) return;
                      const result = await store.restockProduct(p.id, add);
                      setNotice(result.ok ? `Stock updated for ${p.name}.` : result.error);
                    }}>Restock</button>
                    <button type="button" className="text-btn" onClick={async () => {
                      const price = window.prompt('New price', String(p.price));
                      if (price == null) return;
                      const result = await store.updateProduct(p.id, { price: Number(price) });
                      setNotice(result.ok ? `Price updated for ${p.name}.` : result.error);
                    }}>Price</button>
                    <button type="button" className="text-btn" onClick={async () => {
                      if (!window.confirm(`Hide ${p.name} from the website?`)) return;
                      await store.deleteProduct(p.id);
                      setNotice(`${p.name} hidden from the shop.`);
                    }}>Hide</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="settings-stack">
          <form className="luxury-form rks-panel" onSubmit={async (e) => {
            e.preventDefault();
            const result = await store.setWhatsapp(waInput);
            setError(result.ok ? '' : result.error);
            setNotice(result.ok ? (result.warning || 'WhatsApp number updated across the website.') : '');
          }}>
            <h2>Order WhatsApp number</h2>
            <p className="muted">Used in the header, footer, contact page and checkout.</p>
            <div className="form-group">
              <label>WhatsApp number</label>
              <input value={waInput} onChange={(e) => setWaInput(e.target.value)} placeholder="9985728175" inputMode="tel" required />
            </div>
            <button className="gold-luxury-btn" type="submit">Save number</button>
          </form>

          <form className="luxury-form rks-panel" onSubmit={async (e) => {
            e.preventDefault();
            const result = await store.saveShop({ email: emailInput.trim(), hours: hoursInput.trim() });
            setError(result.ok ? '' : result.error);
            setNotice(result.ok ? (result.warning || 'Shop details updated.') : '');
          }}>
            <h2>Shop details</h2>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Hours</label>
              <input value={hoursInput} onChange={(e) => setHoursInput(e.target.value)} />
            </div>
            <button className="gold-luxury-btn" type="submit">Save details</button>
          </form>

          <div className="rks-panel">
            <h2>Shop addresses</h2>
            <div className="address-list">
              {store.addresses.map((item) => (
                <article key={item.id} className="rks-address-card">
                  <strong>{item.label || 'Shop'}</strong>
                  <span>{item.line1}{item.line2 ? `, ${item.line2}` : ''}</span>
                  <span>{item.city}, {item.state} {item.pin}</span>
                  <div className="btn-row">
                    <button type="button" className="outline-gold-btn" onClick={() => { setAddressForm(item); setError(''); }}>Edit</button>
                    <button type="button" className="text-btn" onClick={async () => {
                      if (!window.confirm('Remove this shop address from the website?')) return;
                      const result = await store.saveShop({ addresses: store.addresses.filter((a) => a.id !== item.id) });
                      setNotice(result.ok ? 'Address removed.' : '');
                      setError(result.ok ? '' : result.error);
                    }}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
            <form className="luxury-form" onSubmit={saveAddress}>
              <h3>{addressForm.id ? 'Edit address' : 'Add address'}</h3>
              <div className="form-group"><label>Shop name</label><input value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} /></div>
              <div className="form-group"><label>Address line</label><input value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} required /></div>
              <div className="form-group"><label>Area / landmark</label><input value={addressForm.line2} onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })} /></div>
              <div className="form-row-2">
                <div className="form-group"><label>City</label><input value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} required /></div>
                <div className="form-group"><label>State</label><input value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} required /></div>
              </div>
              <div className="form-group"><label>PIN code</label><input value={addressForm.pin} onChange={(e) => setAddressForm({ ...addressForm, pin: e.target.value })} inputMode="numeric" maxLength={6} required /></div>
              <div className="btn-row">
                <button className="gold-luxury-btn" type="submit" disabled={busy}>{addressForm.id ? 'Save address' : 'Add address'}</button>
                {addressForm.id ? <button type="button" className="outline-gold-btn" onClick={() => setAddressForm(EMPTY_ADDRESS)}>Cancel</button> : null}
              </div>
            </form>
          </div>

          <form className="luxury-form rks-panel" onSubmit={async (e) => {
            e.preventDefault();
            const result = await store.saveShop({
              instagram: cleanUrl(socialForm.instagram),
              facebook: cleanUrl(socialForm.facebook),
              youtube: cleanUrl(socialForm.youtube),
              maps: cleanUrl(socialForm.maps),
            });
            setError(result.ok ? '' : result.error);
            setNotice(result.ok ? (result.warning || 'Social links updated.') : '');
          }}>
            <h2>Social profiles</h2>
            <div className="form-group"><label>Instagram</label><input value={socialForm.instagram} onChange={(e) => setSocialForm({ ...socialForm, instagram: e.target.value })} /></div>
            <div className="form-group"><label>Facebook</label><input value={socialForm.facebook} onChange={(e) => setSocialForm({ ...socialForm, facebook: e.target.value })} /></div>
            <div className="form-group"><label>YouTube</label><input value={socialForm.youtube} onChange={(e) => setSocialForm({ ...socialForm, youtube: e.target.value })} /></div>
            <div className="form-group"><label>Google Maps</label><input value={socialForm.maps} onChange={(e) => setSocialForm({ ...socialForm, maps: e.target.value })} /></div>
            <button className="gold-luxury-btn" type="submit">Save social links</button>
          </form>

          <form className="luxury-form rks-panel" onSubmit={async (e) => {
            e.preventDefault();
            await store.handleHeroSlideSave(heroForm);
            setHeroForm({ label: '', image_url: '', link: '/shop' });
            setNotice('Hero slide added on the home page.');
          }}>
            <h2>Home showcase slides</h2>
            <div className="form-group"><label>Label</label><input value={heroForm.label} onChange={(e) => setHeroForm({ ...heroForm, label: e.target.value })} required /></div>
            <div className="form-group"><label>Image URL</label><input value={heroForm.image_url} onChange={(e) => setHeroForm({ ...heroForm, image_url: e.target.value })} required /></div>
            <button className="gold-luxury-btn" type="submit">Add slide</button>
            <ul className="plain" style={{ marginTop: 12 }}>
              {store.heroSlides.map((slide) => (
                <li key={slide.id}>{slide.label} <button type="button" className="text-btn" onClick={() => store.deleteHeroSlide(slide.id)}>Remove</button></li>
              ))}
            </ul>
          </form>

          <form className="luxury-form rks-panel" onSubmit={async (e) => {
            e.preventDefault();
            await store.saveCategory(catForm);
            setCatForm({ title: '', cta: 'SHOP →', image_url: '' });
            setNotice('Category saved.');
          }}>
            <h2>Categories</h2>
            <div className="form-group"><label>Title</label><input value={catForm.title} onChange={(e) => setCatForm({ ...catForm, title: e.target.value })} required /></div>
            <div className="form-group"><label>Button text</label><input value={catForm.cta} onChange={(e) => setCatForm({ ...catForm, cta: e.target.value })} /></div>
            <div className="form-group"><label>Image URL</label><input value={catForm.image_url} onChange={(e) => setCatForm({ ...catForm, image_url: e.target.value })} required /></div>
            <button className="gold-luxury-btn" type="submit">Add category</button>
          </form>

          <form className="luxury-form rks-panel" onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const result = await store.changePassword(pwForm.current, pwForm.next);
            setBusy(false);
            setError(result.ok ? '' : result.error);
            setNotice(result.ok ? 'Password updated. Use it on every phone and laptop.' : '');
            if (result.ok) setPwForm({ current: '', next: '' });
          }}>
            <h2>Change password</h2>
            <PasswordField label="Current password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} autoComplete="current-password" />
            <PasswordField label="New password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} autoComplete="new-password" />
            <button className="gold-luxury-btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
          </form>

          <form className="luxury-form rks-panel" onSubmit={(e) => { e.preventDefault(); store.setScriptUrl(sheet); setNotice('Google Sheet URL saved on this browser.'); }}>
            <h2>Google Sheet connection</h2>
            <p className="muted">Paste the Apps Script web app URL that ends with /exec. After this, catalogue, orders and WhatsApp edits sync for every visitor.</p>
            <div className="form-group">
              <label>Apps Script web app URL</label>
              <input value={sheet} onChange={(e) => setSheet(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" />
            </div>
            <button className="gold-luxury-btn" type="submit">Save URL</button>
          </form>
        </div>
      )}

      {tab === 'where' && (
        <div className="rks-panel prose">
          <h2>Where the Google Sheet lives</h2>
          <p>Orders, customer details and items are stored in your Google Sheet. An order placed on any phone appears in this dashboard after you sign in. There is no Render or Railway server.</p>
          {BRAND.sheetUrl ? <p><a className="gold" href={BRAND.sheetUrl} target="_blank" rel="noreferrer">Open the order sheet</a></p> : <p>Create a Google Sheet, paste Code.gs into Apps Script, run setup(), deploy as a web app, then paste the /exec URL under Settings.</p>}
          <p>The sheet tabs are:</p>
          <ul>
            <li><strong>Orders</strong> — order id, date, customer, phone, address, items and status. Set status to Confirmed to unlock WhatsApp video.</li>
            <li><strong>Customers</strong> — phone, name and address.</li>
            <li><strong>Products</strong> — name, category, price, stock, image and description.</li>
            <li><strong>Enquiries</strong> — messages from the contact page.</li>
            <li><strong>Reviews</strong> — customer looks shared on the website.</li>
            <li><strong>Settings</strong> — admin password, WhatsApp number, addresses and social links.</li>
          </ul>
        </div>
      )}

      {gate && (
        <div className="modal-overlay active" onClick={() => setGate(false)}>
          <form className="modal-card modal-sm luxury-form" onClick={(e) => e.stopPropagation()} onSubmit={download}>
            <h2>Confirm password to download</h2>
            <PasswordField label="Admin password" value={gatePw} onChange={(e) => setGatePw(e.target.value)} autoComplete="current-password" />
            {error ? <p className="rks-err">{error}</p> : null}
            <button className="gold-luxury-btn btn-full" type="submit">Download orders.xls</button>
          </form>
        </div>
      )}
    </section>
  );
}

function Bars({ rows, format, empty }) {
  const max = Math.max(...rows.map((r) => r.value), 0);
  if (!max) return <p className="muted">{empty}</p>;
  return (
    <div className="bars">
      {rows.filter((r) => r.value > 0).map((r) => (
        <div key={r.label} className="bar-row">
          <span>{r.label}</span>
          <div className="bar-track"><i style={{ width: `${(r.value / max) * 100}%` }} /></div>
          <b>{format ? format(r.value) : r.value}</b>
        </div>
      ))}
    </div>
  );
}
