import type { MetadataRoute } from 'next'

// App Router robots directive
// Exposes crawl rules, sitemap and host for search engines
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.quizzviz.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
