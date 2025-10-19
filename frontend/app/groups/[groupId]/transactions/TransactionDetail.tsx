"use client";
import { useState, useEffect } from "react";
import TransactionDetailModal from "@/components/transaction-detail-modal";

export default function TransactionDetail({ transactionId, onClose }: { transactionId: string, onClose: () => void }) {
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransaction = async () => {
      setLoading(true);
      setError("");
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${transactionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch transaction");
        const data = await res.json();
        setTransaction(data.data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch transaction");
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [transactionId]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!transaction) return null;

  return <TransactionDetailModal transaction={transaction} onClose={onClose} />;
}
