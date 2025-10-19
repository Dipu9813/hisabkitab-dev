"use client";
import React, { useEffect, useState, useRef } from 'react';
import ExpenseManager from '@/components/ExpenseManager';
import { X } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  phase?: 'active' | 'settlement';
}

interface GroupTransactionsModalProps {
  groupId: string;
  onClose: () => void;
}

const GroupTransactionsModal: React.FC<GroupTransactionsModalProps> = ({ groupId, onClose }) => {
  const [token, setToken] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
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
    try {
      const decoded = JSON.parse(atob(storedToken.split('.')[1]));
      setCurrentUserId(decoded.sub);
    } catch {
      setError('Invalid token. Please log in again.');
      setLoading(false);
      return;
    }
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

  // Add blur to all background elements when modal is open
  useEffect(() => {
    const appRoot = document.getElementById('__next') || document.body;
    if (appRoot) {
      appRoot.classList.add('modal-blur-bg');
    }
    return () => {
      if (appRoot) {
        appRoot.classList.remove('modal-blur-bg');
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300" onClick={handleBackdropClick}>
        <div className="bg-[#eaf6ff] w-full max-w-lg sm:max-w-xl mx-auto rounded-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl border border-blue-100 flex flex-col items-center justify-center p-8 scale-100 animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  if (error || !group || !token) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all duration-300" onClick={handleBackdropClick}>
        <div className="bg-[#eaf6ff] w-full max-w-lg sm:max-w-xl mx-auto rounded-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl border border-blue-100 flex flex-col items-center justify-center p-8 scale-100 animate-fade-in">
          <div className="p-8 text-center text-red-600">{error || 'Group not found.'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all duration-300" onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className="bg-[#f8fbff] w-full max-w-lg sm:max-w-xl mx-auto rounded-3xl min-h-[700px] max-h-[95vh] overflow-y-auto relative shadow-2xl border border-blue-100 scale-100 animate-fade-in"
        style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)' }}
        onClick={e => e.stopPropagation()} // Prevent modal click from closing
      >
        <header className="bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm border-b border-blue-200 rounded-t-3xl px-8 py-5">
          <div className="flex items-center justify-between">
            <h1
              className="text-2xl font-bold text-gray-900 tracking-tight truncate max-w-[200px] sm:max-w-[320px] overflow-hidden whitespace-nowrap"
              title={group.name}
            >
              {group.name}
            </h1>
            <span
              className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border transition-colors
                ${group.phase === 'settlement'
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : 'bg-green-100 text-green-700 border-green-200'}`}
            >
              {group.phase ? group.phase.charAt(0).toUpperCase() + group.phase.slice(1) : 'Active'}
            </span>
          </div>
        </header>
        <div className="px-8 py-8 sm:px-10 sm:py-10">
          <ExpenseManager
            token={token}
            groupId={group.id}
            groupName={group.name}
            currentUserId={currentUserId}
            groupPhase={group.phase}
          />
        </div>
      </div>
    </div>
  );
};

export default GroupTransactionsModal;

