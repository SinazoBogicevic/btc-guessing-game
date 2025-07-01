import fetch from "node-fetch";

describe("POST /api/guess", () => {
  it("should save a guess", async () => {
    const res = await fetch("http://localhost:3000/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "testuser123",
        guess: "up",
        priceAtGuess: 65000,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
