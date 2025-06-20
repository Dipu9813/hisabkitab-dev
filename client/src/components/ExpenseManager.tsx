"use client";
import { useState, useEffect } from "react";
import AddExpenseForm from "./AddExpenseForm";
import ExpenseList from "./ExpenseList";
import BalancesSummary from "./BalancesSummary";

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
}

export default function ExpenseManager({ token, groupId, groupName, currentUserId }: ExpenseManagerProps) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
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
      console.log('🔍 Fetching group members for group:', groupId);
      
      const response = await fetch(`http://localhost:3000/groups/${groupId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('❌ Response not OK:', response.status, response.statusText);
        
        if (response.status === 404) {
          throw new Error("Group not found. Please check if the group exists.");
        } else if (response.status === 403) {
          throw new Error("Access denied. You might not be a member of this group.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later or check if the database is set up correctly.");
        } else {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || `Server returned ${response.status}: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ Group members fetched:', data.members?.length || 0, 'members');
      setMembers(data.members || []);
      
    } catch (err: any) {
      console.error("Error fetching group members:", err);
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError("Cannot connect to server. Please ensure the backend is running on http://localhost:3000");
      } else {
        setError(err.message || "Failed to load group members. Please check your database setup.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseAdded = () => {
    // Trigger refresh of both expenses and balances
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
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
      <div className="text-center py-8 px-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-red-600 mb-2">Cannot Load Expense Manager</h3>
        <p className="text-red-600 mb-4 max-w-md mx-auto">{error}</p>
        
        {error.includes("database") && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
            <h4 className="font-medium text-yellow-800 mb-2">💡 Setup Required</h4>
            <p className="text-sm text-yellow-700">
              The expense sharing feature requires database setup. Please execute the SQL script in 
              <code className="bg-yellow-100 px-1 rounded">database-setup.sql</code> in your Supabase dashboard.
            </p>
          </div>
        )}
        
        {error.includes("server") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
            <h4 className="font-medium text-blue-800 mb-2">🔧 Server Check</h4>
            <p className="text-sm text-blue-700">
              Make sure your backend server is running on <code className="bg-blue-100 px-1 rounded">http://localhost:3000</code>
            </p>
          </div>
        )}
        
        <button
          onClick={fetchGroupMembers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
        >
          Try Again
        </button>
        
        <button
          onClick={() => window.open('http://localhost:3000/groups', '_blank')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Test Server
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with tabs and add button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'expenses'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            📋 Expenses
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'balances'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            ⚖️ Balances
          </button>
        </div>
        
        <button
          onClick={() => setShowAddExpenseForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Expense</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {activeTab === 'expenses' && (
          <ExpenseList
            key={`expenses-${refreshKey}`}
            token={token}
            groupId={groupId}
            currentUserId={currentUserId}
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
