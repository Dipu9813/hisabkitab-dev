"use client";
import { useState, useEffect } from "react";

interface BusinessMember {
  user_id: string;
  joined_at: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  is_owner: boolean;
  details: {
    id: string;
    full_name: string;
    ph_number: string;
    profile_pic?: string;
  };
}

interface BusinessMemberManagerProps {
  businessId: string;
  token: string;
  currentUserId: string;
  onClose?: () => void;
}

export default function BusinessMemberManager({
  businessId,
  token,
  currentUserId,
  onClose
}: BusinessMemberManagerProps) {
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [business, setBusiness] = useState<{ id: string; name: string; is_owner: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showTransferOwnership, setShowTransferOwnership] = useState(false);
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [bulkPhoneNumbers, setBulkPhoneNumbers] = useState("");
  const [selectedRole, setSelectedRole] = useState<'member' | 'admin' | 'viewer'>('member');
  const [addingMember, setAddingMember] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    fetchMembers();
  }, [businessId]);

  const fetchMembers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`http://localhost:3000/business/${businessId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch members");
      }

      const data = await response.json();
      setBusiness(data.business);
      setMembers(data.members || []);
    } catch (err: any) {
      console.error("Error fetching members:", err);
      setError(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!newMemberPhone.trim()) {
      setError("Phone number is required");
      return;
    }

    setAddingMember(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:3000/business/${businessId}/members`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone_number: newMemberPhone.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add member");
      }

      const data = await response.json();
      setSuccess(`${data.member.full_name} added successfully!`);
      setNewMemberPhone("");
      setShowAddMember(false);
      fetchMembers();
    } catch (err: any) {
      console.error("Error adding member:", err);
      setError(err.message || "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const bulkAddMembers = async () => {
    const phoneNumbers = bulkPhoneNumbers
      .split('\\n')
      .map(phone => phone.trim())
      .filter(phone => phone.length > 0);

    if (phoneNumbers.length === 0) {
      setError("Please enter at least one phone number");
      return;
    }

    if (phoneNumbers.length > 50) {
      setError("Cannot add more than 50 members at once");
      return;
    }

    setBulkProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:3000/business/${businessId}/members/bulk`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          phone_numbers: phoneNumbers, 
          role: selectedRole 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to bulk add members");
      }

      const data = await response.json();
      const { summary } = data;
      setSuccess(`Bulk add completed: ${summary.successful} added, ${summary.skipped} skipped, ${summary.failed} failed`);
      setBulkPhoneNumbers("");
      setShowBulkAdd(false);
      fetchMembers();
    } catch (err: any) {
      console.error("Error bulk adding members:", err);
      setError(err.message || "Failed to bulk add members");
    } finally {
      setBulkProcessing(false);
    }
  };

  const bulkRemoveMembers = async () => {
    if (selectedMembers.length === 0) {
      setError("Please select members to remove");
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${selectedMembers.length} member(s)?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:3000/business/${businessId}/members/bulk`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ member_ids: selectedMembers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to bulk remove members");
      }

      const data = await response.json();
      const { summary } = data;
      setSuccess(`Bulk remove completed: ${summary.successful} removed, ${summary.skipped} skipped, ${summary.failed} failed`);
      setSelectedMembers([]);
      fetchMembers();
    } catch (err: any) {
      console.error("Error bulk removing members:", err);
      setError(err.message || "Failed to bulk remove members");
    }
  };

  const removeMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the business?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:3000/business/${businessId}/members/${memberId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove member");
      }

      setSuccess(`${memberName} removed successfully!`);
      fetchMembers();
    } catch (err: any) {
      console.error("Error removing member:", err);
      setError(err.message || "Failed to remove member");
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'member' | 'admin' | 'viewer') => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:3000/business/${businessId}/members/${memberId}/role`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update member role");
      }

      const data = await response.json();
      setSuccess(`${data.member.full_name}'s role updated to ${newRole}!`);
      fetchMembers();
    } catch (err: any) {
      console.error("Error updating member role:", err);
      setError(err.message || "Failed to update member role");
    }
  };

  const transferOwnership = async (newOwnerId: string) => {
    const member = members.find(m => m.user_id === newOwnerId);
    if (!member) return;

    if (!window.confirm(`Are you sure you want to transfer ownership to ${member.details.full_name}? This action cannot be undone.`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:3000/business/${businessId}/transfer-ownership`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_owner_id: newOwnerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transfer ownership");
      }

      const data = await response.json();
      setSuccess(`Ownership transferred to ${data.new_owner.name}!`);
      setShowTransferOwnership(false);
      fetchMembers();
    } catch (err: any) {
      console.error("Error transferring ownership:", err);
      setError(err.message || "Failed to transfer ownership");
    }
  };

  const leaveBusiness = async () => {
    if (!window.confirm(`Are you sure you want to leave ${business?.name}?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:3000/business/${businessId}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to leave business");
      }

      setSuccess("Successfully left the business!");
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Error leaving business:", err);
      setError(err.message || "Failed to leave business");
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Business Members</h2>
          <p className="text-sm text-gray-600">{business?.name}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {business?.is_owner && (
          <>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              {showAddMember ? "Cancel" : "Add Member"}
            </button>
            <button
              onClick={() => setShowBulkAdd(!showBulkAdd)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              {showBulkAdd ? "Cancel" : "Bulk Add"}
            </button>
            <button
              onClick={() => setShowTransferOwnership(!showTransferOwnership)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
            >
              {showTransferOwnership ? "Cancel" : "Transfer Ownership"}
            </button>
            {selectedMembers.length > 0 && (
              <button
                onClick={bulkRemoveMembers}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Remove Selected ({selectedMembers.length})
              </button>
            )}
          </>
        )}
        {!business?.is_owner && (
          <button
            onClick={leaveBusiness}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Leave Business
          </button>
        )}
      </div>

      {/* Add Member Form */}
      {showAddMember && business?.is_owner && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Add New Member</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Phone number"
              value={newMemberPhone}
              onChange={(e) => setNewMemberPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              disabled={addingMember}
            />
            <div className="flex gap-3">
              <button
                onClick={addMember}
                disabled={addingMember}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
              >
                {addingMember ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Form */}
      {showBulkAdd && business?.is_owner && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Bulk Add Members</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role for new members:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'member' | 'admin' | 'viewer')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <textarea
              placeholder="Enter phone numbers (one per line)"
              value={bulkPhoneNumbers}
              onChange={(e) => setBulkPhoneNumbers(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              disabled={bulkProcessing}
            />
            <div className="flex gap-3">
              <button
                onClick={bulkAddMembers}
                disabled={bulkProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
              >
                {bulkProcessing ? "Processing..." : "Bulk Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership */}
      {showTransferOwnership && business?.is_owner && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Transfer Ownership</h3>
          <p className="text-sm text-gray-600 mb-3">
            Select a member to transfer ownership to. This action cannot be undone.
          </p>
          <div className="space-y-2">
            {members.filter(m => !m.is_owner).map((member) => (
              <button
                key={member.user_id}
                onClick={() => transferOwnership(member.user_id)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  {member.details.profile_pic ? (
                    <img
                      src={member.details.profile_pic}
                      alt={member.details.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs">
                      {getUserInitials(member.details.full_name)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{member.details.full_name}</p>
                    <p className="text-sm text-gray-500">{member.details.ph_number}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            Members ({members.length})
          </h3>
          {business?.is_owner && members.filter(m => !m.is_owner).length > 0 && (
            <button
              onClick={() => {
                if (selectedMembers.length === members.filter(m => !m.is_owner).length) {
                  setSelectedMembers([]);
                } else {
                  setSelectedMembers(members.filter(m => !m.is_owner).map(m => m.user_id));
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedMembers.length === members.filter(m => !m.is_owner).length ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>
        
        {members.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No members found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {business?.is_owner && !member.is_owner && (
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.user_id)}
                      onChange={() => toggleMemberSelection(member.user_id)}
                      className="w-4 h-4 text-blue-600"
                    />
                  )}
                  
                  {member.details.profile_pic ? (
                    <img
                      src={member.details.profile_pic}
                      alt={member.details.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      {getUserInitials(member.details.full_name)}
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {member.details.full_name}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      {member.user_id === currentUserId && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.details.ph_number}</p>
                    <p className="text-xs text-gray-400">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {business?.is_owner && !member.is_owner && (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.user_id, e.target.value as 'member' | 'admin' | 'viewer')}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => removeMember(member.user_id, member.details.full_name)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Business Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-sm text-gray-600">
          <p><strong>Role:</strong> {business?.is_owner ? "Owner" : "Member"}</p>
          <p><strong>Business ID:</strong> {businessId}</p>
          <p><strong>Total Members:</strong> {members.length}</p>
        </div>
      </div>
    </div>
  );
}
