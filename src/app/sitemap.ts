import type { MetadataRoute } from 'next';

import { createServerClient } from '@/lib/supabase/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://benzina.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerClient();

  const { data: stations } = await supabase
    .from('stations')
    .select('slug, updated_at')
    .eq('status', 'active');

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
      alternates: {
        languages: {
          en: BASE_URL,
          ar: `${BASE_URL}/ar`,
        },
      },
    },
    {
      url: `${BASE_URL}/prices`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: {
          en: `${BASE_URL}/prices`,
          ar: `${BASE_URL}/ar/prices`,
        },
      },
    },
    {
      url: `${BASE_URL}/settings`,
      changeFrequency: 'monthly',
      priority: 0.3,
      alternates: {
        languages: {
          en: `${BASE_URL}/settings`,
          ar: `${BASE_URL}/ar/settings`,
        },
      },
    },
  ];

  const stationPages: MetadataRoute.Sitemap = (stations ?? []).map((s) => ({
    url: `${BASE_URL}/station/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
    alternates: {
      languages: {
        en: `${BASE_URL}/station/${s.slug}`,
        ar: `${BASE_URL}/ar/station/${s.slug}`,
      },
    },
  }));

  return [...staticPages, ...stationPages];
}
