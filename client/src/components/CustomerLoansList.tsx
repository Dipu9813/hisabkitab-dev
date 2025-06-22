"use client";
import { useState } from "react";

interface CustomerLoan {
  id: string;
  businessId: string;
  customerName: string;
  amount: number;
  description: string;
  isPaid: boolean;
  date: string;
  addedBy: string;
  addedById: string;
  addedByProfilePic?: string;
}

interface CustomerLoansListProps {
  loans: CustomerLoan[];
  loading: boolean;
  token: string;
  onLoanStatusUpdated: () => void;
  searchTerm: string;
  onAddLoan?: () => void;
}

export default function CustomerLoansList({
  loans,
  loading,
  token,
  onLoanStatusUpdated,
  searchTerm,
  onAddLoan,
}: CustomerLoansListProps) {
  const [updatingLoanId, setUpdatingLoanId] = useState<string | null>(null);

  const handleStatusToggle = async (loan: CustomerLoan) => {
    try {
      setUpdatingLoanId(loan.id);

      const res = await fetch(
        `http://localhost:3000/business/loan/${loan.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isPaid: !loan.isPaid,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || `Error ${res.status}: ${res.statusText}`
        );
      }

      onLoanStatusUpdated();
    } catch (err: any) {
      console.error("Error updating loan status:", err);
      alert("Failed to update loan status: " + err.message);
    } finally {
      setUpdatingLoanId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Loading loans...</span>
        </div>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No matching loans found" : "No customer loans yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? `No loans match "${searchTerm}". Try a different search term.`
              : "Add your first customer loan to start tracking credits and payments."}
          </p>
          {!searchTerm && onAddLoan && (
            <button
              onClick={onAddLoan}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm font-medium flex items-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Your First Customer Loan
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">
          Customer Loans ({loans.length})
        </h3>
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-1">
            Showing results for "{searchTerm}"
          </p>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {loans.map((loan) => (
          <div key={loan.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Customer Name and Amount */}
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-medium text-gray-900">
                    {highlightSearchTerm(loan.customerName, searchTerm)}
                  </h4>
                  <span
                    className={`text-xl font-bold ${
                      loan.isPaid ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${loan.amount.toFixed(2)}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      loan.isPaid
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {loan.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </div>

                {/* Description */}
                {loan.description && (
                  <p className="text-gray-600 mb-2">
                    {highlightSearchTerm(loan.description, searchTerm)}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formatDate(loan.date)}
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Added by {highlightSearchTerm(loan.addedBy, searchTerm)}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleStatusToggle(loan)}
                  disabled={updatingLoanId === loan.id}
                  className={`px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                    loan.isPaid
                      ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                      : "bg-green-100 hover:bg-green-200 text-green-800"
                  }`}
                >
                  {updatingLoanId === loan.id ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Updating...
                    </div>
                  ) : loan.isPaid ? (
                    "Mark as Unpaid"
                  ) : (
                    "Mark as Paid"
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Total: {loans.length} loan{loans.length !== 1 ? "s" : ""}
          </span>
          <div className="flex space-x-4">
            <span className="text-red-600">
              Unpaid: $
              {loans
                .filter((l) => !l.isPaid)
                .reduce((sum, l) => sum + l.amount, 0)
                .toFixed(2)}
            </span>
            <span className="text-green-600">
              Paid: $
              {loans
                .filter((l) => l.isPaid)
                .reduce((sum, l) => sum + l.amount, 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
