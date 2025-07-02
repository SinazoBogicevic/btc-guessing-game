"use client";
import { useAuth } from "@/app/hooks/Auth";
import { hasMessage } from "@/lib/guards";
import { resendSignUpCode } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import styles from "../login.module.css";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const { handleConfirmSignUp, handleSignIn } = useAuth();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("signupEmail") || "";
    setEmail(storedEmail);
  }, []);

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
          sessionStorage.removeItem("signupEmail");
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
          sessionStorage.removeItem("signupEmail");
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
    setResendLoading(true);
    setError("");
    setResent(false);
    try {
      await resendSignUpCode({ username: email });
      setResent(true);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  const maskEmail = (email: string) => {
    const [user, domain] = email.split("@");
    if (!user || !domain) return email;
    if (user.length <= 2) return `*${"@" + domain}`;
    return `${user[0]}${"*".repeat(user.length - 2)}${
      user[user.length - 1]
    }@${domain}`;
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
          <div className={styles.centeredLabelWrapper}>
            <label className={styles.verificationLabel}>
              Verification Code
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </label>
            <div className={styles.infoText}>
              A verification code was sent to <b>{maskEmail(email)}</b>.
            </div>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className={styles.buttonSpinner} /> Confirming...
              </>
            ) : (
              "Confirm Email"
            )}
          </button>
        </form>
        <button
          onClick={handleResend}
          disabled={resendLoading || loading}
          className={styles.toggleButton}
        >
          {resendLoading ? (
            <>
              <span className={styles.buttonSpinner} /> Resending...
            </>
          ) : (
            "Resend Code"
          )}
        </button>
        {resent && <div className={styles.successMsg}>Code resent!</div>}
        {error && <div className={styles.errorMsg}>{error}</div>}
        {success && <div className={styles.successMsg}>{success}</div>}
      </div>
    </main>
  );
}
