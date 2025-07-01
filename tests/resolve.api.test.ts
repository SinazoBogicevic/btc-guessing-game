import fetch from "node-fetch";

describe("POST /api/resolve", () => {
  it("should resolve a guess and return a result", async () => {
    const res = await fetch("http://localhost:3000/api/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "testuser123",
        currentPrice: 65500,
      }),
    });
    expect([200, 400]).toContain(res.status);
    const data = await res.json();
    expect(
      data.result === "win" ||
        data.result === "loss" ||
        data.result === "no-active-guess" ||
        typeof data.error === "string"
    ).toBe(true);
  });
});
