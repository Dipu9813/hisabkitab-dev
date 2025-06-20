"use client";
import { useState, useEffect } from "react";

interface BalanceUser {
  user: {
    id: string;
    full_name: string;
    profile_pic?: string;
  };
  net_balance: number;
  owes: Array<{
    user: {
      id: string;
      full_name: string;
      profile_pic?: string;
    };
    amount: number;
  }>;
  owed_by: Array<{
    user: {
      id: string;
      full_name: string;
      profile_pic?: string;
    };
    amount: number;
  }>;
}

interface BalancesSummaryProps {
  token: string;
  groupId: string;
  currentUserId: string;
}

export default function BalancesSummary({ token, groupId, currentUserId }: BalancesSummaryProps) {
  const [balances, setBalances] = useState<BalanceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed'>('summary');

  useEffect(() => {
    fetchBalances();
  }, [groupId]);

  const fetchBalances = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`http://localhost:3000/groups/${groupId}/balances`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch balances");
      }
      
      const data = await response.json();
      setBalances(data.data || []);
      
    } catch (err: any) {
      console.error("Error fetching balances:", err);
      setError(err.message || "Failed to load balances");
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getCurrentUserBalance = () => {
    return balances.find(b => b.user.id === currentUserId);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600";
    if (balance < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getBalanceText = (balance: number) => {
    if (balance > 0) return `You are owed ₹${balance.toFixed(2)}`;
    if (balance < 0) return `You owe ₹${Math.abs(balance).toFixed(2)}`;
    return "You are settled up";
  };

  const getBalanceBg = (balance: number) => {
    if (balance > 0) return "bg-green-50 border-green-200";
    if (balance < 0) return "bg-red-50 border-red-200";
    return "bg-gray-50 border-gray-200";
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
          onClick={fetchBalances}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const currentUserBalance = getCurrentUserBalance();
  const hasBalances = balances.some(b => b.net_balance !== 0);

  if (!hasBalances) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚖️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">All settled up!</h3>
        <p className="text-gray-500">No outstanding balances in this group.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'summary'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Your Balance
        </button>
        <button
          onClick={() => setActiveTab('detailed')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'detailed'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Everyone
        </button>
      </div>

      {/* Your Balance Summary */}
      {activeTab === 'summary' && currentUserBalance && (
        <div className="space-y-4">
          {/* Your net balance */}
          <div className={`p-4 rounded-lg border ${getBalanceBg(currentUserBalance.net_balance)}`}>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Your net balance</p>
              <p className={`text-2xl font-bold ${getBalanceColor(currentUserBalance.net_balance)}`}>
                {currentUserBalance.net_balance === 0 ? (
                  "₹0.00"
                ) : currentUserBalance.net_balance > 0 ? (
                  `+₹${currentUserBalance.net_balance.toFixed(2)}`
                ) : (
                  `-₹${Math.abs(currentUserBalance.net_balance).toFixed(2)}`
                )}
              </p>
              <p className={`text-sm ${getBalanceColor(currentUserBalance.net_balance)}`}>
                {getBalanceText(currentUserBalance.net_balance)}
              </p>
            </div>
          </div>

          {/* You owe */}
          {currentUserBalance.owes.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">You owe</h4>
              <div className="space-y-2">
                {currentUserBalance.owes.map((debt, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {debt.user.profile_pic ? (
                        <img
                          src={debt.user.profile_pic}
                          alt={debt.user.full_name}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-gray-600">
                            {getUserInitials(debt.user.full_name)}
                          </span>
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{debt.user.full_name}</span>
                    </div>
                    <span className="font-semibold text-red-600">₹{debt.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* You are owed */}
          {currentUserBalance.owed_by.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">You are owed</h4>
              <div className="space-y-2">
                {currentUserBalance.owed_by.map((credit, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {credit.user.profile_pic ? (
                        <img
                          src={credit.user.profile_pic}
                          alt={credit.user.full_name}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-gray-600">
                            {getUserInitials(credit.user.full_name)}
                          </span>
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{credit.user.full_name}</span>
                    </div>
                    <span className="font-semibold text-green-600">₹{credit.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Everyone's Balances */}
      {activeTab === 'detailed' && (
        <div className="space-y-3">
          {balances
            .sort((a, b) => b.net_balance - a.net_balance) // Sort by balance descending
            .map((balance) => (
              <div key={balance.user.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {balance.user.profile_pic ? (
                      <img
                        src={balance.user.profile_pic}
                        alt={balance.user.full_name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-gray-600">
                          {getUserInitials(balance.user.full_name)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {balance.user.full_name}
                        {balance.user.id === currentUserId && " (You)"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {balance.net_balance === 0 
                          ? "Settled up"
                          : balance.net_balance > 0 
                            ? "Gets back"
                            : "Owes"
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${getBalanceColor(balance.net_balance)}`}>
                      {balance.net_balance === 0 ? (
                        "₹0.00"
                      ) : balance.net_balance > 0 ? (
                        `+₹${balance.net_balance.toFixed(2)}`
                      ) : (
                        `-₹${Math.abs(balance.net_balance).toFixed(2)}`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
