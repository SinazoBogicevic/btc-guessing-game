"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../hooks/Auth";

export default function LoginPage() {
  const { handleSignIn, handleSignUp } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

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
    <main>
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
          {errors.password && <span>{errors.password.message as string}</span>}
        </div>
        {error && <p>{error}</p>}
        <button type="submit">{isSignup ? "Sign Up" : "Login"}</button>
      </form>
      <button onClick={() => setIsSignup((v) => !v)}>
        {isSignup ? "Already have an account? Login" : "No account? Sign Up"}
      </button>
    </main>
  );
}
