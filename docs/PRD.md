# Benzina — Implementation Plan

## Context

Building a cross-brand gas station finder web app for Lebanon as a solo developer + AI-assisted. The PRD describes a 12-month, 3-phase roadmap with a 5-person team, but we're adapting this for a solo dev shipping incrementally. Key deviations from PRD: unified Next.js architecture (no separate FastAPI), Supabase instead of self-managed Postgres, English + Arabic only (French later), Greater Beirut first (~400 stations), no auth/PWA/crowdsourcing in MVP.

**Top concern:** Data quality — the station database must be accurate before anything else matters.

---

## Architecture (Simplified from PRD)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend + Backend | Next.js 14+ (App Router, API Routes) | Single repo, single deployment |
| Database | Supabase (Postgres + PostGIS) | Managed, free tier, spatial queries |
| Maps | Mapbox GL JS v3 | GeoJSON source with data-driven pin styling |
| State | Zustand (3 stores: map, filters, preferences) | Preferences persisted to localStorage |
| UI | shadcn/ui + Tailwind CSS | RTL via CSS logical properties |
| i18n | next-intl | English + Arabic, `[locale]` routing |
| Hosting | Vercel free tier | Upgrade to Pro when monetizing |
| Scraping | Node.js scripts (tsx + cheerio) | Run locally, output JSON, seed Supabase |
| Admin | Password-gated routes within the Next.js app | `ADMIN_PASSWORD` env var |

---

## Database Schema

### Enable PostGIS

```sql
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
```

### `stations` table

```sql
CREATE TABLE public.stations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  name_en         TEXT NOT NULL,
  name_ar         TEXT,
  brand           TEXT,
  brand_slug      TEXT,
  location        extensions.geography(POINT, 4326) NOT NULL,
  address_en      TEXT,
  address_ar      TEXT,
  caza            TEXT,
  city            TEXT,
  phone           TEXT,
  fuel_types      TEXT[] NOT NULL DEFAULT '{}',
  is_24h          BOOLEAN DEFAULT FALSE,
  operating_hours JSONB,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'temporarily_closed')),
  amenities       TEXT[] DEFAULT '{}',
  source          TEXT DEFAULT 'manual',
  dgo_id          TEXT,
  osm_id          BIGINT,
  google_place_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  verified_at     TIMESTAMPTZ,
  is_verified     BOOLEAN DEFAULT FALSE
);

CREATE INDEX stations_location_idx ON public.stations USING GIST (location);
CREATE INDEX stations_brand_idx ON public.stations (brand);
CREATE INDEX stations_slug_idx ON public.stations (slug);
CREATE INDEX stations_fuel_types_idx ON public.stations USING GIN (fuel_types);
```

### `fuel_prices` table

```sql
CREATE TABLE public.fuel_prices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fuel_type       TEXT NOT NULL CHECK (fuel_type IN ('95', '98', 'diesel', 'lpg')),
  price_lbp       INTEGER NOT NULL,
  price_unit      TEXT NOT NULL DEFAULT '20L',
  effective_date  DATE NOT NULL,
  source          TEXT DEFAULT 'dgo',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fuel_type, effective_date)
);
```

### `scrape_logs` table

```sql
CREATE TABLE public.scrape_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scraper_name    TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('success', 'failure', 'partial')),
  records_found   INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message   TEXT,
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `nearby_stations` RPC function

```sql
CREATE OR REPLACE FUNCTION nearby_stations(
  lat FLOAT, lng FLOAT, radius_km FLOAT DEFAULT 5.0,
  fuel_filter TEXT[] DEFAULT NULL, brand_filter TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID, slug TEXT, name_en TEXT, name_ar TEXT, brand TEXT, brand_slug TEXT,
  latitude FLOAT, longitude FLOAT, address_en TEXT, address_ar TEXT, phone TEXT,
  fuel_types TEXT[], amenities TEXT[], is_24h BOOLEAN, status TEXT, distance_meters FLOAT
)
SET search_path = ''
LANGUAGE sql STABLE
AS $$
  SELECT s.id, s.slug, s.name_en, s.name_ar, s.brand, s.brand_slug,
    extensions.st_y(s.location::extensions.geometry) AS latitude,
    extensions.st_x(s.location::extensions.geometry) AS longitude,
    s.address_en, s.address_ar, s.phone, s.fuel_types, s.amenities, s.is_24h, s.status,
    extensions.st_distance(s.location, extensions.st_point(lng, lat)::extensions.geography) AS distance_meters
  FROM public.stations s
  WHERE s.status = 'active'
    AND extensions.st_dwithin(s.location, extensions.st_point(lng, lat)::extensions.geography, radius_km * 1000)
    AND (fuel_filter IS NULL OR s.fuel_types && fuel_filter)
    AND (brand_filter IS NULL OR s.brand = brand_filter)
  ORDER BY s.location OPERATOR(extensions.<->) extensions.st_point(lng, lat)::extensions.geography
  LIMIT result_limit;
