import { getOrCreateUser } from "@/lib/dynamodb";
import { verifyCognitoToken } from "@/lib/guards";
import type { JwtPayload } from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

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

  if (
    !userId ||
    typeof decoded !== "object" ||
    !decoded.sub ||
    userId !== decoded.sub
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const user = await getOrCreateUser(userId);
    return NextResponse.json(user);
  } catch (err) {
    console.error("Error in getOrCreateUser:", err);
    return NextResponse.json(
      { error: "Failed to get/create user" },
      { status: 500 }
    );
  }
}
