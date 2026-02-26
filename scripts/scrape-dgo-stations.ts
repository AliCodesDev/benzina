import { chromium } from "playwright";
import * as cheerio from "cheerio";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const DGO_URL = "https://dgo.gov.lb/petrol-station-map/";

// Greater Beirut bounding box
const BEIRUT_BOUNDS = {
  latMin: 33.82,
  latMax: 33.95,
  lngMin: 35.43,
  lngMax: 35.58,
};

interface DgoStation {
  name: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  source: "dgo";
  dgo_id: string;
}

type LocationTuple = [string, number, number, number];

async function fetchWithPlaywright(): Promise<LocationTuple[] | null> {
  console.log("Attempting Playwright approach...");
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(DGO_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    const locations = await page.evaluate(
      () => (window as unknown as { locations: LocationTuple[] }).locations
    );
    await browser.close();
    if (Array.isArray(locations) && locations.length > 0) {
      console.log(`Playwright: found ${locations.length} locations`);
      return locations;
    }
    console.log("Playwright: locations variable was empty or missing");
    return null;
  } catch (err) {
    console.error("Playwright failed:", (err as Error).message);
    return null;
  }
}

async function fetchWithRegex(): Promise<LocationTuple[] | null> {
  console.log("Attempting fetch+regex fallback...");
  try {
    const res = await fetch(DGO_URL);
    const html = await res.text();
    const match = html.match(/var\s+locations\s*=\s*(\[[\s\S]*?\]);\s*$/m);
    if (!match) {
      console.error("Regex fallback: could not find locations array in HTML");
      return null;
    }
    // The JS source uses single-quoted strings — convert to valid JSON
    // Replace single-quoted strings with double-quoted, escaping inner doubles
    let raw = match[1];
    // Strategy: replace the outer single quotes of each string with double quotes
    // The HTML inside uses double quotes for attributes, so we need to escape them
    raw = raw.replace(/'((?:[^'\\]|\\.)*)'/g, (_match, content: string) => {
      const escaped = content.replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    const locations = JSON.parse(raw) as LocationTuple[];
    console.log(`Regex fallback: found ${locations.length} locations`);
    return locations;
  } catch (err) {
    console.error("Regex fallback failed:", (err as Error).message);
    return null;
  }
}

function parseStation(tuple: LocationTuple, index: number): DgoStation | null {
  const [html, lat, lng] = tuple;
  try {
    const $ = cheerio.load(html);
    const name = $("b").first().text().trim();
    if (!name) return null;

    // Phone is typically in the second <p> tag
    const paragraphs = $("p");
    let phone: string | null = null;
    paragraphs.each((_, el) => {
      const text = $(el).text().trim();
      // Match Lebanese phone patterns (e.g. 03-945570, 01/234567, +961...)
      if (/[\d\-\/+]{7,}/.test(text) && !phone) {
        phone = text;
      }
    });

    return {
      name,
      phone,
      latitude: lat,
      longitude: lng,
      source: "dgo",
      dgo_id: `dgo-${index}`,
    };
  } catch {
    console.error(`Failed to parse station at index ${index}`);
    return null;
  }
}

function isInGreaterBeirut(station: DgoStation): boolean {
  return (
    station.latitude >= BEIRUT_BOUNDS.latMin &&
    station.latitude <= BEIRUT_BOUNDS.latMax &&
    station.longitude >= BEIRUT_BOUNDS.lngMin &&
    station.longitude <= BEIRUT_BOUNDS.lngMax
  );
}

async function main() {
  // Try Playwright first, fall back to regex
  let locations = await fetchWithPlaywright();
  if (!locations) {
    locations = await fetchWithRegex();
  }
  if (!locations) {
    console.error("Both approaches failed. Exiting.");
    process.exit(1);
  }

  // Parse all stations
  let errors = 0;
  const allStations: DgoStation[] = [];
  for (let i = 0; i < locations.length; i++) {
    const station = parseStation(locations[i], i);
    if (station) {
      allStations.push(station);
    } else {
      errors++;
    }
  }

  // Filter to Greater Beirut
  const filtered = allStations.filter(isInGreaterBeirut);

  // Write output
  const outDir = join(new URL("..", import.meta.url).pathname, "data");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "dgo-stations-raw.json");
  writeFileSync(outPath, JSON.stringify(filtered, null, 2));

  // Summary
  console.log("\n--- Summary ---");
  console.log(`Total locations from DGO: ${locations.length}`);
  console.log(`Successfully parsed: ${allStations.length}`);
  console.log(`Parse errors: ${errors}`);
  console.log(`Filtered (Greater Beirut): ${filtered.length}`);
  console.log(`Written to: ${outPath}`);
}

main();
