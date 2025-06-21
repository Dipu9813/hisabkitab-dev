"use client";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface GroupMember {
  user_id: string;
  details: {
    id: string;
    full_name: string;
    profile_pic?: string;
  };
}

interface AddExpenseFormProps {
  token: string;
  groupId: string;
  members: GroupMember[];
  onExpenseAdded: () => void;
  onClose: () => void;
}

export default function AddExpenseForm({ 
  token, 
  groupId, 
  members, 
  onExpenseAdded, 
  onClose 
}: AddExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [payerId, setPayerId] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [splitPreview, setSplitPreview] = useState<number[]>([]);

  const categories = [
    { value: "general", label: "General", icon: "💼" },
    { value: "food", label: "Food & Dining", icon: "🍽️" },
    { value: "transport", label: "Transportation", icon: "🚗" },
    { value: "accommodation", label: "Accommodation", icon: "🏨" },
    { value: "entertainment", label: "Entertainment", icon: "🎬" },
    { value: "shopping", label: "Shopping", icon: "🛍️" },
    { value: "medical", label: "Medical", icon: "🏥" },
    { value: "other", label: "Other", icon: "📦" }
  ];
  // Initialize with all members selected
  useEffect(() => {
    if (members.length > 0 && selectedParticipants.length === 0) {
      const allMemberIds = members.map(m => m.user_id);
      setSelectedParticipants(allMemberIds);
      
      // Set current user as default payer
      if (!payerId && token) {
        try {
          const currentUserId = jwtDecode<{ sub: string }>(token).sub;
          // Check if current user is in the group members
          if (allMemberIds.includes(currentUserId)) {
            setPayerId(currentUserId);
          } else {
            // Fallback to first member if current user not found
            setPayerId(allMemberIds[0]);
          }
        } catch {
          // Fallback to first member if JWT decode fails
          setPayerId(allMemberIds[0]);
        }
      }
    }
  }, [members, selectedParticipants.length, payerId, token]);

  // Calculate split preview when amount or participants change
  useEffect(() => {
    if (amount && selectedParticipants.length > 0) {
      const totalAmount = parseFloat(amount);
      if (!isNaN(totalAmount) && totalAmount > 0) {
        const splits = calculateEqualSplit(totalAmount, selectedParticipants.length);
        setSplitPreview(splits);
      } else {
        setSplitPreview([]);
      }
    } else {
      setSplitPreview([]);
    }
  }, [amount, selectedParticipants]);

  const calculateEqualSplit = (total: number, count: number): number[] => {
    const totalCents = Math.round(total * 100);
    const baseCents = Math.floor(totalCents / count);
    const remainder = totalCents % count;
    
    const splits = [];
    for (let i = 0; i < count; i++) {
      const extraCent = i < remainder ? 1 : 0;
      splits.push((baseCents + extraCent) / 100);
    }
    
    return splits;
  };

  const handleParticipantToggle = (memberId: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(memberId)) {
        // Don't allow removing if it's the only participant
        if (prev.length <= 1) return prev;
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSelectAll = () => {
    const allMemberIds = members.map(m => m.user_id);
    setSelectedParticipants(allMemberIds);
  };

  const handleSelectNone = () => {
    // Keep at least one participant
    if (selectedParticipants.length > 1) {
      setSelectedParticipants([selectedParticipants[0]]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description || !payerId || selectedParticipants.length === 0) {
      setError("Please fill in all required fields");
      return;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`http://localhost:3000/groups/${groupId}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: numAmount,
          description: description.trim(),
          payerId,
          participantIds: selectedParticipants,
          category
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add expense");
      }
      
      // Success
      onExpenseAdded();
      onClose();
      
    } catch (err: any) {
      console.error("Error adding expense:", err);
      setError(err.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.user_id === memberId);
    return member?.details?.full_name || "Unknown Member";
  };

  const getMemberAvatar = (memberId: string) => {
    const member = members.find(m => m.user_id === memberId);
    return member?.details?.profile_pic;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Expense</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What was this expense for?"
              required
              disabled={loading}
              maxLength={200}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who Paid? <span className="text-red-500">*</span>
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            >
              <option value="">Select payer...</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.details.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Participants */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Split Between <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800"
                  disabled={loading}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleSelectNone}
                  className="text-xs text-gray-600 hover:text-gray-800"
                  disabled={loading || selectedParticipants.length <= 1}
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {members.map((member) => {
                const isSelected = selectedParticipants.includes(member.user_id);
                const splitAmount = splitPreview.length > 0 && isSelected 
                  ? splitPreview[selectedParticipants.indexOf(member.user_id)]
                  : 0;
                
                return (
                  <div
                    key={member.user_id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isSelected 
                        ? 'border-blue-200 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleParticipantToggle(member.user_id)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={loading}
                      />
                      <div className="flex items-center">
                        {getMemberAvatar(member.user_id) ? (
                          <img
                            src={getMemberAvatar(member.user_id)}
                            alt={member.details.full_name}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-medium text-gray-600">
                              {member.details.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="font-medium text-gray-900">
                          {member.details.full_name}
                        </span>
                      </div>
                    </div>
                    
                    {isSelected && splitAmount > 0 && (
                      <span className="text-sm font-medium text-blue-600">
                        ₹{splitAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            
            {selectedParticipants.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Split between {selectedParticipants.length} member{selectedParticipants.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Split Preview */}
          {splitPreview.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Split Preview</h4>
              <div className="text-sm text-gray-600">
                <p>Total: ₹{parseFloat(amount).toFixed(2)}</p>
                <p>Each person pays: ₹{splitPreview[0]?.toFixed(2)} 
                  {splitPreview.some((amount, index) => index > 0 && amount !== splitPreview[0]) && 
                    ` - ₹${Math.max(...splitPreview).toFixed(2)}`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              disabled={loading || selectedParticipants.length === 0}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </div>
              ) : (
                "Add Expense"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
