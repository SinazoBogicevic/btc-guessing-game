"use client";
import { UserGameState } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/Auth";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { user, loading, handleSignOut } = useAuth();
  const router = useRouter();
  const [userState, setUserState] = useState<UserGameState | null>(null);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(60);
  const [timerActive, setTimerActive] = useState(false);
  const [result, setResult] = useState<"win" | "loss" | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.username) {
      fetch(`/api/user?userId=${user.username}`)
        .then((res) => res.json())
        .then((data) => {
          setUserState(data);
        })
        .catch((err) => {
          console.error("Failed to ensure user in DB:", err);
        });
    }
  }, [user, loading, router]);

  const fetchBTC = async () => {
    try {
      const res = await fetch("/api/btc-price");
      const { price } = await res.json();
      setBtcPrice(price);
    } catch (err) {
      console.error("Failed to fetch BTC price", err);
    }
  };

  useEffect(() => {
    fetchBTC();
    const interval = setInterval(fetchBTC, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleGuess = async (direction: "up" | "down") => {
    if (!user?.username || !btcPrice) return;
    await fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.username,
        guess: direction,
        priceAtGuess: btcPrice,
      }),
    });
    setTimerActive(true);
    setCountdown(60);
    setResult(null);
    setUserState((prev) =>
      prev ? { ...prev, activeGuess: direction, priceAtGuess: btcPrice } : null
    );
  };

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          resolveUserGuess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive]);

  const resolveUserGuess = async () => {
    if (!user?.username) return;
    await fetchBTC();
    if (!btcPrice) return;
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.username, currentPrice: btcPrice }),
      });
      const { result } = await res.json();
      setResult(result);

      const updated = await fetch(`/api/user?userId=${user.username}`);
      const updatedUser = await updated.json();
      setUserState(updatedUser);
    } catch (err) {
      console.error("Failed to resolve guess", err);
    } finally {
      setTimerActive(false);
    }
  };

  if (!userState || btcPrice === null)
    return <div className={styles.loading}>Loading...</div>;

  const handleLogout = async () => {
    await handleSignOut();
    router.replace("/login");
  };

  return (
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Welcome to the BTC Guessing Game</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
      <div className={styles.price}>
        Current BTC Price:{" "}
        {typeof btcPrice === "number"
          ? `$${btcPrice.toFixed(2)}`
          : "Loading..."}
      </div>
      <div className={styles.score}>Your Score: {userState.score}</div>
      {userState.activeGuess && timerActive && (
        <div className={styles.timer}>
          ⏳ You guessed &quot;{userState.activeGuess}&quot; — resolving in{" "}
          {countdown}s...
        </div>
      )}
      {!userState.activeGuess && (
        <div className={styles.guessButtons}>
          <button onClick={() => handleGuess("up")} className={styles.guessUp}>
            Guess Up 📈
          </button>
          <button
            onClick={() => handleGuess("down")}
            className={styles.guessDown}
          >
            Guess Down 📉
          </button>
        </div>
      )}
      {result && (
        <div
          className={result === "win" ? styles.resultWin : styles.resultLoss}
        >
          You {result === "win" ? "won!" : "lost."}
        </div>
      )}
    </main>
  );
}
