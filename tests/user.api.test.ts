import fetch from "node-fetch";

describe("GET /api/user", () => {
  it("should create or return a user", async () => {
    const userId = "testuser123";
    const res = await fetch(`http://localhost:3000/api/user?userId=${userId}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    console.log(data);
    expect(data.userId).toBe(userId);
    expect(typeof data.score).toBe("number");
  });
});
