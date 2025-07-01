"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./hooks/Auth";
import styles from "./page.module.css";

export default function Home() {
  const [price, setPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      setRedirecting(true);
      setTimeout(() => {
        router.replace("/dashboard");
      }, 100);
    }
  }, [user, loading, router]);

  const handleStart = async () => {
    if (loading) return; // Wait for auth to resolve
    if (user) {
      setRedirecting(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
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
        setLoadingPrice(false);
      } catch (err) {
        console.error("Failed to fetch BTC price:", err);
        setError("Failed to load BTC price");
        setLoadingPrice(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {redirecting ? (
          <div className={styles.redirecting}>
            <div className={styles.redirectingRow}>
              <span className={styles.spinner} />
              <span>Redirecting to dashboard...</span>
            </div>
          </div>
        ) : (
          <>
            <h1>BTC Guessing Game</h1>

            {error ? (
              <p className={styles.error}>{error}</p>
            ) : (
              <p>
                {loadingPrice
                  ? "Loading BTC price..."
                  : `BTC/USD: $${price?.toFixed(2)}`}
              </p>
            )}

            <button onClick={handleStart}>Start Playing →</button>
          </>
        )}
      </main>
    </div>
  );
}
