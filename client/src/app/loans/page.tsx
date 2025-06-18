"use client";
import { useEffect, useState } from "react";
import LoansLog from "../../components/LoansLog";
import LoanHistory from "../../components/LoanHistory";

export default function LoansPage() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);
  
  if (!token) return <div className="text-center mt-10">Please log in to view your loans.</div>;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Loan Management</h1>
      
      {/* Active Loans Section */}
      <div className="mb-12">
        <LoansLog token={token} />
      </div>
      
      {/* Loan History Section */}
      <div className="mt-16">
        <LoanHistory token={token} />
      </div>
    </div>
  );
}
