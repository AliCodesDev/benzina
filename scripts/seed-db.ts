import { readFileSync } from "fs";
import { join } from "path";
import { supabase } from "./utils/supabase-admin.js";

const BATCH_SIZE = 50;

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
  status: string;
  source: string;
  dgo_id: string | null;
  osm_id: number | null;
}

function toRow(station: MergedStation) {
  return {
    slug: station.slug,
    name_en: station.name_en,
    name_ar: station.name_ar,
    brand: station.brand,
    brand_slug: station.brand_slug,
    location: `SRID=4326;POINT(${station.longitude} ${station.latitude})`,
    address_en: station.address_en,
    address_ar: station.address_ar,
    phone: station.phone,
    fuel_types: station.fuel_types,
    is_24h: station.is_24h,
    status: station.status,
    source: station.source,
    dgo_id: station.dgo_id,
    osm_id: station.osm_id,
  };
}

async function main() {
  const dataDir = join(new URL("..", import.meta.url).pathname, "data");
  const stations: MergedStation[] = JSON.parse(
    readFileSync(join(dataDir, "merged-stations.json"), "utf-8")
  );
  console.log(`Loaded ${stations.length} stations from merged-stations.json`);

  let inserted = 0;
  let failures = 0;

  for (let i = 0; i < stations.length; i += BATCH_SIZE) {
    const batch = stations.slice(i, i + BATCH_SIZE);
    const rows = batch.map(toRow);

    const { error } = await supabase
      .from("stations")
      .upsert(rows, { onConflict: "slug" });

    if (error) {
      console.error(`Batch ${i}-${i + batch.length} failed:`, error.message);
      failures += batch.length;
    } else {
      inserted += batch.length;
    }

    console.log(`Processed ${Math.min(i + BATCH_SIZE, stations.length)}/${stations.length} stations...`);
  }

  console.log("\n--- Summary ---");
  console.log(`Total processed: ${stations.length}`);
  console.log(`Inserted/updated: ${inserted}`);
  console.log(`Failures: ${failures}`);
}

main();
