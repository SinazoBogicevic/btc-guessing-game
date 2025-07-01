"use client";
import { useAuth } from "@/app/hooks/Auth";
import { hasMessage } from "@/lib/guards";
import { resendSignUpCode } from "aws-amplify/auth";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";

const ConfirmEmailPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { handleConfirmSignUp } = useAuth();

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
        setSuccess("Email confirmed! Redirecting to dashboard...");
        setTimeout(() => router.push("/dashboard"), 1500);
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
    <div>
      <h2>Confirm Your Email</h2>
      <form onSubmit={handleConfirm}>
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
      <button onClick={handleResend} disabled={loading}>
        Resend Code
      </button>
      {resent && <div>Code resent!</div>}
      {error && <div>{error}</div>}
      {success && <div>{success}</div>}
    </div>
  );
};

export default ConfirmEmailPage;
