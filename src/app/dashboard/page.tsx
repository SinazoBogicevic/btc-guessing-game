"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../hooks/Auth";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <main>
      <h1>Game Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </main>
  );
}
