export const BRAND = {
  name: 'Rakesh Cloth Stores',
  short: 'Rakesh Cloth Stores',
  tagline: 'Quality Matters',
  sub: 'Kurmannapalem, Visakhapatnam',
  sheetUrl: '',
  scriptUrl: '',
  whatsapp: '919985728175',
  whatsappDisplay: '+91 99857 28175',
  email: '',
  instagram: 'https://www.instagram.com/rakesh_mahanthy/',
  facebook: '',
  youtube: 'https://youtube.com/@rakeshclothstores',
  maps: 'https://share.google/8JlpdC0pL8h30meut',
  hours: '10:00 AM – 8:30 PM',
  defaultPassword: '1234',
  logo: '/logo.png',
};

export const CATEGORIES = [
  { id: 'sarees', slug: 'sarees', title: 'DESIGNER SAREES', short: 'Sarees', cta: 'SHOP SAREES →', image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80' },
  { id: 'pattu', slug: 'pattu', title: 'PATTU SAREES', short: 'Pattu', cta: 'ROYAL SILK →', image_url: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=80' },
  { id: 'lehengas', slug: 'lehengas', title: 'LEHENGAS', short: 'Lehengas', cta: 'BRIDAL SETS →', image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=800&auto=format&fit=crop&q=80' },
  { id: 'suiting', slug: 'suiting', title: 'SUITING', short: 'Suiting', cta: 'PREMIUM PIECES →', image_url: 'https://images.unsplash.com/photo-1594938298603-c8148cfe4511?w=800&auto=format&fit=crop&q=80' },
  { id: 'shirting', slug: 'shirting', title: 'SHIRTING', short: 'Shirting', cta: 'FINE FABRICS →', image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80' },
];

export const PRICE_TIERS = [
  { id: 'all', title: 'All Prices', desc: 'Full catalogue', min: 0, max: 999999 },
  { id: 'r1', title: '₹500 – ₹1,500', desc: 'Daily & festive', min: 500, max: 1500 },
  { id: 'r2', title: '₹1,501 – ₹3,000', desc: 'Party wear', min: 1501, max: 3000 },
  { id: 'r3', title: '₹3,001 – ₹5,000', desc: 'Designer', min: 3001, max: 5000 },
  { id: 'r4', title: '₹5,001 – ₹10,000', desc: 'Pattu & premium', min: 5001, max: 10000 },
  { id: 'r5', title: '₹10,001 – ₹20,000', desc: 'Bridal luxury', min: 10001, max: 20000 },
];

export const SHOP_ADDRESS = {
  id: 'shop-vizag',
  label: 'Rakesh Cloth Stores',
  line1: 'Near Duvvada Bridge, opposite Dama Convention',
  line2: 'Kurmannapalem, Gajuwaka',
  city: 'Visakhapatnam',
  state: 'Andhra Pradesh',
  pin: '530046',
};

export function formatWhatsapp(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`;
  const display = digits.startsWith('91') && digits.length === 12
    ? `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
    : (digits ? `+${digits}` : BRAND.whatsappDisplay);
  return { whatsapp: digits || BRAND.whatsapp, whatsappDisplay: display };
}

export function waLink(text, number = BRAND.whatsapp) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function cleanUrl(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export function formatAddress(address) {
  const street = [address.line1, address.line2].filter(Boolean).join(', ');
  const place = [address.city, address.state].filter(Boolean).join(', ');
  return { street, place: [place, address.pin].filter(Boolean).join(' ') };
}