$$;
```

### RLS (public read, service role for writes)

```sql
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.stations FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.fuel_prices FOR SELECT USING (true);
```

---

## Project Structure

```
benzina/
├── .env.local / .env.example
├── next.config.ts
├── tailwind.config.ts
├── middleware.ts                     # next-intl locale routing
├── messages/
│   ├── en.json
│   └── ar.json
├── public/brand-logos/               # medco.svg, total.svg, ipt.svg, etc.
├── scripts/                          # Data pipeline (NOT deployed)
│   ├── scrape-dgo-stations.ts
│   ├── scrape-dgo-brands.ts
│   ├── scrape-dgo-prices.ts
│   ├── fetch-osm-stations.ts
│   ├── enrich-google-places.ts
│   ├── merge-stations.ts
│   ├── seed-db.ts
│   └── utils/supabase-admin.ts
├── src/
│   ├── i18n/
│   │   ├── routing.ts               # locales: ['en', 'ar'], default: 'en'
│   │   ├── request.ts
│   │   └── navigation.ts            # Locale-aware Link, useRouter, etc.
│   ├── lib/
│   │   ├── supabase/client.ts       # Browser client
│   │   ├── supabase/server.ts       # Server client
│   │   ├── supabase/types.ts        # Generated DB types
│   │   ├── mapbox.ts
│   │   ├── constants.ts             # Brand colors, fuel types, Beirut coords
│   │   ├── utils.ts
│   │   └── ranking.ts               # Station scoring (proximity + fuel + open)
│   ├── stores/
│   │   ├── use-map-store.ts
│   │   ├── use-filter-store.ts
│   │   └── use-preferences-store.ts # Persisted to localStorage
│   ├── types/station.ts, price.ts
│   ├── hooks/
│   │   ├── use-geolocation.ts
│   │   ├── use-stations.ts
│   │   └── use-fuel-prices.ts
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── layout/header.tsx, bottom-nav.tsx, language-switcher.tsx
│   │   ├── map/station-map.tsx, station-pin.tsx, map-controls.tsx
│   │   ├── station/station-card.tsx, station-list.tsx, station-detail.tsx, navigate-button.tsx, fuel-badge.tsx
│   │   ├── filters/filter-bar.tsx, fuel-type-filter.tsx, radius-filter.tsx, search-input.tsx
│   │   ├── prices/price-display.tsx, dual-currency.tsx
│   │   └── onboarding/welcome-modal.tsx
│   └── app/
│       ├── [locale]/
│       │   ├── layout.tsx           # Root: html lang/dir, fonts, providers
│       │   ├── page.tsx             # Home: map + list + filters
│       │   ├── station/[id]/page.tsx # SSR detail page with OG meta
│       │   ├── prices/page.tsx
│       │   ├── settings/page.tsx
│       │   └── admin/               # Password-gated admin panel
│       │       ├── layout.tsx, page.tsx
│       │       ├── stations/page.tsx, [id]/page.tsx
│       │       └── prices/page.tsx
│       └── api/
│           ├── stations/route.ts, [id]/route.ts
│           ├── prices/route.ts
│           ├── admin/stations/route.ts, [id]/route.ts
│           ├── admin/prices/route.ts
│           ├── admin/auth/route.ts
│           └── og/route.tsx         # Dynamic OG images
```

---

## Data Pipeline

The DGO website (`dgo.gov.lb/petrol-station-map/`) embeds a JavaScript `locations` array in the HTML with station names, phone numbers, and coordinates. This is the primary data source.

### Pipeline steps (run locally via `npx tsx scripts/...`)

| Step | Script | Input | Output |
|------|--------|-------|--------|
| 1 | `scrape-dgo-stations.ts` | DGO map page HTML | `data/dgo-stations-raw.json` |
| 2 | `scrape-dgo-brands.ts` | DGO brand pages | `data/dgo-brands-raw.json` |
| 3 | `fetch-osm-stations.ts` | Overpass API | `data/osm-stations-raw.json` |
| 4 | `enrich-google-places.ts` | Google Places API | `data/google-places-raw.json` |
| 5 | `merge-stations.ts` | All JSON files above | `data/merged-stations.json` |
| 6 | `seed-db.ts` | merged JSON | Supabase DB populated |
| 7 | `scrape-dgo-prices.ts` | DGO prices page/PDF | `fuel_prices` table |

**Merge strategy:** DGO is canonical list. Match to OSM by coordinates (within 100m). Enrich with Google Places for missing addresses/hours. Infer brand from station name. Default fuel types to `['95', 'diesel']` if unknown. Generate slugs like `medco-hamra-123`.

**DGO uncertainty:** Prices page may require headless browser (Playwright) if rendered client-side. If DGO format changes, fall back to manual entry via admin panel.

---

## API Routes

### Public

- `GET /api/stations` — List + filter + rank. Params: `lat`, `lng`, `radius`, `fuel`, `brand`, `q`, `sort`, `limit`. Calls `nearby_stations` RPC.
- `GET /api/stations/[id]` — Single station by slug or UUID.
- `GET /api/prices` — Current fuel prices (latest per fuel type).
- `GET /api/og?slug=...` — Dynamic OG image via `next/og` ImageResponse.

### Admin (verified via `x-admin-password` header)

- `POST /api/admin/auth` — Verify password.
- `GET/POST /api/admin/stations` — List all / create station.
- `PUT/DELETE /api/admin/stations/[id]` — Update / soft-delete station.
- `POST /api/admin/prices` — Add fuel price entry.

---

## i18n + RTL Strategy

- **Routing:** `next-intl` with `localePrefix: 'as-needed'`. English: `/station/...`, Arabic: `/ar/station/...`
- **Middleware:** Excludes `/api` routes from locale prefixing.
- **Layout:** `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>`.
- **Fonts:** Inter (English), IBM Plex Sans Arabic (Arabic) via `next/font/google`.
- **Tailwind RTL:** Use CSS logical properties throughout (`ms-4`, `me-4`, `ps-4`, `pe-4`, `start-0`, `end-0`, `text-start`, `text-end`, `rounded-s-lg`, `rounded-e-lg`).
- **Translation files:** `messages/en.json` and `messages/ar.json` with namespaced keys.
- **Station names:** Show `name_ar` in Arabic locale (fallback to `name_en`), `name_en` in English.

---

## Incremental Milestones

### Milestone 0: Project Scaffolding (Days 1-3)

**Deploy:** Empty Next.js app with i18n routing and RTL switching working on Vercel.

- `create-next-app` + install deps + shadcn/ui init
- Supabase project setup + PostGIS + run schema SQL
- next-intl setup: routing, middleware, `[locale]` layout, translation files
- Minimal page showing "Benzina" with language switcher
- Deploy to Vercel

**Verify:** `/` shows English, `/ar` shows Arabic RTL, Supabase has empty tables with PostGIS.

### Milestone 1: Data Pipeline + Seed Database (Days 4-10)

**Deploy:** Database populated with ~400 Greater Beirut stations.

- Write all 7 scraping/merge/seed scripts
- Run full pipeline, review data, iterate
- Scrape current fuel prices

**Verify:** `stations` table has 350-450 rows. `SELECT * FROM nearby_stations(33.8938, 35.5018, 5.0)` returns results.

### Milestone 2: Station Map + List View (Days 11-20)

**Deploy:** Core station finder — map with pins, list view, fuel type and radius filters.

- `GET /api/stations` route
- Geolocation hook (Beirut fallback)
- Mapbox map with GeoJSON source + brand-colored pins
- Station cards + list view
- Filter bar (fuel type, radius)
- Map/list toggle, bottom nav, header
- Zustand stores wired up

**Verify:** Open on mobile — see map with pins. Filter by diesel — list updates. Switch to Arabic — RTL layout.

### Milestone 3: Station Detail + Navigate + Share (Days 21-27)

**Deploy:** Shareable station pages with rich WhatsApp previews, navigate to Google Maps.

- `GET /api/stations/[id]` route
- SSR station detail page with `generateMetadata` for OG tags
- Dynamic OG image generation (`/api/og`)
- Navigate button (opens Google Maps)
- Share button (Web Share API / copy URL)
- Click-to-call phone number

**Verify:** Share `/station/medco-hamra-1` on WhatsApp — rich preview with image. Tap "Navigate" — Google Maps opens.

### Milestone 4: Fuel Prices + Search (Days 28-34)

**Deploy:** Prices page with dual currency, text search for stations.

- `GET /api/prices` route
- Prices page (2x2 grid, LBP + USD, last updated)
- Price ticker in header
- Text search with Postgres full-text search
- Search autocomplete

**Verify:** `/prices` shows current prices. Search "MEDCO" returns MEDCO stations. Search "ميدكو" works in Arabic.

### Milestone 5: Onboarding + Settings + Polish (Days 35-42)

**Deploy:** Soft-launch-ready app with onboarding, settings, dark mode, performance.

- Welcome modal (language + location + fuel pref)
- Settings page (language, currency, fuel pref)
- Dark mode (system detect + manual toggle, Mapbox dark style)
- Performance optimization (lazy-load map, loading skeletons)
- Error boundaries, empty states
- Mobile responsive polish
- SEO (sitemap, robots.txt)

**Verify:** First visit shows modal. Settings persist. Dark mode works. Lighthouse Performance > 85.

### Milestone 6: Admin Panel (Days 43-49)

**Deploy:** Admin interface for data corrections and price updates.

- Password gate (session-based)
- Station list table with search/filter/pagination
- Station edit form with Mapbox map picker for location
- Add station form
- Price management (add/edit)
- Scrape log viewer

**Verify:** Edit a station name in admin — change appears on public site. Add new price — appears on prices page.

### Milestone 7: Ranking + Final Polish (Days 50-56)

**Deploy:** Public launch version with smart ranking.

- Ranking algorithm: proximity (0.50) + fuel type match (0.30) + open status (0.20)
- Sort options in list view
- Radius circle on map
- Empty state handling + "expand search" prompt
- Final cross-browser testing
- Custom domain setup

**Verify:** List view shows ranked results (not just distance). All features work in both languages. WhatsApp sharing works.

---

## Key Packages

```
next, react, react-dom, typescript
next-intl                    # i18n + locale routing
zustand                      # State management
@supabase/supabase-js        # Supabase client
@supabase/ssr                # Supabase + Next.js App Router
mapbox-gl                    # Map (no React wrapper needed)
tailwindcss                  # Styling + RTL via logical properties
lucide-react                 # Icons
class-variance-authority, clsx, tailwind-merge  # shadcn/ui utilities
@radix-ui/react-dialog, -select, -tabs, -toggle, -tooltip  # shadcn/ui primitives

