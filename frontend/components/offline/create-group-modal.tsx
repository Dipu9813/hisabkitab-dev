"use client";

import { useState } from 'react';
import { X, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreateGroup: (name: string, members: string[]) => void;
}

export default function CreateGroupModal({ onClose, onCreateGroup }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState(['']);
  const [loading, setLoading] = useState(false);

  const addMember = () => {
    setMembers([...members, '']);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, value: string) => {
    const updated = [...members];
    updated[index] = value;
    setMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    const validMembers = members.filter(m => m.trim()).map(m => m.trim());

    if (validMembers.length < 2) {
      alert('Please add at least 2 members');
      return;
    }

    // Check for duplicate members
    const uniqueMembers = [...new Set(validMembers)];
    if (uniqueMembers.length !== validMembers.length) {
      alert('Please remove duplicate member names');
      return;
    }

    setLoading(true);

    try {
      onCreateGroup(groupName.trim(), uniqueMembers);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };
//group expense can be added or removed
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-xl flex items-center justify-center z-50 p-4 h-[100vh]">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-3xl w-full max-w-sm max-h-[85vh] border border-white/30 overflow-hidden relative flex flex-col">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 hover:bg-red-50 rounded-lg z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
        </Button>
        
        {/* Header */}
        <div className="text-center py-4 px-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto" style={{ backgroundColor: "#192168" }}>
            <Users className="w-6 h-6 text-white" />
            </div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Create New Group</h2>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-4 space-y-4 flex-1 overflow-y-auto">
            {/* Group Name */}
            <div className="space-y-1.5">
              <Label htmlFor="groupName" className="text-sm font-semibold text-gray-700">Group Name</Label>
              <Input
              id="groupName"
              type="text"
              placeholder="e.g., Trip to Thamel, College Lunch, etc."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="h-10 bg-white border-2 border-gray-200 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-none focus:border-[#192168] transition-colors rounded-lg text-black"
              maxLength={50}
              />
            </div>

            {/* Members */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-700">Group Members</Label>
                <Button
                  type="button"
                  onClick={addMember}
                  style={{ backgroundColor: "#192168" }}
                  className="hover:bg-emerald-600 text-white border-0 rounded-full px-3 h-7 text-xs pr-4"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {members.map((member, index) => (
                    <div key={index} className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder={`Member ${index + 1}`}
                      value={member}
                      onChange={(e) => updateMember(index, e.target.value)}
                      className="h-9 bg-white border-2 border-gray-200 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-none focus:border-[#192168] transition-colors rounded-lg text-black placeholder:text-gray-400 text-sm"
                      maxLength={30}
                    />
                    {members.length > 1 && (
                      <Button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="h-9 w-9 p-0 border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 rounded-lg bg-white"
                      >
                      <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    )}
                    </div>
                ))}
              </div>

              <p className="text-xs text-gray-500">
                Add at least 2 members to create a group.
              </p>
            </div>

            {/* Info */}
            <div className="border border-green-200 rounded-lg p-3" style={{ backgroundColor: "#3a3f70" }}>
              <h4 className="font-medium text-white-900 mb-1 text-sm">Offline Mode</h4>
              <p className="text-xs text-white-600 leading-relaxed">
                This group will be stored locally on your device. When online, you can export data or create an online group.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200/50">
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg font-medium bg-white text-gray-700 text-sm"
                disabled={loading}
              >
                Cancel
              </Button>
                    <Button
                    type="submit"
                    className="flex-1 h-10 text-white border-0 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all text-sm"
                    style={{ backgroundColor: "#31377e" }}
                    disabled={loading || !groupName.trim() || members.filter(m => m.trim()).length < 2}
                    >
                    {loading ? 'Creating...' : 'Create Group'}
                    </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
