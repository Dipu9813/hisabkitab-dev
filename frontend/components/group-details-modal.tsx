"use client"

import { useEffect, useState } from "react"
import { X, Users, QrCode, Copy, Check, Plus, Crown, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import SettlementModal from "./SettlementModal"

interface GroupDetailsModalProps {
  group: any
  onClose: () => void
}

export default function GroupDetailsModal({ group, onClose }: GroupDetailsModalProps) {
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSettlement, setShowSettlement] = useState(false);

  interface BalanceUser {
    id: string;
    full_name: string;
    profile_pic: string | null;
  }

  interface OwesOwedBy {
    user: BalanceUser;
    amount: number;
  }

  interface Balance {
    user: BalanceUser;
    net_balance: number;
    owes: OwesOwedBy[];
    owed_by: OwesOwedBy[];
  }

  const [balances, setBalances] = useState<Balance[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch expenses from the endpoint as in ExpenseList
    const fetchExpenses = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/groups/${group.id}/expenses`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch expenses");
        }
        const data = await response.json();
        // Calculate total expenses (sum of all expense.amount)
        const total = (data.data || []).reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
        setTotalExpenses(total);
        // Total number of transactions is the number of expenses
        setTotalTransactions((data.data || []).length);
      } catch (err: any) {
        setError(err.message || "Failed to load expenses");
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [group.id]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.code || `GRP${group.id}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy group code:", err)
    }
  }

  // Helper to check if current user is group owner
  const isOwner = typeof window !== "undefined" && localStorage.getItem("token") && (() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.sub === group.creator_id;
    } catch {
      return false;
    }
  })();

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 w-full max-w-sm mx-auto rounded-3xl max-h-[90vh] overflow-y-auto relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-2xl"></div>
        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Group Details</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl hover:bg-white/30">
              <X className="h-6 w-6 text-slate-600" />
            </Button>
          </div>
          {/* Group Info */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-[#192168] rounded-3xl flex items-center justify-center shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-slate-800 font-bold text-xl">{group.name}</h3>
                  <p className="text-slate-600 text-sm">{group.members} members</p>
                  <p className="text-slate-600 text-sm">{group.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">रु{totalExpenses.toFixed(2)}</p>
                  <p className="text-slate-600 text-sm">Total Expenses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{totalTransactions}</p>
                  <p className="text-slate-600 text-sm">Total Transactions</p>
                </div>
              </div>
              {isOwner && (
                <Button className="w-full mt-4 bg-[#192168] rounded-3xl font-extrabold" onClick={() => setShowSettlement(true)}>
                  Settle Group
                </Button>
              )}
            </CardContent>
          </Card>


          {/* Members List */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-slate-800 font-bold text-lg">Members ({group.membersList?.length || 0})</h4>
              </div>

              <div className="space-y-3">
                {group.membersList
                  ?.slice() // copy to avoid mutating original
                  .sort((a: any, b: any) => (b.role === "Admin" ? 1 : 0) - (a.role === "Admin" ? 1 : 0))
                  .map((member: any, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar || "/placeholder.svg?height=40&width=40"} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                          {member.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800">{member.name}</p>
                          {member.role === "Admin" && <Crown className="h-4 w-4 text-yellow-500 font" />}
                        </div>
                        <p className="text-sm text-slate-600">{member.phone}</p>
                      </div>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{member.role}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          {group.transactions && group.transactions.length > 0 && (
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl">
              <CardContent className="p-6">
                <h4 className="text-slate-800 font-bold text-lg mb-4">Recent Activity</h4>
                <div className="space-y-3">
                  {group.transactions.map((transaction: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            transaction.type === "received" ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          <UserIcon
                            className={`h-4 w-4 ${transaction.type === "received" ? "text-green-600" : "text-red-600"}`}
                          />
                        </div>
                        <div>
                          <p className="text-slate-800 font-medium text-sm">
                            {transaction.from ? `From ${transaction.from}` : `To ${transaction.to}`}
                          </p>
                          <p className="text-slate-600 text-xs">{transaction.time}</p>
                        </div>
                      </div>
                      <span className="text-slate-800 font-semibold">{transaction.amount}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {showSettlement && (
            <SettlementModal
              groupId={group.id}
              token={localStorage.getItem("token") || ""}
              onClose={() => setShowSettlement(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

