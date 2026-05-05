import { useEffect } from 'react';

/**
 * Per-page SEO meta tag updates. Call from any route component:
 *
 *   useSEO({
 *     title: 'Pricing — Kitabi AI Writer',
 *     description: 'Free tier and Author plan ($25/mo). 25 chapters/month...',
 *     canonical: 'https://kitabi.ink/pricing',
 *   });
 *
 * Why a hook (not react-helmet): no extra dependency, no provider
 * wrapping, runs in useEffect after route mount, restores nothing on
 * unmount (the next route's hook overwrites — last write wins).
 *
 * Supports: title, description, canonical, og:title, og:description,
 * og:image, twitter:title, twitter:description, twitter:image, robots.
 */
export function useSEO({
  title,
  description,
  canonical,
  image,
  noindex = false,
} = {}) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (title) document.title = title;

    // Helper: upsert a <meta> tag by attribute key (name= or property=)
    const upsertMeta = (key, value, attr = 'name') => {
      if (value == null) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    if (description) {
      upsertMeta('description', description);
      upsertMeta('og:description', description, 'property');
      upsertMeta('twitter:description', description);
    }
    if (title) {
      upsertMeta('og:title', title, 'property');
      upsertMeta('twitter:title', title);
    }
    if (image) {
      upsertMeta('og:image', image, 'property');
      upsertMeta('twitter:image', image);
    }

    upsertMeta(
      'robots',
      noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'
    );

    // Canonical URL — only one allowed per page.
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
      upsertMeta('og:url', canonical, 'property');
    }
  }, [title, description, canonical, image, noindex]);
}

/**
 * Inject a JSON-LD structured-data script for the current page.
 * Removes itself on unmount so different pages can have different schemas.
 */
export function useJsonLd(data) {
  useEffect(() => {
    if (typeof document === 'undefined' || !data) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.dynamic = 'true';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [data]);
}
