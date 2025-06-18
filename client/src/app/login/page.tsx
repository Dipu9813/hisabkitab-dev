"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (token: string) => {
    localStorage.setItem("token", token);
    router.push("/profile");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <LoginForm onLogin={handleLogin} />
      {error && <div className="text-red-600">{error}</div>}
    </main>
  );
}
