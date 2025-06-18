"use client";
import { useEffect, useState } from "react";
import LendMoneyForm from "../../components/LendMoneyForm";

export default function LendPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
  }, []);

  if (!token) return <div className="text-center mt-10">Please log in to lend money.</div>;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <LendMoneyForm token={token} />
    </main>
  );
}
