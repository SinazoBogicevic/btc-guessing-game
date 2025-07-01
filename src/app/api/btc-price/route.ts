import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data?.bitcoin?.usd;
    if (typeof price !== "number") {
      throw new Error("Invalid price data from CoinGecko");
    }
    return NextResponse.json({ price });
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    return NextResponse.json(
      { error: "Failed to fetch BTC price" },
      { status: 500 }
    );
  }
}
