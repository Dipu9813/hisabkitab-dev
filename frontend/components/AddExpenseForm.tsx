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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}/expenses`, {
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
    <div className="fixed inset-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full h-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl border border-blue-100 flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-100 to-blue-200 rounded-t-2xl shadow-sm">
          <h2 className="text-xl font-bold text-blue-900 tracking-tight flex items-center gap-2">
            <span className="inline-block bg-blue-200 text-blue-700 rounded-full px-2 py-1 text-xs font-semibold">New</span>
            Add Expense
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={loading}
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" /></svg>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Amount & Description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base text-gray-500">रु</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border text-black border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base shadow-sm transition-all placeholder-gray-400"
                  placeholder="0.00"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base shadow-sm transition-all placeholder-gray-400"
                placeholder="Expense for..."
                required
                disabled={loading}
                maxLength={200}
              />
            </div>
          </div>

          {/* Category & Payer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base text-black bg-white shadow-sm"
                  disabled={loading}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value} className="text-black bg-white">
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
               
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Who Paid? <span className="text-red-500">*</span>
              </label>
                <div className="relative">
                <select
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base text-black bg-white shadow-sm mr-6"
                  required
                  disabled={loading}
                >
                  <option value="" className="text-black bg-white">Select payer...</option>
                  {members.map((member) => (
                  <option key={member.user_id} value={member.user_id} className="text-black bg-white">
                    {member.details.full_name}
                  </option>
                  ))}
                </select>
                </div>
            </div>
          </div>

          {/* Participants */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Split Between <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800 underline font-semibold"
                  disabled={loading}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={handleSelectNone}
                  className="text-xs text-gray-500 hover:text-gray-700 underline font-semibold"
                  disabled={loading || selectedParticipants.length <= 1}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-30 overflow-y-auto">
              {members.map((member) => {
                const isSelected = selectedParticipants.includes(member.user_id);
                const splitAmount = splitPreview.length > 0 && isSelected 
                  ? splitPreview[selectedParticipants.indexOf(member.user_id)]
                  : 0;
                return (
                  <div
                    key={member.user_id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-colors duration-150 cursor-pointer select-none
                      ${isSelected 
                        ? 'border-blue-300 bg-blue-50 shadow-sm' 
                        : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/40'}`}
                    onClick={() => handleParticipantToggle(member.user_id)}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleParticipantToggle(member.user_id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-400 border-gray-200 rounded shadow-sm"
                        disabled={loading}
                        tabIndex={-1}
                      />
                      {getMemberAvatar(member.user_id) ? (
                        <img
                          src={getMemberAvatar(member.user_id)}
                          alt={member.details.full_name}
                          className="w-7 h-7 rounded-full border border-white shadow-sm object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full flex items-center justify-center border border-white shadow-sm">
                          <span className="text-sm font-bold text-gray-700">
                            {member.details.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium text-gray-900 text-sm">
                        {member.details.full_name}
                      </span>
                    </div>
                    {isSelected && splitAmount > 0 && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 rounded px-2 py-1">
                        रु{splitAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedParticipants.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Split between {selectedParticipants.length} member{selectedParticipants.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Split Preview */}
            {splitPreview.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 flex items-center gap-6 mt-2">
              <div className="flex-shrink-0 bg-blue-200 text-blue-700 rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold">
              रु
              </div>
              <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm">Split Preview</h4>
              <div className="text-sm text-gray-700 flex flex-col gap-1">
                <span>Total: रु{parseFloat(amount).toFixed(2)}</span>
                <span>
                Each: रु{splitPreview[0]?.toFixed(2)}
                {splitPreview.some((amount, index) => index > 0 && amount !== splitPreview[0]) &&
                  ` - रु${Math.max(...splitPreview).toFixed(2)}`
                }
                </span>
              </div>
              </div>
            </div>
            )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-semibold text-base transition-colors shadow-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-[#192168] text-white rounded-lg hover:from-blue-700 hover:to-blue-600 font-semibold text-base disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
              disabled={loading || selectedParticipants.length === 0}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

