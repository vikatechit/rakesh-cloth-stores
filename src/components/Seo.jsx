import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BRAND } from '../data/brand';

function ensure(name, attr = 'name') {
  let el = document.head.querySelector(`${attr === 'property' ? 'meta[property' : 'meta[name'}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  return el;
}

function ensureLink(rel) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  return el;
}

export default function Seo({ title, description, noindex }) {
  const { pathname } = useLocation();
  const url = `${BRAND.siteUrl}${pathname === '/' ? '/' : pathname}`;

  useEffect(() => {
    if (title) document.title = title;
    if (description) ensure('description').setAttribute('content', description);
    ensure('robots').setAttribute('content', noindex ? 'noindex,nofollow' : 'index,follow');
    ensureLink('canonical').setAttribute('href', url);
    ensure('og:title', 'property').setAttribute('content', title || BRAND.name);
    ensure('og:description', 'property').setAttribute('content', description || '');
    ensure('og:url', 'property').setAttribute('content', url);
    ensure('og:type', 'property').setAttribute('content', 'website');
    ensure('og:image', 'property').setAttribute('content', `${BRAND.siteUrl}${BRAND.logo}`);
  }, [title, description, noindex, url]);
  return null;
}
