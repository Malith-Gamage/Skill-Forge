import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/dashboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/roadmap/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/community/feed`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/expert`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ]
}
