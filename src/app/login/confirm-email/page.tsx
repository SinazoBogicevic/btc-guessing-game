"use client";
import { useAuth } from "@/app/hooks/Auth";
import { hasMessage } from "@/lib/guards";
import { resendSignUpCode } from "aws-amplify/auth";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import styles from "../login.module.css";

const ConfirmEmailPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { handleConfirmSignUp, handleSignIn } = useAuth();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resent, setResent] = useState(false);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await handleConfirmSignUp(email, code);
      if (result.success) {
        setSuccess("Email confirmed! Logging you in...");

        const password = sessionStorage.getItem("signupPassword");
        if (password) {
          const signInResult = await handleSignIn(email, password);
          sessionStorage.removeItem("signupPassword");
          if (signInResult.success) {
            setSuccess("Email confirmed! Redirecting to dashboard...");
            setTimeout(() => router.push("/dashboard"), 1200);
          } else {
            setSuccess("");
            setError(
              "Email confirmed, but failed to log in. Please log in manually."
            );
            setTimeout(() => router.push("/login"), 2000);
          }
        } else {
          setSuccess("Email confirmed! Please log in.");
          setTimeout(() => router.push("/login"), 1500);
        }
      } else {
        setError(
          hasMessage(result.error)
            ? result.error.message
            : "Failed to confirm code."
        );
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to confirm code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    setResent(false);
    try {
      await resendSignUpCode({ username: email });
      setResent(true);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <button
        onClick={() => router.push("/login")}
        className={styles.backButton}
      >
        ← Back
      </button>
      <div className={styles.centeredContent}>
        <h2>Confirm Your Email</h2>
        <form onSubmit={handleConfirm} className={styles.form}>
          <label>
            Verification Code
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Confirming..." : "Confirm Email"}
          </button>
        </form>
        <button
          onClick={handleResend}
          disabled={loading}
          className={styles.toggleButton}
        >
          Resend Code
        </button>
        {resent && <div className={styles.successMsg}>Code resent!</div>}
        {error && <div className={styles.errorMsg}>{error}</div>}
        {success && <div className={styles.successMsg}>{success}</div>}
      </div>
    </main>
  );
};

export default function Page() {
  return (
    <Suspense>
      <ConfirmEmailPage />
    </Suspense>
  );
}