# Dev only:
tsx                          # Run TS scripts directly
cheerio                      # HTML parsing for scrapers
supabase                     # CLI for type generation
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...       # Server-side only
NEXT_PUBLIC_MAPBOX_TOKEN=...
GOOGLE_PLACES_API_KEY=...           # Scripts only
ADMIN_PASSWORD=...                   # Admin panel gate
NEXT_PUBLIC_SITE_URL=...
```

---

## Testing Strategy

Each feature has tests that MUST pass before moving to the next feature. Using Vitest for unit/integration tests and Playwright for E2E.

### Feature Test Gates

- **F0 (Scaffold):** i18n routing works, RTL direction correct, Supabase connection verified
- **F1 (Data Pipeline):** Scripts produce valid JSON, seed inserts correct row count, nearby_stations RPC returns results
- **F2 (Map + List):** API returns stations, map renders, list renders, filters work
- **F3 (Station Detail):** Detail page renders, OG meta correct, navigate URL correct, share works
- **F4 (Prices + Search):** Prices API returns data, prices page renders, search returns results
- **F5 (Onboarding + Settings):** Modal shows on first visit, settings persist, dark mode toggles
- **F6 (Admin):** Auth gate works, CRUD operations succeed, changes reflect publicly
- **F7 (Ranking + Polish):** Ranking order correct, empty states render, Lighthouse scores pass

## Progress Tracking

All progress is logged to `progress.txt` at project root. Updated after each feature completion.

---

## Verification Checklist (End-to-End)

- [ ] App loads at Vercel URL in English and Arabic (RTL)
- [ ] Map shows ~400 station pins in Greater Beirut area
- [ ] Pins are color-coded by brand
- [ ] Clicking a pin shows station info
- [ ] List view shows stations sorted by distance from user
- [ ] Fuel type filter works (e.g., "Diesel" hides non-diesel stations)
- [ ] Radius filter works (1/3/5/10/25 km)
- [ ] Station detail page loads via `/station/{slug}`
- [ ] Station detail page has correct OG meta tags (test with WhatsApp)
- [ ] "Navigate" opens Google Maps with correct destination
- [ ] Fuel prices page shows current DGO prices in LBP + USD
- [ ] Text search finds stations by name and brand
- [ ] First-visit modal appears with language/location/fuel selection
- [ ] Settings page persists preferences across sessions
- [ ] Dark mode works (including Mapbox dark style)
- [ ] Admin panel accessible with correct password
- [ ] Admin can edit station data and changes appear publicly
- [ ] Admin can add/update fuel prices
- [ ] Lighthouse Performance > 85, Accessibility > 90
- [ ] No console errors on iPhone Safari or Android Chrome
