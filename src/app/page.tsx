"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./hooks/Auth";
import styles from "./page.module.css";

export default function Home() {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  const handleStart = async () => {
    if (user) {
      console.log("clicked");
      console.log(user);
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/btc-price");
        if (!res.ok) {
          throw new Error("Failed to fetch price");
        }
        const data = await res.json();
        setPrice(data.bitcoin.usd);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch BTC price:", err);
        setError("Failed to load BTC price");
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>BTC Guessing Game</h1>

        {error ? (
          <p className={styles.error}>{error}</p>
        ) : (
          <p>
            {loading
              ? "Loading BTC price..."
              : `BTC/USD: $${price?.toFixed(2)}`}
          </p>
        )}

        <button onClick={handleStart}>Start Playing →</button>
      </main>
    </div>
  );
}
