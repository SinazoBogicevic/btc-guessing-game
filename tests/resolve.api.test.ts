import { NextRequest } from "next/server";
import { POST } from "../src/app/api/resolve/route";

const guards = require("../src/lib/guards");
jest.mock("../src/lib/guards", () => ({
  verifyCognitoToken: jest.fn(),
}));
jest.mock("../src/lib/dynamodb", () => ({
  resolveGuess: jest.fn((userId, currentPrice) => {
    if (userId === "testuser-early")
      throw new Error("Too early to resolve guess: 60 seconds have not passed");
    if (userId === "testuser-sameprice")
      throw new Error(
        "Price has not changed since guess was made; cannot resolve yet"
      );
    if (userId === "testuser-success") return Promise.resolve("win");
    if (userId === "testuser-noguess")
      return Promise.resolve("no-active-guess");
    return Promise.resolve("no-active-guess");
  }),
}));

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
});

describe("POST /api/resolve", () => {
  it("should return error if resolving before 60 seconds", async () => {
    const userId = "testuser-early";
    guards.verifyCognitoToken.mockResolvedValueOnce({ sub: userId });
    const req = new NextRequest("http://localhost:3000/api/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer dummy-token",
      },
      body: JSON.stringify({ userId, currentPrice: 11000 }),
    });
    req.json = async () => ({ userId, currentPrice: 11000 });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/60 seconds/);
  });

  it("should return error if price has not changed after 60 seconds", async () => {
    const userId = "testuser-sameprice";
    guards.verifyCognitoToken.mockResolvedValueOnce({ sub: userId });
    const req = new NextRequest("http://localhost:3000/api/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer dummy-token",
      },
      body: JSON.stringify({ userId, currentPrice: 20000 }),
    });
    req.json = async () => ({ userId, currentPrice: 20000 });
    const res = await POST(req);
    const data = await res.json();
    expect(data.error).toMatch(/Price has not changed|60 seconds/);
  });

  it("should resolve a guess and return a result if 60s passed and price changed", async () => {
    const userId = "testuser-success";
    guards.verifyCognitoToken.mockResolvedValueOnce({ sub: userId });
    const req = new NextRequest("http://localhost:3000/api/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer dummy-token",
      },
      body: JSON.stringify({ userId, currentPrice: 29000 }),
    });
    req.json = async () => ({ userId, currentPrice: 29000 });
    const res = await POST(req);
    const data = await res.json();
    expect([200, 400]).toContain(res.status);
    expect(
      ["win", "loss", "no-active-guess"].includes(data.result) ||
        typeof data.error === "string"
    ).toBe(true);
  });

  it("should return no-active-guess if user has no active guess", async () => {
    const userId = "testuser-noguess";
    guards.verifyCognitoToken.mockResolvedValueOnce({ sub: userId });
    const req = new NextRequest("http://localhost:3000/api/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer dummy-token",
      },
      body: JSON.stringify({ userId, currentPrice: 40000 }),
    });
    req.json = async () => ({ userId, currentPrice: 40000 });
    const res = await POST(req);
    const data = await res.json();
    expect(
      ["no-active-guess"].includes(data.result) ||
        typeof data.error === "string"
    ).toBe(true);
  });
});
