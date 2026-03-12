# Benzina

A real-time gas station finder for Lebanon. Find the nearest fuel stations, compare prices across brands, and navigate there — all in one app.

## Features

- **Interactive Map** — ~400 stations plotted on a Mapbox map, color-coded by brand (Total, Medco, IPT, Coral, Hypco)
- **Smart Ranking** — stations scored by proximity (50%), fuel match (30%), and open status (20%)
- **Live Fuel Prices** — current prices for gasoline 95, 98, diesel, and LPG in both LBP and USD
- **Search & Filters** — filter by fuel type, brand, radius (1/3/5 km), and search by name
- **Station Details** — fuel availability, pricing, address, and one-tap navigation (Apple Maps / Google Maps)
- **Bilingual** — full English and Arabic support with proper RTL layout
- **Mobile-First UX** — draggable bottom sheet, tap-to-highlight map markers, auto-scroll station list
- **User Location** — pulsing blue dot with locate-me button and radius circle overlay
- **Share Stations** — platform-native sharing with deep links
- **Dark Mode** — full dark theme with system preference detection
- **Admin Panel** — password-protected CRUD for stations and fuel prices
- **OG Image Generation** — dynamic social preview images per station
- **Automated Price Updates** — weekly cron job scrapes latest fuel prices

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript (strict)
- **Database:** Supabase (Postgres + PostGIS)
- **Map:** Mapbox GL JS v3
- **State:** Zustand (filters, map viewport, user preferences)
- **UI:** shadcn/ui + Tailwind CSS 4 + Radix UI
- **i18n:** next-intl (EN + AR)
- **Testing:** Vitest + Testing Library + Playwright
- **Deploy:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with PostGIS enabled
- A [Mapbox](https://mapbox.com) access token

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
ADMIN_PASSWORD=your-admin-password
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=your-cron-secret
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
  app/
    [locale]/            # Pages: home, station detail, prices, settings, admin
    api/                 # REST endpoints: stations, prices, admin, OG images, cron
  components/
    map/                 # Mapbox map with brand-colored markers
    station/             # Station card, list, fuel badges, navigate/share buttons
    filters/             # Filter bar, search input, radius selector
    prices/              # Scrolling price ticker
    layout/              # Header, bottom nav, theme provider
    onboarding/          # First-time welcome modal
    ui/                  # shadcn/ui primitives
  hooks/                 # useGeolocation, useStations
  stores/                # Zustand: filters, map, preferences (persisted)
  lib/                   # Supabase clients, constants, utilities, ranking
  i18n/                  # Routing, request config, locale-aware navigation
  types/                 # Station, Price, Database type definitions
messages/
  en.json                # English translations
  ar.json                # Arabic translations
```

## Deployment

Deploy on [Vercel](https://vercel.com):

1. Import the repo
2. Add environment variables
3. Deploy — the weekly price update cron job is configured in `vercel.json`

## License

MIT
