"use client";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export default function LoansLog({ token }: { token: string }) {
  const [loans, setLoans] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Get current user id from JWT
  let currentUserId = "";
  try {
    currentUserId = jwtDecode<{ sub: string }>(token).sub;
  } catch {}
  const fetchLoans = async () => {
    setError("");
    try {
      const res = await fetch("http://localhost:3000/loans", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      // Check content type to avoid parsing HTML as JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const data = await res.json();
      if (!data.data) {
        throw new Error("Invalid response format");
      }

      setLoans(data.data);
    } catch (err: any) {
      console.error("Error fetching loans:", err);
      setError(err.message || "Failed to fetch loans");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:3000/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      // Check content type to avoid parsing HTML as JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        const map: Record<string, string> = {};
        data.data.forEach((u: any) => {
          map[u.id] = u.full_name;
        });
        setUsers(map);
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      // Don't set error state here to avoid UI confusion - just log it
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchUsers();
  }, []);
  const confirmLoan = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`http://localhost:3000/loans/${id}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      // Check content type to avoid parsing HTML as JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const data = await res.json();
      setSuccess("Loan confirmed!");
      fetchLoans();
    } catch (err: any) {
      console.error("Error confirming loan:", err);
      setError(err.message || "Failed to confirm loan");
    }
  };

  const requestPayment = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        `http://localhost:3000/loans/${id}/payment-request`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      // Check content type to avoid parsing HTML as JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const data = await res.json();
      setSuccess("Payment request submitted!");
      fetchLoans();
    } catch (err: any) {
      console.error("Error requesting payment:", err);
      setError(err.message || "Failed to submit payment request");
    }
  };
  const confirmPayment = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        `http://localhost:3000/loans/${id}/confirm-payment`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      // Check content type to avoid parsing HTML as JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const data = await res.json();
      setSuccess("Payment confirmed! Loan moved to history.");
      fetchLoans();
    } catch (err: any) {
      console.error("Error confirming payment:", err);
      setError(err.message || "Failed to confirm payment");
    }
  };

  const markBusinessLoanPaid = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        `http://localhost:3000/business-loans/${id}/mark-paid`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      // Check content type to avoid parsing HTML as JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const data = await res.json();
      setSuccess("Business loan marked as paid!");
      fetchLoans();
    } catch (err: any) {
      console.error("Error marking business loan as paid:", err);
      setError(err.message || "Failed to mark business loan as paid");
    }
  };
  return (
    <div className="max-w-6xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Loan Management</h2>
      {error && (
        <div className="text-red-600 mb-4 p-3 bg-red-50 rounded">{error}</div>
      )}
      {success && (
        <div className="text-green-600 mb-4 p-3 bg-green-50 rounded">
          {success}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {" "}
        {/* Loans I've Given (As Lender) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">
            💰 Personal Loans I've Given
          </h3>
          {/* Pending Approvals for Lenders */}
          <div className="mb-6">
            <h4 className="font-medium mb-2 text-orange-600">
              ⏳ Pending Payment Approvals
            </h4>
            <div className="space-y-2">
              {loans
                .filter(
                  (loan) =>
                    (loan.loan_type === "personal" || !loan.loan_type) &&
                    loan.lender_id === currentUserId &&
                    loan.status === "payment_requested"
                )
                .map((loan) => (
                  <div
                    key={loan.id}
                    className="border rounded p-3 bg-orange-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p>
                          <strong>Borrower:</strong>{" "}
                          {loan.receiver?.full_name || "Unknown"}
                        </p>
                        <p>
                          <strong>Amount:</strong> ${loan.amount}
                        </p>
                        <p>
                          <strong>Reason:</strong> {loan.reason || "No reason"}
                        </p>
                        <p>
                          <strong>Due Date:</strong>{" "}
                          {loan.due_date
                            ? new Date(loan.due_date).toLocaleDateString()
                            : "N/A"}
                        </p>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                          Payment Requested
                        </span>
                      </div>
                      <button
                        onClick={() => confirmPayment(loan.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded"
                      >
                        Confirm Payment
                      </button>
                    </div>
                  </div>
                ))}
              {loans.filter(
                (loan) =>
                  (loan.loan_type === "personal" || !loan.loan_type) &&
                  loan.lender_id === currentUserId &&
                  loan.status === "payment_requested"
              ).length === 0 && (
                <p className="text-gray-500 italic">
                  No pending payment approvals
                </p>
              )}
            </div>
          </div>
          {/* Active Loans Given */}
          <div>
            <h4 className="font-medium mb-2 text-blue-600">📋 Active Loans</h4>
            <div className="space-y-2">
              {loans
                .filter(
                  (loan) =>
                    (loan.loan_type === "personal" || !loan.loan_type) &&
                    loan.lender_id === currentUserId &&
                    ["pending", "confirmed"].includes(loan.status)
                )
                .map((loan) => (
                  <div key={loan.id} className="border rounded p-3">
                    <p>
                      <strong>Borrower:</strong>{" "}
                      {loan.receiver?.full_name || "Unknown"}
                    </p>
                    <p>
                      <strong>Amount:</strong> ${loan.amount}
                    </p>
                    <p>
                      <strong>Reason:</strong> {loan.reason || "No reason"}
                    </p>
                    <p>
                      <strong>Due Date:</strong>{" "}
                      {loan.due_date
                        ? new Date(loan.due_date).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      {loan.status === "pending" && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                          Pending Confirmation
                        </span>
                      )}
                      {loan.status === "confirmed" && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          Confirmed
                        </span>
                      )}
                      {loan.status === "confirmed" && loan.due_date && (
                        <div className="text-sm">
                          <Countdown deadline={loan.due_date} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {loans.filter(
                (loan) =>
                  (loan.loan_type === "personal" || !loan.loan_type) &&
                  loan.lender_id === currentUserId &&
                  ["pending", "confirmed"].includes(loan.status)
              ).length === 0 && (
                <p className="text-gray-500 italic">
                  No active personal loans given
                </p>
              )}
            </div>
          </div>{" "}
        </div>
        {/* Loans I've Received (As Borrower) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-600">
            📥 Loans I've Received
          </h3>

          {/* Business Loans Section */}
          <div className="mb-6">
            <h4 className="font-medium mb-2 text-purple-600">
              🏢 Business Loans
            </h4>
            <div className="space-y-2">
              {loans
                .filter(
                  (loan) =>
                    loan.loan_type === "business" &&
                    loan.receiver_id === currentUserId
                )
                .map((loan) => (
                  <div
                    key={loan.id}
                    className="border rounded p-3 bg-purple-50"
                  >
                    <p>
                      <strong>Business:</strong> {loan.business_name} (
                      {loan.business_short_id})
                    </p>
                    <p>
                      <strong>Amount:</strong> ${loan.amount}
                    </p>
                    <p>
                      <strong>Description:</strong>{" "}
                      {loan.reason || "No description"}
                    </p>
                    <p>
                      <strong>Customer Name:</strong> {loan.customer_name}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(loan.created_at).toLocaleDateString()}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        {loan.is_paid ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            Paid
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                            Unpaid
                          </span>
                        )}
                      </div>

                      {!loan.is_paid && (
                        <button
                          onClick={() => markBusinessLoanPaid(loan.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              {loans.filter(
                (loan) =>
                  loan.loan_type === "business" &&
                  loan.receiver_id === currentUserId
              ).length === 0 && (
                <p className="text-gray-500 italic">No business loans</p>
              )}
            </div>
          </div>

          {/* Personal Loans Section */}
          <div>
            <h4 className="font-medium mb-2 text-green-600">
              👤 Personal Loans
            </h4>
            <div className="space-y-2">
              {loans
                .filter(
                  (loan) =>
                    (loan.loan_type === "personal" || !loan.loan_type) &&
                    loan.receiver_id === currentUserId
                )
                .map((loan) => (
                  <div key={loan.id} className="border rounded p-3">
                    <p>
                      <strong>Lender:</strong>{" "}
                      {loan.lender?.full_name || "Unknown"}
                    </p>
                    <p>
                      <strong>Amount:</strong> ${loan.amount}
                    </p>
                    <p>
                      <strong>Reason:</strong> {loan.reason || "No reason"}
                    </p>
                    <p>
                      <strong>Due Date:</strong>{" "}
                      {loan.due_date
                        ? new Date(loan.due_date).toLocaleDateString()
                        : "N/A"}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        {loan.status === "pending" && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                            Pending
                          </span>
                        )}
                        {loan.status === "confirmed" && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            Confirmed
                          </span>
                        )}
                        {loan.status === "payment_requested" && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            Payment Requested
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {loan.status === "pending" && (
                          <button
                            onClick={() => confirmLoan(loan.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Confirm Loan
                          </button>
                        )}
                        {loan.status === "confirmed" && (
                          <button
                            onClick={() => requestPayment(loan.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Mark as Paid
                          </button>
                        )}
                        {loan.status === "payment_requested" && (
                          <span className="text-sm text-blue-600 font-medium">
                            Waiting for lender approval
                          </span>
                        )}
                      </div>
                    </div>
                    {loan.status === "confirmed" && loan.due_date && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Time remaining:</strong>{" "}
                        <Countdown deadline={loan.due_date} />
                      </div>
                    )}
                  </div>
                ))}
              {loans.filter(
                (loan) =>
                  (loan.loan_type === "personal" || !loan.loan_type) &&
                  loan.receiver_id === currentUserId
              ).length === 0 && (
                <p className="text-gray-500 italic">
                  No personal loans received
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Countdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const diff = end - now;
      if (diff <= 0) setTimeLeft("Expired");
      else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000); // update every second
    return () => clearInterval(interval);
  }, [deadline]);
  return <span>{timeLeft}</span>;
}
