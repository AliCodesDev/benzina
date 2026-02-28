import { supabase } from "./utils/supabase-admin.js";

const FUEL_TYPES = ["95", "98", "diesel", "lpg"] as const;
type FuelType = (typeof FUEL_TYPES)[number];

const PRICE_UNITS: Record<FuelType, string> = {
  "95": "20L",
  "98": "20L",
  diesel: "20L",
  lpg: "10kg",
};

interface FuelPrice {
  fuel_type: FuelType;
  price_lbp: number;
  price_unit: string;
  effective_date: string;
  source: string;
}

function parseArgs(): { prices: Map<FuelType, number>; date: string } {
  const args = process.argv.slice(2);
  const prices = new Map<FuelType, number>();
  let date = new Date().toISOString().slice(0, 10);

  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (!match) {
      console.error(`Invalid argument: ${arg}`);
      process.exit(1);
    }

    const [, key, value] = match;

    if (key === "date") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        console.error(`Invalid date format: ${value} (expected YYYY-MM-DD)`);
        process.exit(1);
      }
      date = value;
      continue;
    }

    if (!FUEL_TYPES.includes(key as FuelType)) {
      console.error(`Unknown fuel type: ${key}`);
      console.error(`Valid types: ${FUEL_TYPES.join(", ")}`);
      process.exit(1);
    }

    const price = parseInt(value, 10);
    if (isNaN(price) || price <= 0) {
      console.error(`Invalid price for ${key}: ${value}`);
      process.exit(1);
    }

    prices.set(key as FuelType, price);
  }

  return { prices, date };
}

function printUsage() {
  console.log("Usage:");
  console.log(
    "  npx tsx scripts/scrape-dgo-prices.ts --95=1227000 --98=1288000 --diesel=1070000 --lpg=510000"
  );
  console.log("");
  console.log("Options:");
  console.log("  --95=PRICE       Price of Gasoline 95 in LBP per 20L");
  console.log("  --98=PRICE       Price of Gasoline 98 in LBP per 20L");
  console.log("  --diesel=PRICE   Price of Diesel in LBP per 20L");
  console.log("  --lpg=PRICE      Price of LPG in LBP per 10kg");
  console.log("  --date=YYYY-MM-DD  Effective date (defaults to today)");
}

async function scrapeDgoWebsite(): Promise<Map<FuelType, number> | null> {
  // TODO: Implement DGO website scraping when site is stable
  // The DGO publishes weekly prices at https://dgo.gov.lb
  // Prices may be in HTML tables or embedded PDFs
  console.log("DGO website scraping not yet implemented, using manual input...\n");
  return null;
}

async function main() {
  // Step 1: Try scraping the DGO website
  const scraped = await scrapeDgoWebsite();

  // Step 2: Parse CLI args (or use scraped data)
  const { prices, date } = parseArgs();
  const finalPrices = scraped ?? prices;

  if (finalPrices.size === 0) {
    printUsage();
    process.exit(1);
  }

  console.log(`Effective date: ${date}`);
  console.log(`Fuel prices to insert:\n`);

  // Step 3: Build rows
  const rows: FuelPrice[] = [];
  for (const [fuelType, priceLbp] of finalPrices) {
    rows.push({
      fuel_type: fuelType,
      price_lbp: priceLbp,
      price_unit: PRICE_UNITS[fuelType],
      effective_date: date,
      source: "dgo",
    });
    console.log(
      `  ${fuelType.padEnd(6)} → ${priceLbp.toLocaleString()} LBP / ${PRICE_UNITS[fuelType]}`
    );
  }

  console.log("");

  // Step 4: Upsert into fuel_prices table
  const { data, error } = await supabase
    .from("fuel_prices")
    .upsert(rows, { onConflict: "fuel_type,effective_date" })
    .select();

  if (error) {
    console.error("Failed to upsert fuel prices:", error.message);
    process.exit(1);
  }

  console.log(`Upserted ${data.length} fuel price(s) successfully.`);
}

main();
