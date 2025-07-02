import { resolveGuess } from "@/lib/dynamodb";
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
  const { userId, currentPrice } = body;

  if (
    !userId ||
    typeof decoded !== "object" ||
    !decoded.sub ||
    userId !== decoded.sub
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (typeof currentPrice !== "number") {
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
