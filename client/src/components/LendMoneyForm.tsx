"use client";
import { useState, useEffect } from "react";

interface UserDetails {
  id: string;
  full_name: string;
  ph_number: string;
  profile_pic?: string;
}

export default function LendMoneyForm({ token }: { token: string }) {
  const [phNumber, setPhNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [deadline, setDeadline] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  // Search for user when phone number changes
  const searchUser = async (phone: string) => {
    if (!phone || phone.length < 10) {
      setUserDetails(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`http://localhost:3000/users/search/${phone}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (res.status === 404) {
        setUserDetails(null);
        setIsSearching(false);
        return;
      }
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      setUserDetails(data.data);
    } catch (err: any) {
      console.error("Error searching user:", err);
      setUserDetails(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced phone number input handler
  const handlePhoneChange = (phone: string) => {
    setPhNumber(phone);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for search
    const timeout = setTimeout(() => {
      searchUser(phone);
    }, 500); // Wait 500ms after user stops typing
    
    setSearchTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    try {
      const res = await fetch("http://localhost:3000/lend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ ph_number: phNumber, amount, remark: reason, deadline }),
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      // Check content type to avoid parsing HTML as JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      
      const data = await res.json();
        setSuccess("Loan request sent!");
      setPhNumber("");
      setAmount("");
      setReason("");
      setDeadline("");
      setUserDetails(null);
    } catch (err: any) {
      console.error("Error creating loan:", err);
      setError(err.message || "Failed to create loan record");
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold">Lend Money</h2>
      
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Receiver Phone Number"
          className="w-full border p-2 rounded"
          value={phNumber}
          onChange={e => handlePhoneChange(e.target.value)}
          required
        />
        
        {/* User Details Display */}
        {isSearching && (
          <div className="flex items-center p-2 bg-gray-50 rounded">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">Searching...</span>
          </div>
        )}
        
        {userDetails && !isSearching && (
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex-shrink-0">
              {userDetails.profile_pic ? (
                <img 
                  src={userDetails.profile_pic} 
                  alt={userDetails.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {userDetails.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{userDetails.full_name}</p>
              <p className="text-sm text-gray-500">{userDetails.ph_number}</p>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Found
              </span>
            </div>
          </div>
        )}
        
        {phNumber && !userDetails && !isSearching && phNumber.length >= 10 && (
          <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white">
                ✕
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-900">User not found</p>
              <p className="text-sm text-red-700">Please check the phone number</p>
            </div>
          </div>
        )}
      </div>
      
      <input
        type="number"
        placeholder="Amount"
        className="w-full border p-2 rounded"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Reason"
        className="w-full border p-2 rounded"
        value={reason}
        onChange={e => setReason(e.target.value)}
      />
      <input
        type="date"
        placeholder="Deadline"
        className="w-full border p-2 rounded"
        value={deadline}
        onChange={e => setDeadline(e.target.value)}
        required
      />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Send Request</button>
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}
    </form>
  );
}
