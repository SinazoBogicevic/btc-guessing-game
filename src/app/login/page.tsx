"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { hasMessage } from "../../lib/guards";
import { useAuth } from "../hooks/Auth";

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
    <main className={"main"}>
      {redirecting ? (
        <div className={"redirecting"}>
          <div className={"redirectingRow"}>
            <span className={"spinner"} />
            <span>Redirecting to dashboard...</span>
          </div>
        </div>
      ) : (
        <>
          <h1>{isSignup ? "Sign Up" : "Login"}</h1>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label>Email</label>
              <input type="email" {...register("email", { required: true })} />
              {errors.email && <span>Email is required</span>}
            </div>
            <div>
              <label>Password</label>
              <input
                type="password"
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
              {errors.password && (
                <span>{errors.password.message as string}</span>
              )}
            </div>
            {error && <p>{error}</p>}
            <button type="submit">{isSignup ? "Sign Up" : "Login"}</button>
          </form>
          <button onClick={() => setIsSignup((v) => !v)}>
            {isSignup
              ? "Already have an account? Login"
              : "No account? Sign Up"}
          </button>
        </>
      )}
    </main>
  );
}
