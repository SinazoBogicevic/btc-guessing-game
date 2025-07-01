import { saveGuess } from "@/lib/dynamodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, guess, priceAtGuess } = body;

  if (!userId || !guess || typeof priceAtGuess !== "number") {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    await saveGuess(userId, guess, priceAtGuess);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in saveGuess:", err);
    return NextResponse.json(
      { error: "Failed to save guess" },
      { status: 500 }
    );
  }
}
