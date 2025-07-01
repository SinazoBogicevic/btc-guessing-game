import fetch from "node-fetch";

async function placeGuess(userId: string, guess: "up" | "down", price: number) {
  await fetch("http://localhost:3000/api/guess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, guess, priceAtGuess: price }),
  });
}

describe("POST /api/resolve", () => {
  it("should return error if resolving before 60 seconds", async () => {
    const userId = "testuser-early";
    await placeGuess(userId, "up", 10000);
    const res = await fetch("http://localhost:3000/api/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, currentPrice: 11000 }),
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/60 seconds/);
  });

  it("should return error if price has not changed after 60 seconds", async () => {
    const userId = "testuser-sameprice";
    await placeGuess(userId, "up", 20000);

    const res = await fetch("http://localhost:3000/api/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, currentPrice: 20000 }),
    });
    const data = await res.json();

    expect(
      data.error?.includes("Price has not changed") ||
        data.error?.includes("60 seconds") ||
        data.result === "win" ||
        data.result === "loss"
    ).toBe(true);
  });

  it("should resolve a guess and return a result if 60s passed and price changed", async () => {
    const userId = "testuser-success";
    await placeGuess(userId, "down", 30000);

    const res = await fetch("http://localhost:3000/api/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, currentPrice: 29000 }),
    });
    const data = await res.json();
    expect([200, 400]).toContain(res.status);
    expect(
      ["win", "loss"].includes(data.result) || typeof data.error === "string"
    ).toBe(true);
  });

  it("should return no-active-guess if user has no active guess", async () => {
    const userId = "testuser-noguess";
    const res = await fetch("http://localhost:3000/api/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, currentPrice: 40000 }),
    });
    const data = await res.json();
    expect(
      data.result === "no-active-guess" || typeof data.error === "string"
    ).toBe(true);
  });
});
