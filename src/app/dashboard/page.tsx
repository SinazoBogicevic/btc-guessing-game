"use client";
import { UserGameState } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/Auth";
import styles from "./dashboard.module.css";

function timeAgo(dateString: string | null) {
  if (!dateString) return "";
  const now = new Date();
  const placed = new Date(dateString);
  const diffMs = now.getTime() - placed.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minutes ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hours ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} days ago`;
}

export default function DashboardPage() {
  const { user, loading, handleSignOut } = useAuth();
  const router = useRouter();
  const [userState, setUserState] = useState<UserGameState | null>(null);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [result, setResult] = useState<"win" | "loss" | null>(null);
  const [isResolving, setIsResolving] = useState(false);

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
    setResult(null);
    setUserState((prev) =>
      prev ? { ...prev, activeGuess: direction, priceAtGuess: btcPrice } : null
    );
  };

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
    }
  };

  useEffect(() => {
    if (
      !userState ||
      !userState.activeGuess ||
      !userState.guessPlacedAt ||
      result ||
      isResolving
    )
      return;
    const interval = setInterval(() => {
      const placed = new Date(userState.guessPlacedAt!);
      const now = new Date();
      const diffSec = (now.getTime() - placed.getTime()) / 1000;
      if (diffSec >= 60) {
        setIsResolving(true);
        resolveUserGuess().finally(() => setIsResolving(false));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [userState, result, isResolving, resolveUserGuess]);

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
      {userState.activeGuess && (
        <div className={styles.timer}>
          ⏳ You guessed &quot;{userState.activeGuess}&quot; :{" "}
          {timeAgo(userState.guessPlacedAt)}
        </div>
      )}
      <div className={styles.guessButtons}>
        <button
          onClick={() => handleGuess("up")}
          className={styles.guessUp}
          disabled={!!userState.activeGuess}
        >
          Guess Up 📈
        </button>
        <button
          onClick={() => handleGuess("down")}
          className={styles.guessDown}
          disabled={!!userState.activeGuess}
        >
          Guess Down 📉
        </button>
      </div>
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
