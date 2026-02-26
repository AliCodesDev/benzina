import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OVERPASS_QUERY = `[out:json][timeout:60];
node["amenity"="fuel"](33.82,35.43,33.95,35.58);
out body;`;

const FUEL_KEYS = [
  "fuel:octane_95",
  "fuel:octane_98",
  "fuel:diesel",
  "fuel:lpg",
] as const;

interface OsmNode {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
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

function transformNode(node: OsmNode): OsmStation {
  const tags = node.tags ?? {};

  const fuel_types = FUEL_KEYS.filter((key) => tags[key] === "yes").map(
    (key) => key.replace("fuel:", "")
  );

  return {
    name: tags.name || tags["name:en"] || "Unknown Station",
    name_ar: tags["name:ar"] || null,
    brand: tags.brand || tags.operator || null,
    latitude: node.lat,
    longitude: node.lon,
    fuel_types,
    phone: tags.phone || tags["contact:phone"] || null,
    opening_hours: tags.opening_hours || null,
    osm_id: node.id,
    source: "osm",
  };
}

async function main() {
  console.log("Fetching gas stations from Overpass API...");

  let data: { elements: OsmNode[] };
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    data = (await res.json()) as { elements: OsmNode[] };
  } catch (err) {
    console.error("Failed to fetch from Overpass API:", (err as Error).message);
    process.exit(1);
  }

  const nodes = data.elements.filter(
    (el: OsmNode & { type?: string }) => el.type === "node" || el.lat != null
  );
  const stations = nodes.map(transformNode);

  // Write output
  const outDir = join(new URL("..", import.meta.url).pathname, "data");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "osm-stations-raw.json");
  writeFileSync(outPath, JSON.stringify(stations, null, 2));

  // Summary
  const withBrand = stations.filter((s) => s.brand !== null).length;
  const withFuel = stations.filter((s) => s.fuel_types.length > 0).length;

  console.log("\n--- Summary ---");
  console.log(`Total stations found: ${stations.length}`);
  console.log(`With brand info: ${withBrand}`);
  console.log(`With fuel type info: ${withFuel}`);
  console.log(`Written to: ${outPath}`);
}

main();
