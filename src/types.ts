export interface UserGameState {
  userId: string;
  score: number;
  activeGuess: "up" | "down" | null;
  guessPlacedAt: string | null;
  priceAtGuess: number | null;
  resolvedAt: string | null;
  lastResult: "win" | "loss" | null;
  createdAt: string;
}
