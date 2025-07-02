import { NextResponse } from "next/server";

let lastGoodPrice: number | null = null;
let lastFetchedAt: number | null = null;
const MIN_FETCH_INTERVAL = 10 * 1000;

export async function GET() {
  const now = Date.now();

  if (!lastFetchedAt || now - lastFetchedAt > MIN_FETCH_INTERVAL) {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok)
        throw new Error(`CoinGecko API error: ${response.status}`);

      const data = await response.json();
      const price = data?.bitcoin?.usd;

      if (typeof price === "number") {
        lastGoodPrice = price;
        lastFetchedAt = now;
        return NextResponse.json({ price });
      } else {
        throw new Error("Invalid price data from CoinGecko");
      }
    } catch (error) {
      console.error("Error fetching BTC price:", error);
    }
  }

  if (lastGoodPrice !== null) {
    return NextResponse.json({
      price: lastGoodPrice,
      cached: true,
      lastFetchedAt,
    });
  }

  return NextResponse.json(
    { error: "Failed to fetch BTC price and no cached value available" },
    { status: 500 }
  );
}
