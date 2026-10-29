import { useEffect } from 'react';

export default function Seo({ title, description, noindex }) {
  useEffect(() => {
    if (title) document.title = title;
    const ensure = (name, attr = 'name') => {
      let el = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      return el;
    };
    if (description) ensure('description').setAttribute('content', description);
    if (noindex) ensure('robots').setAttribute('content', 'noindex,nofollow');
  }, [title, description, noindex]);
  return null;
}
