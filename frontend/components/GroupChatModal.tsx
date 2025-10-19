"use client";
import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import AIChatScreen from '@/components/ai-chat-screen';

interface GroupChatModalProps {
  groupId: string;
  onClose: () => void;
}

const GroupChatModal: React.FC<GroupChatModalProps> = ({ groupId, onClose }) => {
  const [token, setToken] = useState<string | null>(null);
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setError('Not authenticated. Please log in.');
      setLoading(false);
      return;
    }
    setToken(storedToken);
    fetchGroupDetails(storedToken);
  }, [groupId]);

  const fetchGroupDetails = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch group details');
      const data = await res.json();
      setGroup(data.group);
    } catch (err: any) {
      setError(err.message || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
        <div className="bg-[#eaf6ff] w-full max-w-sm mx-auto rounded-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl border border-blue-100 flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  if (error || !group || !token) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
        <div className="bg-[#eaf6ff] w-full max-w-sm mx-auto rounded-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl border border-blue-100 flex flex-col items-center justify-center p-8">
          <div className="p-8 text-center text-red-600">{error || 'Chat not found.'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
      <div ref={modalRef} className="bg-[#eaf6ff] w-full max-w-sm mx-auto rounded-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl border border-blue-100">
        <button className="absolute top-4 right-4 z-10 bg-white/80 rounded-full p-2 hover:bg-white" onClick={onClose}>
          <X className="h-6 w-6 text-black" />
        </button>
        <header className="bg-white shadow-sm border-b border-gray-200 rounded-t-3xl">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Group Chat</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-6 py-6">
          <AIChatScreen />
        </div>
      </div>
    </div>
  );
};

export default GroupChatModal;

