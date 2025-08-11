// Simple SEO helper to manage title, description, and canonical tag
export interface SEOOptions {
  title: string;
  description?: string;
  canonical?: string;
}

export const applySEO = ({ title, description, canonical }: SEOOptions) => {
  if (title) document.title = title.slice(0, 60);

  if (description) {
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description.slice(0, 160));
  }

  const canonicalUrl = canonical || window.location.href;
  if (canonicalUrl) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);
  }
};
