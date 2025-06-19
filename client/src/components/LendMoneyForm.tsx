"use client";
import { useState } from "react";

export default function LendMoneyForm({ token }: { token: string }) {
  const [phNumber, setPhNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [deadline, setDeadline] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    try {
      const res = await fetch("http://localhost:3000/lend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ ph_number: phNumber, amount, remark: reason, deadline }),
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      // Check content type to avoid parsing HTML as JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      
      const data = await res.json();
      
      setSuccess("Loan request sent!");
      setPhNumber("");
      setAmount("");
      setReason("");
      setDeadline("");
    } catch (err: any) {
      console.error("Error creating loan:", err);
      setError(err.message || "Failed to create loan record");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold">Lend Money</h2>
      <input
        type="text"
        placeholder="Receiver Phone Number"
        className="w-full border p-2 rounded"
        value={phNumber}
        onChange={e => setPhNumber(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Amount"
        className="w-full border p-2 rounded"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        required
      />      <input
        type="text"
        placeholder="Reason"
        className="w-full border p-2 rounded"
        value={reason}
        onChange={e => setReason(e.target.value)}
      />
      <input
        type="date"
        placeholder="Deadline"
        className="w-full border p-2 rounded"
        value={deadline}
        onChange={e => setDeadline(e.target.value)}
        required
      />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Send Request</button>
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}
    </form>
  );
}
