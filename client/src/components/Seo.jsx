import { useEffect } from 'react';

const SITE_NAME = 'ФК «ХІТ» Shop';
const DEFAULT_DESCRIPTION =
  'Офіційний магазин ФК ХІТ — ігрова форма, тренувальний одяг та клубна атрибутика. Доставка Новою Поштою по Україні.';

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Updates document title and meta description for SPA routes.
 * @param {{ title?: string, description?: string, noindex?: boolean, path?: string, image?: string }} props
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  noindex = false,
  path,
  image,
}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Офіційний магазин`;
    document.title = fullTitle;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);

    const origin = import.meta.env.VITE_SITE_URL || window.location.origin;
    const canonicalPath = path ?? `${window.location.pathname}${window.location.search}`;
    const url = `${origin.replace(/\/$/, '')}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
    upsertLink('canonical', url);
    upsertMeta('property', 'og:url', url);

    const ogImage = image
      ? (image.startsWith('http') ? image : `${origin.replace(/\/$/, '')}${image.startsWith('/') ? image : `/${image}`}`)
      : `${origin.replace(/\/$/, '')}/hit-logo.png`;
    upsertMeta('property', 'og:image', ogImage);
  }, [title, description, noindex, path, image]);

  return null;
}

export { SITE_NAME, DEFAULT_DESCRIPTION };
