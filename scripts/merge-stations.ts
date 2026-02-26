import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { haversineMeters } from "./utils/geo.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DgoStation {
  name: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  source: "dgo";
  dgo_id: string;
}

interface OsmStation {
  name: string;
  name_ar: string | null;
  brand: string | null;
  latitude: number;
  longitude: number;
  fuel_types: string[];
  phone: string | null;
  opening_hours: string | null;
  osm_id: number;
  source: "osm";
}

interface MergedStation {
  slug: string;
  name_en: string;
  name_ar: string | null;
  brand: string | null;
  brand_slug: string | null;
  latitude: number;
  longitude: number;
  address_en: string | null;
  address_ar: string | null;
  phone: string | null;
  fuel_types: string[];
  is_24h: boolean;
  status: "active";
  source: "dgo" | "osm" | "dgo+osm";
  dgo_id: string | null;
  osm_id: number | null;
}

// ---------------------------------------------------------------------------
// Brand mapping
// ---------------------------------------------------------------------------

const BRAND_KEYWORDS: [RegExp, string][] = [
  [/\btotalenergies\b/i, "totalenergies"],
  [/\btotal\b/i, "total"],
  [/\bmedco\b/i, "medco"],
  [/\bipt\b/i, "ipt"],
  [/\bcoral\b/i, "coral"],
  [/\bhypco\b/i, "hypco"],
  [/\buniterminals\b/i, "uniterminals"],
  [/\bwardieh\b/i, "wardieh"],
  [/\bapoil\b/i, "apoil"],
];

