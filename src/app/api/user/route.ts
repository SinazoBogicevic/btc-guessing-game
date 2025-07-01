import { getOrCreateUser } from "@/lib/dynamodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
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
