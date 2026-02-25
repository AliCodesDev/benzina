# CLAUDE.md — Benzina Project Instructions

## What is this project?

Benzina is a cross-brand gas station finder web app for Lebanon.
It shows ~400 gas stations on a map with filters, search, fuel prices,
and station detail pages. English + Arabic with RTL support.

## Tech Stack (do NOT deviate)

- Next.js 14+ with App Router (NOT Pages Router)
- TypeScript in strict mode
- Supabase (Postgres + PostGIS) via @supabase/ssr for server, @supabase/supabase-js for client
- Mapbox GL JS v3 — use vanilla mapbox-gl with useRef, NOT react-map-gl
- Zustand for client state (3 stores: map, filters, preferences)
- shadcn/ui components + Tailwind CSS
- next-intl for i18n (English + Arabic)
- lucide-react for icons

## Critical Conventions

- ALL styling uses CSS logical properties for RTL support:
  Use: ms-4, me-4, ps-4, pe-4, start-0, end-0, text-start, text-end, rounded-s-lg, rounded-e-lg
  NEVER use: ml-4, mr-4, pl-4, pr-4, left-0, right-0, text-left, text-right, rounded-l-lg, rounded-r-lg
- Components are Server Components by default. Only add "use client" when the component needs:
  browser APIs, event handlers (onClick etc), hooks (useState, useEffect etc), or Zustand stores
- All API routes return typed JSON responses with proper status codes
- Every async operation has try/catch error handling
- No `any` types. Define proper types for everything.
- Named exports for components and utilities. Default exports only for page.tsx and layout.tsx.
- Imports use the @/ alias: `import { Button } from "@/components/ui/button"`

## File Organization

src/
  components/
    ui/              → shadcn/ui components (auto-generated)
    layout/          → header, bottom-nav, language-switcher
    map/             → station-map, station-pin, map-controls
    station/         → station-card, station-list, station-detail, fuel-badge, navigate-button
    filters/         → filter-bar, fuel-type-filter, radius-filter, search-input
    prices/          → price-display, dual-currency
    onboarding/      → welcome-modal
  hooks/             → use-geolocation, use-stations, use-fuel-prices
  stores/            → use-map-store, use-filter-store, use-preferences-store
  types/             → station.ts, price.ts
  lib/               → supabase/client.ts, supabase/server.ts, constants.ts, utils.ts, ranking.ts
  i18n/              → routing.ts, request.ts, navigation.ts
  app/
    [locale]/        → layout.tsx, page.tsx, station/[id]/page.tsx, prices/page.tsx, settings/page.tsx
    api/             → stations/route.ts, prices/route.ts, admin/...

## Component Size Rules

- No component file over 150 lines. If it's bigger, split it.
- No function over 40 lines. Extract helpers.
- Each component does ONE thing.

## Error Handling Pattern

Every data-fetching component needs 3 states:

1. Loading — show a skeleton/spinner
2. Error — show an error message with retry option
3. Empty — show a helpful empty state ("No stations found. Try expanding your search.")

## Testing

- Test files live next to source: component.tsx → component.test.tsx
- Use Vitest + React Testing Library
- Every API route needs at least 1 happy-path test and 1 error test

## Common Mistakes to AVOID

- Do NOT use react-map-gl. Use vanilla mapbox-gl.
- Do NOT use next/navigation useRouter in Server Components.
- Do NOT hardcode the LBP/USD exchange rate. Use a constant in lib/constants.ts.
- Do NOT put Mapbox/Supabase tokens directly in components. Import from lib/ or env vars.
- Do NOT use margin-left, margin-right, padding-left, padding-right, left, right, text-left, text-right anywhere. Use logical properties.
- Do NOT create components with default exports (except page.tsx and layout.tsx).
- When using next-intl, always use the useTranslations() hook. Never hardcode user-facing strings.
