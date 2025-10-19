"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { OfflineGroup } from '@/lib/offline/storage';

interface AddExpenseModalProps {
  group: OfflineGroup;
  onClose: () => void;
  onAddExpense: (expense: Omit<any, 'id'>) => void;
}

export default function AddExpenseModal({ group, onClose, onAddExpense }: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(group.members[0]?.id || '');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [splitAmong, setSplitAmong] = useState<string[]>(group.members.map(m => m.id));
  const [customSplits, setCustomSplits] = useState<{ [memberId: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSplitAmongChange = (memberId: string, checked: boolean) => {
    if (checked) {
      setSplitAmong([...splitAmong, memberId]);
    } else {
      setSplitAmong(splitAmong.filter(id => id !== memberId));
    }
  };

  const handleCustomSplitChange = (memberId: string, value: string) => {
    setCustomSplits({ ...customSplits, [memberId]: value });
  };

  const validateCustomSplits = () => {
    const totalAmount = parseFloat(amount);
    if (!totalAmount) return false;

    const customTotal = splitAmong.reduce((sum, memberId) => {
      const value = parseFloat(customSplits[memberId] || '0');
      return sum + value;
    }, 0);

    return Math.abs(customTotal - totalAmount) < 0.01; // Allow small floating point differences
  };

  const getEqualSplitAmount = () => {
    const totalAmount = parseFloat(amount);
    if (!totalAmount || splitAmong.length === 0) return 0;
    return totalAmount / splitAmong.length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    const totalAmount = parseFloat(amount);
    if (!totalAmount || totalAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!paidBy) {
      alert('Please select who paid');
      return;
    }

    if (splitAmong.length === 0) {
      alert('Please select at least one person to split among');
      return;
    }

    if (splitType === 'custom' && !validateCustomSplits()) {
      alert('Custom split amounts must add up to the total amount');
      return;
    }

    setLoading(true);
    
    try {
      const expense = {
        description: description.trim(),
        amount: totalAmount,
        paidBy,
        splitAmong,
        date: new Date().toISOString(),
        splitType,
        ...(splitType === 'custom' && {
          customSplits: Object.fromEntries(
            splitAmong.map(id => [id, parseFloat(customSplits[id] || '0')])
          )
        })
      };

      onAddExpense(expense);
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };
//expense can be added in offline mode 
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-3xl w-full max-w-md mx-4 max-h-[90vh] border border-white/30 overflow-hidden"
      style={{ marginTop: '-270px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold" style={{ color: "#192167" }}>Add Expense</h2>
          <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="p-2"
          >
        <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" style={{ color: "#31377e", fontWeight: "bold" }}>Description</Label>
          <Textarea
            id="description"
            placeholder="e.g., Dinner at restaurant, Grocery shopping, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            maxLength={100}
            rows={3}
          />
        </div>

        {/* Amount */}
        <div className="space-y-2">
            <Label htmlFor="amount" style={{ color: "#31377e", fontWeight: "bold" }}>Amount (रु)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-200 border-gray-300 text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            min="0.01"
            step="0.01"
          />
        </div>

        {/* Paid By */}
        <div className="space-y-2">
          <Label htmlFor="paidBy" style={{ color: "#31377e", fontWeight: "bold"  }}>Paid by</Label>
            <select
          id="paidBy"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          style={{ color: "#31377e" }}
            >
          {group.members.map((member) => (
            <option key={member.id} value={member.id} style={{ color: "#31377e" }}>
              {member.name}
            </option>
          ))}
            </select>
            <style jsx global>{`
          select.custom-select option:hover, 
          select.custom-select option:focus {
            background-color: #252c74 !important;
            color: #fff !important;
          }
            `}</style>
        </div>

        {/* Split Type */}
        <div className="space-y-3">
          <Label style={{ color: "#31377e" , fontWeight: "bold"  }}>Split Type</Label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
          <input
          type="radio"
          value="equal"
          checked={splitType === 'equal'}
          onChange={() => setSplitType('equal')}
          className="text-indigo-600"
          style={{ accentColor: "#192168" }}
          />
          <span className="text-sm" style={{ color: "#31377e" }}>Equal split</span>
            </label>
            <label className="flex items-center space-x-2">
          <input
          type="radio"
          value="custom"
          checked={splitType === 'custom'}
          onChange={() => setSplitType('custom')}
          className="text-indigo-600"
          style={{ accentColor: "#192168" }}
          />
          <span className="text-sm" style={{ color: "#31377e" }}>Custom amounts</span>
            </label>
          </div>
        </div>

        {/* Split Among */}
        <div className="space-y-3">
          <Label style={{ color: "#31377e" , fontWeight: "bold" }}>Split among</Label>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {group.members.map((member) => {
          const isSelected = splitAmong.includes(member.id);
          return (
            <div key={member.id} className="space-y-2">
            <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id={`member-${member.id}`}
              checked={isSelected}
              onChange={(e) => handleSplitAmongChange(member.id, e.target.checked)}
              className="text-indigo-600"
              style={{ accentColor: "#192168" }}
            />
            <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center`}>
              <span className="text-white font-medium text-xs">
              {member.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <label
              htmlFor={`member-${member.id}`}
              className="flex-1 font-medium cursor-pointer"
              style={{ color: "#31377e" }}
            >
              {member.name}
            </label>
            {splitType === 'equal' && isSelected && (
              <span className="text-sm" style={{ color: "#31378e" }}>
              रु {getEqualSplitAmount().toFixed(2)}
              </span>
            )}
            </div>
              
              {splitType === 'custom' && isSelected && (
            <div className="ml-11">
              <Input
                type="number"
                placeholder="0.00"
                value={customSplits[member.id] || ''}
                onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                className="w-32 bg-gray-200 placeholder-zinc-800 text-black border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                min="0.01"
                step="0.01"
              />
            </div>
              )}
            </div>
          );
            })}
          </div>

          {splitType === 'custom' && splitAmong.length > 0 && (
            <div className="bg-gray-50 border rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: "#31377e" }}>Total custom splits:</span>
            <span className="font-medium" style={{ color: "#31377e" }}>
              रु {splitAmong.reduce((sum, id) => sum + parseFloat(customSplits[id] || '0'), 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm" style={{ color: "#31377e" }}>Expense amount:</span>
            <span className="font-medium" style={{ color: "#31377e" }}>₹{parseFloat(amount || '0').toFixed(2)}</span>
          </div>
          {!validateCustomSplits() && amount && (
            <p className="text-xs text-red-600 mt-2">
               Custom splits must add up to the total amount
            </p>
          )}
            </div>
          )}
        </div>
          </div>

          {/* Footer */}
          <div className="border-t p-6">
        <div className="flex space-x-3">
            <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
            style={{ backgroundColor: "#31377e", color: "#fff" }}
            >
            Cancel
            </Button>
            <Button
            type="submit"
            className="flex-1"
            style={{ backgroundColor: "#192168", color: "#fff" }}
            disabled={
          loading || 
          !description.trim() || 
          !amount || 
          parseFloat(amount) <= 0 || 
          splitAmong.length === 0 ||
          (splitType === 'custom' && !validateCustomSplits())
            }
            >
            {loading ? 'Adding...' : 'Add Expense'}
            </Button>
        </div>
          </div>
        </form>
      </div>
    </div>
  );
}
