"use client";

import { useState } from 'react';
import { 
  Plus, 
  Receipt, 
  Calculator, 
  Users, 
  Calendar,
  Trash2,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OfflineGroup, OfflineStorage } from '@/lib/offline/storage';

interface GroupDetailViewProps {
  group: OfflineGroup;
  onAddExpense: () => void;
  onViewSettlement: () => void;
  onRefresh: () => void;
}

export default function GroupDetailView({ 
  group, 
  onAddExpense, 
  onViewSettlement, 
  onRefresh 
}: GroupDetailViewProps) {
  const [showMembers, setShowMembers] = useState(false);

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      OfflineStorage.deleteExpense(group.id, expenseId);
      onRefresh();
    }
  };

  const handleExportGroup = () => {
    const data = OfflineStorage.exportGroupData(group.id);
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${group.name}_data.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getTotalExpenses = () => {
    return group.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getMemberName = (memberId: string) => {
    const member = group.members.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  const formatCurrency = (amount: number) => {
    return `रु
${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Group Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white rounded-2xl">
            <CardContent className="p-4 text-center bg-white rounded-2xl">
            <Users className="h-6 w-6 mx-auto mb-2" style={{ color: '#192168' }} />
            <p className="text-2xl font-bold text-gray-900">{group.members.length}</p>
            <p className="text-sm text-gray-600">Members</p>
            </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl">
            <CardContent className="p-4 text-center bg-white rounded-2xl">
            <span
              className="flex items-center justify-center mx-auto mb-2"
              style={{
              color: '#16a34a',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              border: '1.5px solid #16a34a',
              borderRadius: '8px',
              width: '1.8rem',
              height: '1.8rem',
              background: '#e6f9ed'
              }}
            >
              रु
            </span>
            <p className="text-2xl font-bold text-gray-900">{group.expenses.length}</p>
            <p className="text-sm text-gray-600">Expenses</p>
            </CardContent>
        </Card>
      </div>

      {/* Total Amount */}
      <Card className="bg-white rounded-2xl">
        <CardContent className="p-4 text-center bg-white rounded-2xl">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Expenses</h3>
            <p className="text-3xl font-bold" style={{ color: '#192168' }}>
            {formatCurrency(getTotalExpenses())}
            </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          onClick={onAddExpense}
          className="h-12 rounded-2xl"
          style={{ backgroundColor: '#192168', color: '#fff' }}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Expense
        </Button>
        <Button 
          onClick={onViewSettlement}
          variant="outline"
          className="h-12 rounded-2xl"
          disabled={group.expenses.length === 0}
          style={{ color: '#fff', backgroundColor: '#252c74', borderColor: '#252c74' }}
        >
          <Calculator className="h-5 w-5 mr-2" />
          Settle Up
        </Button>
      </div>

      {/* Members Section */}
      <Card className="bg-white rounded-2xl">
        <CardHeader className="bg-white rounded-t-2xl">
          <div className="flex items-center justify-between rounded-2xl">
            <CardTitle className="text-lg" style={{ color: '#192168' }}>Group Members</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMembers(!showMembers)}
              className="rounded-2xl text-black"
            >
              {showMembers ? 'Hide' : 'view'}
            </Button>
          </div>
        </CardHeader>
        {showMembers && (
          <CardContent className="space-y-3 bg-white rounded-b-2xl">
            {group.members.map((member) => (
              <div key={member.id} className="flex items-center space-x-3 rounded-2xl">
                <div className={`w-10 h-10 rounded-full ${member.color} flex items-center justify-center`}>
                  <span className="text-white font-medium text-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 rounded-2xl">
                  <p className="font-medium text-gray-900">{member.name}</p>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
      
      {/* Expenses List */}
      <Card className="bg-white rounded-2xl">
        <CardHeader className="bg-white rounded-t-2xl">
          <CardTitle className="text-lg" style={{ color: '#192168' }}>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="bg-white rounded-b-2xl">
          {group.expenses.length === 0 ? (
            <div className="text-center py-8 rounded-2xl ">
                <span
                className="flex items-center justify-center mx-auto mb-4 rounded-2xl"
                style={{
                  color: '#334155', // slate-800 (light dark bluish)
                  fontWeight: 'bold',
                  fontSize: '2.5rem',
                  border: '2px solid #334155',
                  borderRadius: '12px',
                  width: '3.5rem',
                  height: '3.5rem',
                  background: '#e0e7ef' // subtle blue-gray background
                }}
                >
                रु
                </span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Expense Recorded</h3>
              <p className="text-gray-600 mb-4">
              Add your first Expenses.
              </p>
                <Button 
                onClick={onAddExpense}
                style={{ backgroundColor: '#192168', color: '#fff' }}
                className="rounded-2xl"
                >
                <Plus className="h-4 w-4 mr-2" />
                Record Expense
                </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {group.expenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((expense) => (
                  <div key={expense.id} className="border rounded-2xl p-4 bg-gray-100">
                    <div className="flex items-start justify-between rounded-2xl">
                      <div className="flex-1 rounded-2xl">
                        <h4 className="font-medium text-gray-900">{expense.description}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Paid by <span className="font-medium">{getMemberName(expense.paidBy)}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {formatDate(expense.date)}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Split among: {expense.splitAmong.map(id => getMemberName(id)).join(', ')}
                        </p>
                      </div>
                      <div className="text-right rounded-2xl">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-2 rounded-2xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="bg-white rounded-2xl">
        <CardHeader className="bg-white rounded-t-2xl">
          <CardTitle className="text-lg" style={{ color: '#192168' }}>Export Data</CardTitle>
        </CardHeader>
        <CardContent className="bg-white rounded-b-2xl">
          <p className="text-sm text-gray-600 mb-4">
            Export your group data to save a backup or share with others.
          </p>
          <div className="flex space-x-3 rounded-2xl">
            <Button 
              variant="outline" 
              onClick={handleExportGroup}
              className="flex-1 rounded-2xl"
              style={{ backgroundColor: '#31377e', color: '#fff', borderColor: '#192168' }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

