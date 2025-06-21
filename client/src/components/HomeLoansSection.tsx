"use client";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
import Groups from "./Groups";

export default function HomeLoansSection({ token }: { token: string }) {
  const [loans, setLoans] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [showGroups, setShowGroups] = useState(false);

  // Get current user id from JWT
  let currentUserId = "";
  try {
    currentUserId = jwtDecode<{ sub: string }>(token).sub;
  } catch {} // Filter loans by type
  const lendedLoans = loans.filter(
    (loan) =>
      (loan.loan_type === "personal" || !loan.loan_type) &&
      loan.lender_id === currentUserId &&
      loan.status === "confirmed"
  );

  const borrowedPersonalLoans = loans.filter(
    (loan) =>
      (loan.loan_type === "personal" || !loan.loan_type) &&
      loan.receiver_id === currentUserId &&
      loan.status === "confirmed"
  );
  // Business loans where user is the customer
  const borrowedBusinessLoans = loans.filter(
    (loan) =>
      loan.loan_type === "business" &&
      (loan.receiver_id === currentUserId ||
        loan.receiver?.id === currentUserId) &&
      !loan.is_paid
  );

  // All borrowed loans (personal + business)
  const borrowedLoans = [...borrowedPersonalLoans, ...borrowedBusinessLoans];

  const pendingLoans = loans.filter(
    (loan) =>
      (loan.loan_type === "personal" || !loan.loan_type) &&
      loan.receiver_id === currentUserId &&
      loan.status === "pending"
  );

  // New: Payment requests that need lender approval (personal loans only)
  const pendingPaymentApprovals = loans.filter(
    (loan) =>
      (loan.loan_type === "personal" || !loan.loan_type) &&
      loan.lender_id === currentUserId &&
      loan.status === "payment_requested"
  );
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
      setError(err.message || "Failed to connect to server");
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
    } catch (err) {
      setError("Failed to fetch user details");
    }
  };
  useEffect(() => {
    fetchLoans();
    fetchUsers();

    // Set up polling to refresh loans every 30 seconds
    const interval = setInterval(() => {
      fetchLoans();
    }, 30000);

    // Set up event listener for notification clicks
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith("notifications_")) {
        fetchLoans();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Custom event for notification interactions
    const handleNotificationInteraction = () => {
      fetchLoans();
    };

    window.addEventListener(
      "notificationInteraction",
      handleNotificationInteraction
    );

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "notificationInteraction",
        handleNotificationInteraction
      );
    };
  }, []);

  const confirmLoan = async (id: string) => {
    setError("");
    try {
      const res = await fetch(`http://localhost:3000/loans/${id}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to confirm");
      else {
        fetchLoans(); // Refresh loans after confirmation
      }
    } catch (err) {
      setError("Failed to connect to server");
    }
  };
  // Request payment confirmation
  const requestPayment = async (id: string) => {
    setError("");
    try {
      const res = await fetch(
        `http://localhost:3000/loans/${id}/payment-request`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || `Error ${res.status}: ${res.statusText}`
          );
        } else {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
      }

      fetchLoans(); // Refresh loans after payment request
    } catch (err: any) {
      console.error("Error requesting payment:", err);
      setError(err.message || "Failed to request payment confirmation");
    }
  };

  // Confirm payment as lender
  const confirmPayment = async (id: string) => {
    setError("");
    try {
      const res = await fetch(
        `http://localhost:3000/loans/${id}/confirm-payment`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || `Error ${res.status}: ${res.statusText}`
          );
        } else {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
      }
      fetchLoans(); // Refresh loans after payment confirmation
    } catch (err: any) {
      console.error("Error confirming payment:", err);
      setError(err.message || "Failed to confirm payment");
    }
  };

  // Mark business loan as paid
  const markBusinessLoanPaid = async (id: string) => {
    setError("");
    try {
      const res = await fetch(
        `http://localhost:3000/business-loans/${id}/mark-paid`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || `Error ${res.status}: ${res.statusText}`
          );
        } else {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
      }

      fetchLoans(); // Refresh loans after marking as paid
    } catch (err: any) {
      console.error("Error marking business loan as paid:", err);
      setError(err.message || "Failed to mark business loan as paid");
    }
  }; // Helper function to render a loan row (handles both personal and business loans)
  const renderLoanRow = (loan: any) => {
    const isBusinessLoan = loan.loan_type === "business";

    return (
      <tr key={loan.id} className="border-b">
        <td className="py-2 px-3">
          {isBusinessLoan ? (
            <div>
              <div className="font-medium">{loan.business_name}</div>
              <div className="text-xs text-gray-500">
                ({loan.business_short_id})
              </div>
            </div>
          ) : (
            loan.lender?.full_name || "Unknown"
          )}
        </td>
        <td className="py-2 px-3">
          {isBusinessLoan ? (
            <div>
              <div>{loan.customer_name}</div>
              <div className="text-xs text-purple-600">Business Customer</div>
            </div>
          ) : (
            loan.receiver?.full_name || "Unknown"
          )}
        </td>
        <td className="py-2 px-3">${loan.amount}</td>
        <td className="py-2 px-3">
          {loan.reason || loan.description || "No description"}
        </td>
        <td className="py-2 px-3">
          {isBusinessLoan ? (
            <span className="text-gray-400">-</span>
          ) : loan.due_date ? (
            new Date(loan.due_date).toLocaleDateString()
          ) : (
            "N/A"
          )}
        </td>
        <td className="py-2 px-3">
          {isBusinessLoan ? (
            loan.is_paid ? (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                Paid
              </span>
            ) : (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                Unpaid
              </span>
            )
          ) : (
            <>
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
            </>
          )}
        </td>
        <td className="py-2 px-3">
          {isBusinessLoan ? (
            !loan.is_paid && (
              <button
                onClick={() => markBusinessLoanPaid(loan.id)}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Mark Paid
              </button>
            )
          ) : (
            <>
              {loan.status === "pending" &&
                loan.receiver_id === currentUserId && (
                  <button
                    onClick={() => confirmLoan(loan.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Confirm
                  </button>
                )}
              {loan.status === "confirmed" &&
                loan.receiver_id === currentUserId && (
                  <button
                    onClick={() => requestPayment(loan.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Paid Request
                  </button>
                )}
              {loan.status === "payment_requested" &&
                loan.lender_id === currentUserId && (
                  <button
                    onClick={() => confirmPayment(loan.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Confirm Payment
                  </button>
                )}
              {loan.status === "confirmed" && loan.due_date && (
                <Countdown deadline={loan.due_date} />
              )}
            </>
          )}
        </td>
      </tr>
    );
  };

  // Render a table for a specific section
  const renderLoanTable = (
    title: string,
    loanList: any[],
    showActions: boolean = true
  ) => (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {loanList.length === 0 ? (
        <p className="text-gray-500">No loans to display</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left">Lender</th>
                <th className="py-2 px-3 text-left">Receiver</th>
                <th className="py-2 px-3 text-left">Amount</th>
                <th className="py-2 px-3 text-left">Reason</th>
                <th className="py-2 px-3 text-left">Due Date</th>
                <th className="py-2 px-3 text-left">Status</th>
                {showActions && <th className="py-2 px-3 text-left">Action</th>}
              </tr>
            </thead>
            <tbody>{loanList.map((loan) => renderLoanRow(loan))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {/* Priority: Pending Payment Approvals Section */}
      {pendingPaymentApprovals.length > 0 && (
        <div className="mb-8 p-4 bg-orange-50 border-l-4 border-orange-400 rounded">
          <h2 className="text-xl font-semibold mb-3 text-orange-700">
            🚨 Payment Confirmations Needed ({pendingPaymentApprovals.length})
          </h2>
          <p className="text-orange-600 mb-4 text-sm">
            These borrowers have marked their loans as paid and are waiting for
            your confirmation.
          </p>
          {renderLoanTable("", pendingPaymentApprovals, false)}
        </div>
      )}{" "}
      {/* Pending Loans Section */}
      {renderLoanTable("Pending Approval", pendingLoans)}
      {/* Lended Loans Section */}
      {renderLoanTable("Money I've Lent (Personal)", lendedLoans)}{" "}
      {/* Borrowed Loans Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">
            Money I Owe (Personal & Business)
          </h2>
          {borrowedLoans.length > 0 && (
            <div className="flex space-x-4 text-sm">
              <span className="text-gray-600">
                Personal: {borrowedPersonalLoans.length}
              </span>
              <span className="text-purple-600">
                Business: {borrowedBusinessLoans.length}
              </span>
            </div>
          )}
        </div>
        {borrowedLoans.length === 0 ? (
          <p className="text-gray-500">No loans to display</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-3 text-left">Lender</th>
                  <th className="py-2 px-3 text-left">Receiver</th>
                  <th className="py-2 px-3 text-left">Amount</th>
                  <th className="py-2 px-3 text-left">Reason</th>
                  <th className="py-2 px-3 text-left">Due Date</th>
                  <th className="py-2 px-3 text-left">Status</th>
                  <th className="py-2 px-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>{borrowedLoans.map((loan) => renderLoanRow(loan))}</tbody>
            </table>
          </div>
        )}
      </div>{" "}
      <div className="mt-8 flex justify-center space-x-4">
        <Link
          href="/lend"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow"
        >
          Lend Money
        </Link>{" "}
        <button
          onClick={() => setShowGroups(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow"
        >
          <span>Create Group</span>
        </button>
        <Link
          href="/business"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg shadow"
        >
          Business Loans
        </Link>
        <Link
          href="/loans"
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg shadow"
        >
          View All Loans
        </Link>
      </div>
      {/* Groups Modal */}
      {showGroups && (
        <Groups token={token} onClose={() => setShowGroups(false)} />
      )}
    </div>
  );
}

// Countdown component
function Countdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000); // update every second

    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span
      className={`text-sm ${
        timeLeft === "Expired" ? "text-red-600 font-bold" : "text-blue-600"
      }`}
    >
      {timeLeft}
    </span>
  );
}
