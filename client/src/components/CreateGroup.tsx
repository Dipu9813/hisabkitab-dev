"use client";
import { useState, useEffect } from "react";

interface User {
  id: string;
  full_name: string;
  ph_number: string;
  profile_pic?: string;
}

interface CreateGroupProps {
  token: string;
  onClose: () => void;
  onGroupCreated: () => void;
}

export default function CreateGroup({ token, onClose, onGroupCreated }: CreateGroupProps) {
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // Debug token on component mount
  useEffect(() => {
    console.log("🔍 CreateGroup mounted with token:", token ? 'Present' : 'Missing');
    if (token) {
      try {
        // Decode JWT token to see user info (without verification)
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔍 Token payload:', payload);
        }
      } catch (e) {
        console.log('🔍 Could not decode token:', e);
      }
    }
  }, [token]);

  // Debug component unmount
  useEffect(() => {
    return () => {
      console.log("🔍 CreateGroup component is unmounting");
    };
  }, []);
  useEffect(() => {
    fetchUsers();
  }, []);

  // Add error handling for any useEffect errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("🔍 Window error in CreateGroup:", event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("🔍 Unhandled promise rejection in CreateGroup:", event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);const fetchUsers = async () => {
    try {
      console.log('🔍 Fetching users...');
      const res = await fetch("http://localhost:3000/users", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      console.log('Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        console.error('❌ Fetch users failed:', res.status, res.statusText);
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Expected JSON but got:', contentType);
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      
      const data = await res.json();
      console.log('Fetched users data:', data);
      
      if (data.data && Array.isArray(data.data)) {
        console.log('Setting users:', data.data.length, 'users found');
        setUsers(data.data);
      } else {
        console.log('Invalid data format:', data);
        setError("Invalid response format from server");
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users: " + err.message);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("🔍 Starting group creation process...");
    console.log("Group name:", groupName);
    console.log("Selected users:", Array.from(selectedUsers));
    console.log("Total users available:", users.length);

    if (!groupName.trim()) {
      setError("Group name is required");
      setLoading(false);
      return;
    }

    if (selectedUsers.size === 0) {
      setError("Please select at least one member");
      setLoading(false);
      return;
    }

    try {
      // Get phone numbers of selected users
      const selectedUsersList = users.filter(user => selectedUsers.has(user.id));
      console.log("Selected users list:", selectedUsersList);
      
      const memberPhones = selectedUsersList
        .map(user => user.ph_number)
        .filter(phone => phone && phone.trim() !== ''); // Filter out null/empty phone numbers

      console.log("Member phones:", memberPhones);

      if (memberPhones.length === 0) {
        setError("Selected users must have valid phone numbers");
        setLoading(false);
        return;
      }

      console.log("🚀 Making API request to create group...");
      const res = await fetch("http://localhost:3000/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: groupName.trim(),
          memberPhones: memberPhones,
        }),      });

      console.log("📡 API Response status:", res.status, res.statusText);

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        console.log("❌ Request failed. Content-Type:", contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          console.log("Error data:", errorData);
          throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
        } else {
          const textResponse = await res.text();
          console.log("Non-JSON error response:", textResponse);
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
      }

      const data = await res.json();
      console.log("✅ Group created successfully:", data);
      onGroupCreated();
      onClose();
    } catch (err: any) {
      console.error("❌ Error creating group:", err);
      setError(err.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };const filteredUsers = users.filter(user => {
    // If no search term, show all users
    if (!searchTerm || searchTerm.trim() === '') {
      return true;
    }
    
    // Ensure we have valid strings to search in
    const fullName = user.full_name || '';
    const phoneNumber = user.ph_number || '';
    const searchValue = searchTerm.toLowerCase().trim();
    
    // More flexible search - includes partial matches
    return fullName.toLowerCase().includes(searchValue) ||
           phoneNumber.toLowerCase().includes(searchValue) ||
           phoneNumber.replace(/\D/g, '').includes(searchValue.replace(/\D/g, '')); // Remove non-digits for phone search
  });

  // Only log on initial load or when users change
  useEffect(() => {
    if (users.length > 0) {
      console.log('✅ Users loaded successfully:', {
        totalUsers: users.length,
        sampleUser: users[0]
      });
    }
  }, [users]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Group</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter group name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Members
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name or phone..."
            />
          </div>          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Members ({selectedUsers.size} selected)
            </label>
            
            <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
              {users.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-gray-500">Loading users...</p>
                  <p className="text-xs text-gray-400 mt-1">If this persists, check your connection</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-gray-500">
                    {searchTerm === '' ? 'No users available' : `No users found matching "${searchTerm}"`}
                  </p>
                  {searchTerm !== '' && (
                    <p className="text-xs text-gray-400 mt-1">Try a different search term or clear the search</p>
                  )}
                  {searchTerm === '' && users.length > 0 && (
                    <p className="text-xs text-red-400 mt-1">Debug: {users.length} users loaded but not showing</p>
                  )}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      selectedUsers.has(user.id) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="mr-3"
                    />                    <div className="flex-1">
                      <div className="font-medium">{user.full_name || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500">{user.ph_number || 'No phone number'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
