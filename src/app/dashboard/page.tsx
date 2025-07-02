"use client";
import RuleCard from "@/components/RuleCard";
import { UserGameState } from "@/types";
import { fetchAuthSession } from "aws-amplify/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../hooks/Auth";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { user, loading, handleSignOut } = useAuth();
  const router = useRouter();
  const [userState, setUserState] = useState<UserGameState | null>(null);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [result, setResult] = useState<"win" | "loss" | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [showRuleCard, setShowRuleCard] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);

  const tips = [
    "Guesses are resolved at least after 60s have passed.",
    "The BTC price must change before your guess can be resolved.",
    "If you're right, you gain 1 point. If you're wrong, you lose 1.",
    "You can only make one guess at a time.",
    "The game auto-resolves once conditions are met!",
    "The games not broken, you're just waiting!",
  ];

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.username) {
      (async () => {
        try {
          const session = await fetchAuthSession();
          const token = session.tokens?.idToken?.toString();
          const res = await fetch(`/api/user?userId=${user.username}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!res.ok) {
            const errorText = await res.text();
            console.error("API Error:", errorText);
            return;
          }
          const data = await res.json();
          setUserState(data);
        } catch (err) {
          console.error("Failed to ensure user in DB:", err);
        }
      })();
    }
  }, [user, loading, router]);

  const fetchBTC = useCallback(async () => {
    try {
      const res = await fetch("/api/btc-price");
      const { price } = await res.json();
      setBtcPrice(price);
    } catch (err) {
      console.error("Failed to fetch BTC price", err);
    }
  }, []);

  useEffect(() => {
    fetchBTC();
    const interval = setInterval(fetchBTC, 40000);
    return () => clearInterval(interval);
  }, [fetchBTC]);

  const handleGuess = async (direction: "up" | "down") => {
    if (!user?.username || !btcPrice) return;
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    await fetch("/api/guess", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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

  const resolveUserGuess = useCallback(async () => {
    if (!user?.username) return;
    await fetchBTC();
    if (!btcPrice) return;
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.username, currentPrice: btcPrice }),
      });
      const { result } = await res.json();
      setResult(result);

      const updated = await fetch(`/api/user?userId=${user.username}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const updatedUser = await updated.json();
      setUserState(updatedUser);
    } catch (err) {
      console.error("Failed to resolve guess", err);
    }
  }, [user, btcPrice, fetchBTC]);

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
      if (
        diffSec >= 60 &&
        btcPrice !== null &&
        userState.priceAtGuess !== undefined &&
        btcPrice !== userState.priceAtGuess
      ) {
        setIsResolving(true);
        resolveUserGuess().finally(() => setIsResolving(false));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [userState, result, isResolving, resolveUserGuess, btcPrice]);

  useEffect(() => {
    if (userState && userState.activeGuess && !result) {
      setTipIndex(0);
      const interval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % tips.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [userState, result, tips.length]);

  useEffect(() => {
    if (!userState) return;
    const dismissed = localStorage.getItem("ruleCardDismissed");
    const neverBet =
      userState.score === 0 &&
      userState.lastResult === null &&
      userState.resolvedAt === null;
    if (neverBet && !dismissed) {
      setShowRuleCard(true);
    }
  }, [userState]);

  const handleCloseRuleCard = () => {
    setShowRuleCard(false);
    localStorage.setItem("ruleCardDismissed", "1");
  };

  useEffect(() => {
    if (result) {
      setShowResultPopup(true);
      const timer = setTimeout(() => {
        setShowResultPopup(false);
        setResult(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  if (!userState || btcPrice === null)
    return (
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinnerTitle}>Setting up game</div>
        <div className={styles.spinner}></div>
      </div>
    );

  const handleLogout = async () => {
    await handleSignOut();
    router.replace("/login");
  };

  return (
    <main className={styles.main}>
      {showRuleCard && <RuleCard onClose={handleCloseRuleCard} />}
      <nav className={styles.navbar}>
        <div className={styles.navSection}></div>
        <div className={styles.titleLogo}>
          <Image src={"/bitcoin.svg"} alt={"Big B"} width={32} height={32} />
          <span className={styles.navTitle}>Bitcoin Guessing Game</span>
        </div>
        <div className={styles.navSection}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </nav>
      {showResultPopup && (
        <div
          className={
            result === "win" ? styles.resultPopupWin : styles.resultPopupLoss
          }
        >
          You {result === "win" ? "won!" : "lost."}
        </div>
      )}
      <div className={styles.price}>
        Current Price:{" "}
        {typeof btcPrice === "number"
          ? `$${btcPrice.toFixed(2)}`
          : "Loading..."}
      </div>
      <div className={styles.scoreCard}>
        <div className={styles.scoreLabel}>Your Score</div>
        <div className={styles.scoreValue}>{userState.score}</div>
      </div>
      {userState.activeGuess && !result && (
        <>
          <p className={styles.animatedTip}>{tips[tipIndex]}</p>
          <div className={styles.guessSummary}>
            You guessed: {userState.activeGuess === "up" ? "Up ↑" : "Down ↓"}
          </div>
        </>
      )}
      {!userState.activeGuess || result ? (
        <div className={styles.guessButtons}>
          <button
            onClick={() => handleGuess("up")}
            className={styles.guessUp}
            disabled={!!userState.activeGuess}
          >
            Guess Up ↑
          </button>
          <button
            onClick={() => handleGuess("down")}
            className={styles.guessDown}
            disabled={!!userState.activeGuess}
          >
            Guess Down ↓
          </button>
        </div>
      ) : null}
    </main>
  );
}
