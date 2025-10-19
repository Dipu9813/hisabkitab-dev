"use client";
import { useState, useEffect } from "react";
import BalancesSummary from "./BalancesSummary";
import ExpenseList from "./ExpenseList";
import AddExpenseForm from "./AddExpenseForm";

interface GroupMember {
  user_id: string;
  details: {
    id: string;
    full_name: string;
    profile_pic?: string;
  };
}

interface ExpenseManagerProps {
  token: string;
  groupId: string;
  groupName: string;
  currentUserId: string;
  groupPhase?: "active" | "settlement";
}

export default function ExpenseManager({
  token,
  groupId,
  groupName,
  currentUserId,
  groupPhase,
}: ExpenseManagerProps) {
  const [activeTab, setActiveTab] = useState<"expenses" | "balances">(
    "expenses"
  );
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchGroupMembers();
  }, [groupId]);
  const fetchGroupMembers = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("🔍 Fetching group members for group:", groupId);

      const response = await fetch(`http://localhost:3000/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(
          "❌ Response not OK:",
          response.status,
          response.statusText
        );

        if (response.status === 404) {
          throw new Error("Group not found. Please check if the group exists.");
        } else if (response.status === 403) {
          throw new Error(
            "Access denied. You might not be a member of this group."
          );
        } else if (response.status >= 500) {
          throw new Error(
            "Server error. Please try again later or check if the database is set up correctly."
          );
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(
            errorData.error ||
              `Server returned ${response.status}: ${response.statusText}`
          );
        }
      }

      const data = await response.json();
      console.log(
        "✅ Group members fetched:",
        data.members?.length || 0,
        "members"
      );
      setMembers(data.members || []);
    } catch (err: any) {
      console.error("Error fetching group members:", err);

      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError(
          "Cannot connect to server. Please ensure the backend is running on http://localhost:3000"
        );
      } else {
        setError(
          err.message ||
            "Failed to load group members. Please check your database setup."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseAdded = () => {
    // Trigger refresh of both expenses and balances
    setRefreshKey((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 animate-fade-in">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-12 px-4 animate-fade-in">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Cannot Load Expense Manager
        </h3>
        <p className="text-red-600 mb-4 max-w-md mx-auto text-sm">{error}</p>
        {error.includes("database") && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
            <h4 className="font-medium text-yellow-800 mb-2">
              💡 Setup Required
            </h4>
            <p className="text-sm text-yellow-700">
              The expense sharing feature requires database setup. Please
              execute the SQL script in
              <code className="bg-yellow-100 px-1 rounded ml-1">database-setup.sql</code>
              in your Supabase dashboard.
            </p>
          </div>
        )}
        {error.includes("server") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
            <h4 className="font-medium text-blue-800 mb-2">🔧 Server Check</h4>
            <p className="text-sm text-blue-700">
              Make sure your backend server is running on
              <code className="bg-blue-100 px-1 rounded ml-1">http://localhost:3000</code>
            </p>
          </div>
        )}
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={fetchGroupMembers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Try Again
          </button>
          <button
            onClick={() => window.open('http://localhost:3000/groups', '_blank')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
          >
            Test Server
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in relative">
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-4 py-3 rounded-3xl border-b border-gray-200 bg-white rounded-t-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex w-full space-x-1 bg-gray-100 rounded-xl p-1">
          <button
        onClick={() => setActiveTab('expenses')}
        className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 focus:outline-none
          ${activeTab === 'expenses'
            ? 'bg-[#192168] text-white shadow'
            : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'}`}
          >
        <span className="mr-1">📋</span>Expenses
          </button>
          <button
        onClick={() => setActiveTab('balances')}
        className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 focus:outline-none
          ${activeTab === 'balances'
            ? 'bg-[#192168] text-white shadow'
            : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'}`}
          >
        <span className="mr-1">⚖️</span>Balances
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-b-2xl transition-all duration-200">
        {/* Settlement alert if group is settled */}
        {groupPhase === 'settlement' && (
          <div className="w-full z-20 flex justify-center mb-4">
            <div className="bg-red-100 border border-red-300 text-red-800 rounded-lg px-4 py-2 shadow-md flex items-center gap-2 max-w-xl mx-auto">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Group is settled - expenses cannot be modified</span>
            </div>
          </div>
        )}
        {activeTab === 'expenses' && (
          <ExpenseList
            key={`expenses-${refreshKey}`}
            token={token}
            groupId={groupId}
            currentUserId={currentUserId}
            groupPhase={groupPhase}
            onRefresh={handleRefresh}
          />
        )}
        {activeTab === 'balances' && (
          <BalancesSummary
            key={`balances-${refreshKey}`}
            token={token}
            groupId={groupId}
            currentUserId={currentUserId}
          />
        )}
      </div>
      {/* Floating Add Expense Button */}
      {groupPhase !== 'settlement' && (
        <button
          onClick={() => setShowAddExpenseForm(true)}
          className="fixed bottom-8 right-8 z-30 bg-[#192168] hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-all duration-200 focus:outline-none active:scale-95 border-4 border-white"
          aria-label="Add Expense"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
      {/* Add Expense Form Modal */}
      {showAddExpenseForm && (
        <AddExpenseForm
          token={token}
          groupId={groupId}
          members={members}
          onExpenseAdded={handleExpenseAdded}
          onClose={() => setShowAddExpenseForm(false)}
        />
      )}
    </div>
  );
}
