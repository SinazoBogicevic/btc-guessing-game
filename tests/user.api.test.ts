import { NextRequest } from "next/server";
import { GET } from "../src/app/api/user/route";

jest.mock("../src/lib/guards", () => ({
  verifyCognitoToken: jest.fn(() => Promise.resolve({ sub: "testuser123" })),
}));
jest.mock("../src/lib/dynamodb", () => ({
  getOrCreateUser: jest.fn((userId) => Promise.resolve({ userId, score: 0 })),
}));

describe("GET /api/user", () => {
  it("should create or return a user", async () => {
    const userId = "testuser123";
    const url = `http://localhost:3000/api/user?userId=${userId}`;
    const req = new NextRequest(url, {
      method: "GET",
      headers: { authorization: "Bearer dummy-token" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userId).toBe(userId);
    expect(typeof data.score).toBe("number");
  });
});