function inferBrand(name: string, osmBrand: string | null): string | null {
  // Try OSM brand first — normalize to our Brand type values
  if (osmBrand) {
    const lower = osmBrand.toLowerCase();
    for (const [regex, brand] of BRAND_KEYWORDS) {
      if (regex.test(lower)) return brand;
    }
  }
  // Infer from station name
  const lower = name.toLowerCase();
  for (const [regex, brand] of BRAND_KEYWORDS) {
    if (regex.test(lower)) return brand;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Fuel type mapping
// ---------------------------------------------------------------------------

const FUEL_MAP: Record<string, string> = {
  octane_95: "95",
  octane_98: "98",
  diesel: "diesel",
  lpg: "lpg",
};

function mapFuelTypes(osmFuels: string[]): string[] {
  return osmFuels
    .map((f) => FUEL_MAP[f] ?? null)
    .filter((f): f is string => f !== null);
}

// ---------------------------------------------------------------------------
// Slugify
// ---------------------------------------------------------------------------

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const dataDir = join(new URL("..", import.meta.url).pathname, "data");

  // 1. Load
  const dgoStations: DgoStation[] = JSON.parse(
    readFileSync(join(dataDir, "dgo-stations-raw.json"), "utf-8")
  );
  const osmStations: OsmStation[] = JSON.parse(
    readFileSync(join(dataDir, "osm-stations-raw.json"), "utf-8")
  );

  console.log(`Loaded ${dgoStations.length} DGO stations`);
  console.log(`Loaded ${osmStations.length} OSM stations`);

  // 2. Match DGO ↔ OSM by proximity (100m)
  const MATCH_THRESHOLD_M = 100;
  const matchedOsmIndices = new Set<number>();
  const mergedStations: MergedStation[] = [];

  let matchedCount = 0;

  for (const dgo of dgoStations) {
    let bestOsmIdx = -1;
    let bestDist = Infinity;

    for (let i = 0; i < osmStations.length; i++) {
      if (matchedOsmIndices.has(i)) continue;
      const dist = haversineMeters(
        dgo.latitude,
        dgo.longitude,
        osmStations[i].latitude,
        osmStations[i].longitude
      );
      if (dist < bestDist) {
        bestDist = dist;
        bestOsmIdx = i;
      }
    }

    if (bestOsmIdx >= 0 && bestDist <= MATCH_THRESHOLD_M) {
      // 3. Merge matched pair
      const osm = osmStations[bestOsmIdx];
      matchedOsmIndices.add(bestOsmIdx);
      matchedCount++;

      const brand = inferBrand(dgo.name, osm.brand);
      const fuelTypes = mapFuelTypes(osm.fuel_types);

      mergedStations.push({
        slug: "", // assigned later
        name_en: dgo.name,
        name_ar: osm.name_ar,
        brand,
        brand_slug: brand ? slugify(brand) : null,
        latitude: dgo.latitude,
        longitude: dgo.longitude,
        address_en: null,
        address_ar: null,
        phone: dgo.phone || osm.phone,
        fuel_types: fuelTypes.length > 0 ? fuelTypes : ["95", "diesel"],
        is_24h: osm.opening_hours?.includes("24/7") ?? false,
        status: "active",
        source: "dgo+osm",
        dgo_id: dgo.dgo_id,
        osm_id: osm.osm_id,
      });
    } else {
      // DGO-only station
      const brand = inferBrand(dgo.name, null);
      mergedStations.push({
        slug: "",
        name_en: dgo.name,
        name_ar: null,
        brand,
        brand_slug: brand ? slugify(brand) : null,
        latitude: dgo.latitude,
        longitude: dgo.longitude,
        address_en: null,
        address_ar: null,
        phone: dgo.phone,
        fuel_types: ["95", "diesel"],
        is_24h: false,
        status: "active",
        source: "dgo",
        dgo_id: dgo.dgo_id,
        osm_id: null,
      });
    }
  }

  // 4. Add unmatched OSM stations
  let osmOnlyCount = 0;
  for (let i = 0; i < osmStations.length; i++) {
    if (matchedOsmIndices.has(i)) continue;
    osmOnlyCount++;
    const osm = osmStations[i];
    const brand = inferBrand(osm.name, osm.brand);
    const fuelTypes = mapFuelTypes(osm.fuel_types);

    mergedStations.push({
      slug: "",
      name_en: osm.name,
      name_ar: osm.name_ar,
      brand,
      brand_slug: brand ? slugify(brand) : null,
      latitude: osm.latitude,
      longitude: osm.longitude,
      address_en: null,
      address_ar: null,
      phone: osm.phone,
      fuel_types: fuelTypes.length > 0 ? fuelTypes : ["95", "diesel"],
      is_24h: osm.opening_hours?.includes("24/7") ?? false,
      status: "active",
      source: "osm",
      dgo_id: null,
      osm_id: osm.osm_id,
    });
  }

  // 6. Generate slugs with deduplication
  const slugCounts = new Map<string, number>();
  for (const station of mergedStations) {
    const prefix = station.brand_slug || "station";
    const namePart = slugify(station.name_en) || "unknown";
    const base = `${prefix}-${namePart}`;
    const count = (slugCounts.get(base) ?? 0) + 1;
    slugCounts.set(base, count);
    station.slug = count > 1 ? `${base}-${count}` : base;
  }

  // 7. Write output
  mkdirSync(dataDir, { recursive: true });
  const outPath = join(dataDir, "merged-stations.json");
  writeFileSync(outPath, JSON.stringify(mergedStations, null, 2));

  // 8. Summary
  const brandDist = new Map<string, number>();
  for (const s of mergedStations) {
    const key = s.brand ?? "unknown";
    brandDist.set(key, (brandDist.get(key) ?? 0) + 1);
  }

  console.log("\n--- Summary ---");
  console.log(`Total merged: ${mergedStations.length}`);
  console.log(`Matched (DGO+OSM): ${matchedCount}`);
  console.log(`DGO-only: ${dgoStations.length - matchedCount}`);
  console.log(`OSM-only: ${osmOnlyCount}`);
  console.log("\nBrand distribution:");
  const sorted = [...brandDist.entries()].sort((a, b) => b[1] - a[1]);
  for (const [brand, count] of sorted) {
    console.log(`  ${brand}: ${count}`);
  }
  console.log(`\nWritten to: ${outPath}`);
}

main();
