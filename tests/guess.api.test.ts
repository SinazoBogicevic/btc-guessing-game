import { NextRequest } from "next/server";
import { POST } from "../src/app/api/guess/route";

jest.mock("../src/lib/guards", () => ({
  verifyCognitoToken: jest.fn(() => Promise.resolve({ sub: "testuser123" })),
}));
jest.mock("../src/lib/dynamodb", () => ({
  saveGuess: jest.fn(() => Promise.resolve()),
}));

describe("POST /api/guess", () => {
  it("should save a guess", async () => {
    const req = new NextRequest("http://localhost:3000/api/guess", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer dummy-token",
      },
      body: JSON.stringify({
        userId: "testuser123",
        guess: "up",
        priceAtGuess: 65000,
      }),
    });
    req.json = async () => ({
      userId: "testuser123",
      guess: "up",
      priceAtGuess: 65000,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
