"use client";
import { useState, useEffect } from "react";

interface Settlement {
  id: string;
  debtor_id: string;
  creditor_id: string;
  amount: number;
  status: "pending" | "completed";
  debtor: {
    id: string;
    full_name: string;
    profile_pic?: string;
  };
  creditor: {
    id: string;
    full_name: string;
    profile_pic?: string;
  };
}

interface SettlementPhaseProps {
  token: string;
  groupId: string;
  currentUserId: string;
  onBack: () => void;
}

export default function SettlementPhase({
  token,
  groupId,
  currentUserId,
  onBack,
}: SettlementPhaseProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myBalance, setMyBalance] = useState<number>(0);

  useEffect(() => {
    fetchSettlements();
    fetchMyBalance();
  }, [groupId]);

  const fetchSettlements = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/groups/${groupId}/optimized-settlements`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch settlements");
      }

      const data = await response.json();
      setSettlements(data.data || []);
    } catch (err: any) {
      console.error("Error fetching settlements:", err);
      setError(err.message || "Failed to load settlements");
    }
  };

  const fetchMyBalance = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/groups/${groupId}/my-balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }

      const data = await response.json();
      setMyBalance(data.balance || 0);
    } catch (err: any) {
      console.error("Error fetching balance:", err);
    } finally {
      setLoading(false);
    }
  };
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600";
    if (balance < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getBalanceText = (balance: number) => {
    if (balance > 0) return `You will receive ₹${balance.toFixed(2)}`;
    if (balance < 0) return `You need to pay ₹${Math.abs(balance).toFixed(2)}`;
    return "You are settled up";
  };

  const getBalanceBg = (balance: number) => {
    if (balance > 0) return "bg-green-50 border-green-200";
    if (balance < 0) return "bg-red-50 border-red-200";
    return "bg-gray-50 border-gray-200";
  };

  const mySettlements = settlements.filter(
    (s) => s.debtor_id === currentUserId || s.creditor_id === currentUserId
  );

  const pendingSettlements = mySettlements.filter(
    (s) => s.status === "pending"
  );
  const completedSettlements = mySettlements.filter(
    (s) => s.status === "completed"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError("");
            fetchSettlements();
            fetchMyBalance();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Settlement Phase
            </h2>
            <p className="text-sm text-gray-500">Optimized payment plan</p>
          </div>
        </div>
        <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
          🔒 Locked for new expenses
        </div>
      </div>

      {/* My Balance Summary */}
      <div className={`p-6 rounded-lg border ${getBalanceBg(myBalance)}`}>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Your final balance</p>
          <p className={`text-3xl font-bold ${getBalanceColor(myBalance)}`}>
            {myBalance === 0
              ? "₹0.00"
              : myBalance > 0
              ? `+₹${myBalance.toFixed(2)}`
              : `-₹${Math.abs(myBalance).toFixed(2)}`}
          </p>
          <p className={`text-sm ${getBalanceColor(myBalance)}`}>
            {getBalanceText(myBalance)}
          </p>
        </div>
      </div>

      {/* Algorithm Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">
              Smart Settlement Algorithm
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              We've optimized your settlements using a greedy algorithm to
              minimize the number of transactions needed. This reduces
              complexity and ensures everyone gets paid with the fewest possible
              payments.
            </p>
          </div>
        </div>
      </div>

      {/* Settlement Process Info */}
      {pendingSettlements.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-amber-600 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-amber-900">
                How to Complete Settlement
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Settlement loans have been created and sent to your loans section.
                If you owe money, please check your{" "}
                <strong>Loans</strong> page to confirm your obligations.
                Once confirmed, you can make payments and mark them as paid through the normal loan process.
              </p>
            </div>
          </div>
        </div>
      )}      {/* Pending Settlements */}
      {pendingSettlements.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Settlement Overview
          </h3>
          <div className="space-y-3">
            {pendingSettlements.map((settlement) => {
              const isDebtor = settlement.debtor_id === currentUserId;
              const otherUser = isDebtor
                ? settlement.creditor
                : settlement.debtor;

              return (
                <div
                  key={settlement.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {otherUser.profile_pic ? (
                        <img
                          src={otherUser.profile_pic}
                          alt={otherUser.full_name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {getUserInitials(otherUser.full_name)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {isDebtor ? (
                            <>
                              Pay{" "}
                              <span className="text-blue-600">
                                {otherUser.full_name}
                              </span>
                            </>
                          ) : (
                            <>
                              Receive from{" "}
                              <span className="text-green-600">
                                {otherUser.full_name}
                              </span>
                            </>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isDebtor ? "You owe" : "You will receive"}
                        </p>
                      </div>
                    </div>                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span
                          className={`text-lg font-semibold ${
                            isDebtor ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          ₹{settlement.amount.toFixed(2)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {isDebtor ? "Check your loans to confirm" : "Waiting for confirmation"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Settlements */}
      {completedSettlements.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Completed Settlements
          </h3>
          <div className="space-y-3">
            {completedSettlements.map((settlement) => {
              const isDebtor = settlement.debtor_id === currentUserId;
              const otherUser = isDebtor
                ? settlement.creditor
                : settlement.debtor;

              return (
                <div
                  key={settlement.id}
                  className="bg-green-50 rounded-lg border border-green-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {otherUser.profile_pic ? (
                        <img
                          src={otherUser.profile_pic}
                          alt={otherUser.full_name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {getUserInitials(otherUser.full_name)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {isDebtor ? (
                            <>
                              Paid{" "}
                              <span className="text-blue-600">
                                {otherUser.full_name}
                              </span>
                            </>
                          ) : (
                            <>
                              Received from{" "}
                              <span className="text-green-600">
                                {otherUser.full_name}
                              </span>
                            </>
                          )}
                        </p>
                        <p className="text-sm text-green-600 flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Completed
                        </p>
                      </div>
                    </div>

                    <span className="text-lg font-semibold text-gray-600">
                      ₹{settlement.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No settlements message */}
      {mySettlements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No settlements needed!
          </h3>
          <p className="text-gray-500">
            You're already settled up in this group.
          </p>
        </div>
      )}
    </div>
  );
}
