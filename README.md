# Benzina

A real-time gas station finder for Lebanon. Find the nearest fuel stations, compare prices across brands, and navigate there — all in one app.

## Features

- **Interactive Map** — ~400 stations plotted on a Mapbox map, color-coded by brand (Total, Medco, IPT, Coral, Hypco)
- **Smart Ranking** — stations sorted by distance, price, or a combined score with configurable radius
- **Live Fuel Prices** — current prices for gasoline 95, gasoline 98, and diesel in both LBP and USD
- **Search & Filters** — filter by fuel type, brand, 24h availability, and search by name
- **Station Details** — detailed view with fuel availability, pricing, address, and one-tap navigation
- **Bilingual** — full English and Arabic support with proper RTL layout
- **Mobile-First UX** — draggable bottom sheet, tap-to-highlight map markers, auto-scroll station list
- **User Location** — pulsing blue dot on the map with locate-me button and radius circle
- **Share Stations** — platform-native sharing with deep links
- **Dark Mode** — full dark theme with system preference detection
- **Admin Panel** — manage stations and update fuel prices
- **OG Image Generation** — dynamic social preview images per station

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict)
- **Database:** Supabase (Postgres + PostGIS)
- **Map:** Mapbox GL JS v3
- **State:** Zustand
- **UI:** shadcn/ui + Tailwind CSS
- **i18n:** next-intl (EN + AR)
- **Icons:** lucide-react

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with PostGIS enabled
- A [Mapbox](https://mapbox.com) access token

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
ADMIN_SECRET=your_admin_secret
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
    [locale]/          # Pages: home, station detail, prices, settings, admin
    api/               # REST endpoints: stations, prices, admin, OG images
  components/
    map/               # Mapbox map, station markers
    station/           # Station card, list, detail, fuel badges
    filters/           # Filter bar, fuel type, radius, search, sort
    prices/            # Price display, dual currency
    layout/            # Header, bottom nav, language switcher
    ui/                # shadcn/ui primitives
  hooks/               # useGeolocation, useStations, useFuelPrices
  stores/              # Zustand: map, filters, preferences
  lib/                 # Supabase clients, constants, utilities, ranking
  i18n/                # Routing, request config, navigation
  types/               # Station, Price type definitions
```

## Deployment

Deploy on [Vercel](https://vercel.com):

1. Import the repo
2. Add environment variables
3. Deploy

## License

MIT
