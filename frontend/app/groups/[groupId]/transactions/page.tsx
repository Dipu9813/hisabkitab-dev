"use client";
import React, { useEffect, useState } from 'react';
import ExpenseManager from '@/components/ExpenseManager';

interface Group {
  id: string;
  name: string;
  phase?: 'active' | 'settlement';
}

const GroupTransactionsPage = ({ params }: { params: Promise<{ groupId: string }> }) => {
  const { groupId } = React.use(params);
  const [token, setToken] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      const res = await fetch(`http://localhost:3000/groups/${groupId}`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (error || !group || !token) {
    return (
      <div className="p-8 text-center text-red-600">{error || 'Group not found.'}</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">{group.name}</h1>
            <span className={group.phase === 'settlement' ? 'text-red-600' : 'text-green-600'}>
              {group.phase || 'active'}
            </span>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-6 py-6">
        <ExpenseManager
          token={token}
          groupId={group.id}
          groupName={group.name}
          currentUserId={currentUserId}
          groupPhase={group.phase}
        />
      </div>
    </div>
  );
};

export default GroupTransactionsPage;
