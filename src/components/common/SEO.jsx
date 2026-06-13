import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEO component for dynamically managing page titles, meta tags, and structured data (JSON-LD).
 * Primary keyword target: "TRIVAB Sports"
 */
export default function SEO({
  title,
  description,
  keywords,
  canonicalPath,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  schema
}) {
  const location = useLocation();
  const currentPath = canonicalPath || location.pathname;
  const siteUrl = 'https://trivabsports.com';

  useEffect(() => {
    // 1. Manage Document Title
    const baseTitle = 'TRIVAB Sports';
    const displayTitle = title ? `${title} | ${baseTitle}` : `${baseTitle} — Premium Cricket & Tournament Management Platform`;
    document.title = displayTitle;

    // Helper function to update or create a meta tag in the head
    const updateMetaTag = (selector, attribute, value) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (selector.startsWith('meta[property=')) {
          const property = selector.match(/property="([^"]+)"/)[1];
          element.setAttribute('property', property);
        } else if (selector.startsWith('meta[name=')) {
          const name = selector.match(/name="([^"]+)"/)[1];
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    // 2. Meta Description
    const defaultDesc = 'TRIVAB Sports is the ultimate leather-ball cricket tournament and match management platform. Explore match schedules, register player profiles, track stats, and experience elite cricket.';
    updateMetaTag('meta[name="description"]', 'content', description || defaultDesc);

    // 3. Meta Keywords
    const defaultKeywords = 'TRIVAB Sports, cricket tournament, tournament management, team management, player registration, sports platform, leather-ball cricket, local cricket league, live cricket match schedule, cricket digital ID, TRIVAB Sports & Events';
    updateMetaTag('meta[name="keywords"]', 'content', keywords || defaultKeywords);

    // 4. Open Graph Tags (for Social sharing)
    updateMetaTag('meta[property="og:title"]', 'content', ogTitle || title || 'TRIVAB Sports — Premium Cricket Management');
    updateMetaTag('meta[property="og:description"]', 'content', ogDescription || description || defaultDesc);
    updateMetaTag('meta[property="og:url"]', 'content', `${siteUrl}${currentPath}`);
    updateMetaTag('meta[property="og:type"]', 'content', ogType);
    updateMetaTag('meta[property="og:image"]', 'content', ogImage || `${siteUrl}/logos/trivabsports.webp`);

    // 5. Twitter Card Tags
    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'content', ogTitle || title || 'TRIVAB Sports — Premium Cricket Management');
    updateMetaTag('meta[name="twitter:description"]', 'content', ogDescription || description || defaultDesc);
    updateMetaTag('meta[name="twitter:image"]', 'content', ogImage || `${siteUrl}/logos/trivabsports.webp`);

    // 6. Canonical Link Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', `${siteUrl}${currentPath}`);

    // 7. Structured Data (JSON-LD Schema)
    let schemaScript = document.getElementById('seo-schema');
    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'seo-schema';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    } else {
      if (schemaScript) {
        schemaScript.remove();
      }
    }
  }, [title, description, keywords, currentPath, ogTitle, ogDescription, ogImage, ogType, schema]);

  return null;
}
