import { saveGuess } from "@/lib/dynamodb";
import { verifyCognitoToken } from "@/lib/guards";
import type { JwtPayload } from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  let decoded: JwtPayload | string | undefined;
  try {
    decoded = await verifyCognitoToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await req.json();
  const { userId, guess, priceAtGuess } = body;

  if (
    !userId ||
    typeof decoded !== "object" ||
    !decoded.sub ||
    userId !== decoded.sub
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!guess || typeof priceAtGuess !== "number") {
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
