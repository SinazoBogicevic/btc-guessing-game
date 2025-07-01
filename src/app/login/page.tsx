"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { hasMessage } from "../../lib/guards";
import { useAuth } from "../hooks/Auth";
import styles from "./login.module.css";

export default function LoginPage() {
  const { handleSignIn, handleSignUp, user, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setRedirecting(true);
      setTimeout(() => {
        router.replace("/dashboard");
      }, 100);
    }
  }, [user, loading, router]);

  type FormData = { email: string; password: string };
  const onSubmit = async (data: FormData) => {
    setError("");

    const getErrorMessage = (err: unknown) =>
      hasMessage(err) ? err.message : undefined;
    if (isSignup) {
      const res = await handleSignUp(data.email, data.password);
      if (!res.success) {
        console.error("Signup error:", res.error);
        setError(getErrorMessage(res.error) || "Signup failed");
      } else {
        sessionStorage.setItem("signupPassword", data.password);
        router.push(
          `/login/confirm-email?email=${encodeURIComponent(data.email)}`
        );
      }
    } else {
      const res = await handleSignIn(data.email, data.password);
      if (!res.success) {
        console.error("Login error:", res.error);
        setError(getErrorMessage(res.error) || "Login failed");
      }
    }
  };

  return (
    <main className={styles.main}>
      <button onClick={() => router.push("/")} className={styles.backButton}>
        ← Back
      </button>
      {redirecting ? (
        <div className={styles.redirecting}>
          <div className={styles.redirectingRow}>
            <span className={styles.spinner} />
            <span>Redirecting to dashboard...</span>
          </div>
        </div>
      ) : (
        <div className={styles.centeredContent}>
          <h1>{isSignup ? "Sign Up" : "Login"}</h1>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div>
              <label>Email</label>
              <input type="email" {...register("email", { required: true })} />
              {errors.email && <span>Email is required</span>}
            </div>
            <div>
              <label>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters long",
                    },
                    pattern: {
                      value:
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
                      message:
                        "Password must contain uppercase, lowercase, number, and symbol",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={styles.showPasswordButton}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <span>{errors.password.message as string}</span>
              )}
            </div>
            {error && <p>{error}</p>}
            <button type="submit">{isSignup ? "Sign Up" : "Login"}</button>
          </form>
          <button
            onClick={() => setIsSignup((v) => !v)}
            className={styles.toggleButton}
          >
            {isSignup
              ? "Already have an account? Login"
              : "No account? Sign Up"}
          </button>
        </div>
      )}
    </main>
  );
}
