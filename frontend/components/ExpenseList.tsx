"use client";
import { useState, useEffect } from "react";

interface ExpenseParticipant {
  participant_id: string;
  share_amount: number;
  user: {
    id: string;
    full_name: string;
    profile_pic?: string;
  };
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  created_at: string;
  payer: {
    id: string;
    full_name: string;
    profile_pic?: string;
  };
  created_by_user: {
    id: string;
    full_name: string;
    profile_pic?: string;
  };
  participants: ExpenseParticipant[];
}

interface ExpenseListProps {
  token: string;
  groupId: string;
  currentUserId: string;
  groupPhase?: "active" | "settlement";
  onRefresh?: () => void;
}

export default function ExpenseList({
  token,
  groupId,
  currentUserId,
  groupPhase,
  onRefresh,
}: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);

  const categoryIcons: { [key: string]: string } = {
    general: "💼",
    food: "🍽️",
    transport: "🚗",
    accommodation: "🏨",
    entertainment: "🎬",
    shopping: "🛍️",
    medical: "🏥",
    other: "📦",
  };

  useEffect(() => {
    fetchExpenses();
  }, [groupId]);

  const fetchExpenses = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:3000/groups/${groupId}/expenses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch expenses");
      }

      const data = await response.json();
      setExpenses(data.data || []);
    } catch (err: any) {
      console.error("Error fetching expenses:", err);
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/expenses/${expenseId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete expense");
      }

      // Refresh expenses list
      fetchExpenses();
      onRefresh?.();
    } catch (err: any) {
      console.error("Error deleting expense:", err);
      alert(err.message || "Failed to delete expense");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return (
        "Today " +
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const getUserShare = (expense: Expense, userId: string) => {
    const participant = expense.participants.find(
      (p) => p.participant_id === userId
    );
    return participant?.share_amount || 0;
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleExpenseDetails = (expenseId: string) => {
    setExpandedExpense(expandedExpense === expenseId ? null : expenseId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchExpenses}
          className="px-4 py-2 bg-[#192168] text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💸</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No expenses yet
        </h3>
        <p className="text-gray-500">
          Add your first group expense to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => {
        const isExpanded = expandedExpense === expense.id;
        const userShare = getUserShare(expense, currentUserId);
        const isUserPayer = expense.payer.id === currentUserId;
        const canDelete = expense.created_by_user.id === currentUserId;
        // Assign a color for each category for the left border
        const categoryColors: { [key: string]: string } = {
          general: "border-blue-400",
          food: "border-green-400",
          transport: "border-yellow-400",
          accommodation: "border-purple-400",
          entertainment: "border-pink-400",
          shopping: "border-orange-400",
          medical: "border-red-400",
          other: "border-gray-400",
        };
        const borderColor =
          categoryColors[expense.category] || categoryColors.general;
        return (
          <div
            key={expense.id}
            className={`bg-white rounded-xl border-l-4 ${borderColor} border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200 group`}
          >
            {/* Main expense info */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 rounded-xl rounded-l-none"
              onClick={() => toggleExpenseDetails(expense.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Category icon */}
                  <div className="text-2xl select-none">
                    {categoryIcons[expense.category] || categoryIcons.general}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 truncate text-base">
                        {expense.description}
                      </h4>
                      
                    </div>
                    <div className="flex items-center mt-1 text-xs text-gray-500 gap-2 flex-wrap justify-start">
                      <span>Paid by {expense.payer.full_name}</span>
                      <span className="mx-1">•</span>
                      <span>{formatDate(expense.created_at)}</span>
                      <span className="mx-1">•</span>
                      <span>
                        {expense.participants.length} participant
                        {expense.participants.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Expand/collapse arrow */}
                <div className="ml-2 mt-1 flex items-center">
                  <svg
                    className={`w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                
              </div>
              <div className="text-right ml-4 flex flex-col items-end justify-end flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900">
                          रु{expense.amount.toFixed(2)}
                        </p>
                        {isUserPayer ? (
                          <p className="text-xs text-green-600 font-semibold">
                            You paid
                          </p>
                        ) : userShare > 0 ? (
                          <p className="text-xs text-orange-600 font-semibold">
                            You owe रु{userShare.toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">Not involved</p>
                        )}
                      </div>
            </div>
            {/* Expanded details */}
            <div
              className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl">
                  <div className="space-y-4">
                    {/* Participants breakdown */}
                    <div>
                      <h5 className="text-xs font-semibold text-gray-700 mb-2">
                        Split breakdown:
                      </h5>
                      <div className="space-y-2">
                        {expense.participants.map((participant) => (
                          <div
                            key={participant.participant_id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              {participant.user.profile_pic ? (
                                <img
                                  src={participant.user.profile_pic}
                                  alt={participant.user.full_name}
                                  className="w-7 h-7 rounded-full mr-2 border-2 border-white shadow-sm"
                                />
                              ) : (
                                <div className="w-7 h-7 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full flex items-center justify-center mr-2 border-2 border-white shadow-sm">
                                  <span className="text-xs font-bold text-gray-700">
                                    {getUserInitials(participant.user.full_name)}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm text-gray-900">
                                {participant.user.full_name}
                                {participant.participant_id === currentUserId &&
                                  " (You)"}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              रु{participant.share_amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Added by {expense.created_by_user.full_name}
                      </div>
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExpense(expense.id);
                          }}
                          className="text-xs text-white bg-red-500 hover:bg-red-700 px-3 py-1 rounded-lg font-semibold shadow-sm transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
