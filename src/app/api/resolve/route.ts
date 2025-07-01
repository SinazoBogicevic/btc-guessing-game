import { resolveGuess } from "@/lib/dynamodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, currentPrice } = body;

  if (!userId || typeof currentPrice !== "number") {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const result = await resolveGuess(userId, currentPrice);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("Error in resolveGuess:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
