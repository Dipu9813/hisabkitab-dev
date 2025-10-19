"use client";

import { useState, useEffect } from 'react';
import { ArrowRight, Calculator, CheckCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OfflineGroup, OfflineStorage, Settlement } from '@/lib/offline/storage';

interface SettlementViewProps {
  group: OfflineGroup;
  onBack: () => void;
}

export default function SettlementView({ group, onBack }: SettlementViewProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    calculateSettlements();
  }, [group.id]); // Only depend on group.id

  const calculateSettlements = () => {
    setLoading(true);
    try {
      const calculatedSettlements = OfflineStorage.calculateSettlements(group.id);
      setSettlements(calculatedSettlements);
    } catch (error) {
      console.error('Error calculating settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `रु ${amount.toFixed(2)}`;
  };

  const getTotalExpenses = () => {
    return group.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getSettlementSummary = () => {
    const text = [
      `${group.name} - Settlement Summary`,
      `Generated on: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      `Total Expenses: ${formatCurrency(getTotalExpenses())}`,
      `Number of Members: ${group.members.length}`,
      '',
      'Settlement Details:',
      ...settlements.map(s => `• ${s.from} pays ${s.to}: ${formatCurrency(s.amount)}`),
      '',
      settlements.length === 0 ? 'All settled up! 🎉' : `Total Transactions: ${settlements.length}`
    ].join('\n');

    return text;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getSettlementSummary());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 bg-white rounded-3xl border">
        <div className="text-center">
          <Calculator className="h-12 w-12 mx-auto mb-4 animate-pulse" style={{ color: '#192168' }} />
          <p className="text-gray-600">Calculating settlements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-white rounded-3xl border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" style={{ color: '#192168' }} />
            <span style={{ color: '#192168' }}>Settlement Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-white rounded-3xl border p-2">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalExpenses())}</p>
              <p className="text-sm text-gray-600">Total Expenses</p>
            </div>
            <div className="text-center bg-white rounded-3xl border p-2">
              <p className="text-2xl font-bold text-gray-900">{settlements.length}</p>
              <p className="text-sm text-gray-600">Transactions Needed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settlements */}
      <Card className="bg-white rounded-3xl border">
        <CardHeader>
          <CardTitle style={{ color: '#192168' }}>Who Owes Whom</CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-3xl border">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Settled Up!</h3>
              <p className="text-gray-600">
                Everyone has paid their fair share. No settlements needed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((settlement, index) => (
                <div key={index} className="border rounded-3xl p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 rounded-full p-2">
                        <span className="text-blue-700 font-medium text-sm">
                          {settlement.from.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{settlement.from}</p>
                        <p className="text-sm text-gray-600">owes</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                      <div className="text-center">
                        <p className="text-lg font-bold" style={{ color: '#192168' }}>
                          {formatCurrency(settlement.amount)}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900 text-right">{settlement.to}</p>
                        <p className="text-sm text-gray-600 text-right">receives</p>
                      </div>
                      <div className="bg-green-100 rounded-full p-2">
                        <span className="text-green-700 font-medium text-sm">
                          {settlement.to.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <Card className="bg-white rounded-3xl border">
        <CardHeader>
            <CardTitle style={{ color: '#192168' }}>Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {group.expenses.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No expenses recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {group.expenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((expense) => {
                  const paidByMember = group.members.find(m => m.id === expense.paidBy);
                  return (
                    <div key={expense.id} className="border rounded-xl p-3 bg-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{expense.description}</h4>
                          <p className="text-sm text-gray-600">
                            Paid by {paidByMember?.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Split among {expense.splitAmong.length} member{expense.splitAmong.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                          <p className="text-sm text-gray-600">
                            {expense.splitType === 'equal' 
                              ? `रु ${(expense.amount / expense.splitAmong.length).toFixed(2)} each`
                              : 'Custom split'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3 bg-white rounded-3xl border p-4">
        <Button 
          onClick={copyToClipboard}
          variant="outline"
          className="w-full rounded-2xl"
          style={{ backgroundColor: '#192168', color: '#fff' }}
        >
          <Copy className="h-4 w-4 mr-2" />
          {copied ? 'Copied!' : 'Copy Settlement Summary'}
        </Button>
        
        <Button 
          onClick={onBack}
          variant="outline"
          className="w-full rounded-2xl"
          style={{ backgroundColor: '#192168', color: '#fff' }}
        >
          Back to Group
        </Button>
      </div>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200 rounded-3xl">
        <CardContent className="p-4">
            <h4 className="font-bold mb-2" style={{ color: '#192168' }}>Settlement Tips</h4>
            <ul className="text-sm space-y-1" style={{ color: 'black' }}>
            <li>• Settlements are optimized to minimize the number of transactions</li>
            <li>• You can copy the summary to share with group members</li>
            <li>• Mark payments as complete once settled outside the app</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

