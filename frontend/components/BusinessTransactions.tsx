"use client"

import { useState, useEffect } from "react"
import { Plus, CheckCircle, XCircle, User, Calendar, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BusinessService, BusinessLoan } from "@/lib/businessService"
import BusinessLoanDetailModal from "./BusinessLoanDetailModal"

interface BusinessTransactionsProps {
  businessId: string
  businessName: string
  isOwner: boolean
  refreshBusinessBalances?: () => void
}

export default function BusinessTransactions({ businessId, businessName, isOwner, refreshBusinessBalances }: BusinessTransactionsProps) {
  const [loans, setLoans] = useState<BusinessLoan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddLoan, setShowAddLoan] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<BusinessLoan | null>(null)
  const [newLoan, setNewLoan] = useState({
    customerName: "",
    amount: "",
    description: ""
  })
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all")

  // Load business loans
  useEffect(() => {
    const loadLoans = async () => {
      try {
        setIsLoading(true)
        const filterPaid = filter === "all" ? undefined : filter === "paid"
        const businessLoans = await BusinessService.getBusinessLoans(businessId, filterPaid)
        setLoans(businessLoans)
      } catch (error) {
        console.error("Error loading business loans:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLoans()
  }, [businessId, filter])

  const handleAddLoan = async () => {
    if (!newLoan.customerName.trim() || !newLoan.amount.trim()) return

    try {
      const loan = await BusinessService.addBusinessLoan(
        businessId,
        newLoan.customerName.trim(),
        parseFloat(newLoan.amount),
        newLoan.description.trim()
      )
      
      setLoans(prev => [loan, ...prev])
      setNewLoan({ customerName: "", amount: "", description: "" })
      setShowAddLoan(false)
    } catch (error) {
      console.error("Error adding loan:", error)
      alert(error instanceof Error ? error.message : "Failed to add loan")
    }
  }

  const handleLoanUpdated = (updatedLoan: BusinessLoan) => {
    setLoans(prev => prev.map(loan => 
      loan.id === updatedLoan.id ? updatedLoan : loan
    ))
    // Refresh business balances in sidebar
    if (refreshBusinessBalances) {
      refreshBusinessBalances()
    }
  }

  const handleToggleLoanStatus = async (loanId: string, currentStatus: boolean) => {
    try {
      const updatedLoan = await BusinessService.updateLoanStatus(loanId, !currentStatus)
      handleLoanUpdated(updatedLoan)
    } catch (error) {
      console.error("Error updating loan status:", error)
      alert(error instanceof Error ? error.message : "Failed to update loan status")
    }
  }

  const formatCurrency = (amount: number) => {
    return `रु ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{businessName}</h2>
          <p className="text-slate-600">Business Transactions & Loans</p>
        </div>
        
      </div>

      {/* Add Loan Form */}
      {showAddLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full blur-2xl"></div>
            
            <div className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Add Customer Loan</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowAddLoan(false)}
                  className="text-slate-600 hover:bg-white/50 rounded-full"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Name */}
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-slate-700 font-medium">Customer Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                      id="customerName"
                      value={newLoan.customerName}
                      onChange={(e) => setNewLoan(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Enter customer name"
                      className="pl-12 h-12 rounded-2xl border-slate-200 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-slate-700 font-medium">Amount</Label>
                  <div className="relative">
                    
                    <Input
                      id="amount"
                      type="number"
                      value={newLoan.amount}
                      onChange={(e) => setNewLoan(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Enter amount"
                      className="pl-12 h-12 rounded-2xl border-slate-200 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-700 font-medium">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newLoan.description}
                    onChange={(e) => setNewLoan(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter loan description or purpose"
                    className="min-h-[100px] rounded-2xl border-slate-200 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleAddLoan}
                    disabled={!newLoan.customerName.trim() || !newLoan.amount.trim()}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl h-12 font-semibold shadow-lg transition-all duration-200"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Loan
                  </Button>
                  <Button
                    onClick={() => setShowAddLoan(false)}
                    variant="outline"
                    className="flex-1 bg-white/70 border-slate-300 text-slate-700 hover:bg-white/90 rounded-2xl h-12 font-medium transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 justify-center">
        <Button
          variant={filter === "all" ? "default" : "default"}
          onClick={() => setFilter("all")}
          className={`rounded-2xl transition-all duration-200 ${
            filter === "all" 
              ? "bg-[#1b2a3f] hover:bg-[#1b2a3f]/90 text-white border-[#1b2a3f] font-bold" 
              : "bg-[#035fa5] hover:bg-[#035fa5]/90 text-white border-[#035fa5]"
          }`}
        >
          All Loans
        </Button>
        <Button
          variant={filter === "unpaid" ? "default" : "default"}
          onClick={() => setFilter("unpaid")}
          className={`rounded-2xl transition-all duration-200 ${
            filter === "unpaid" 
              ? "bg-[#1b2a3f] hover:bg-[#1b2a3f]/90 text-white border-[#1b2a3f] font-bold" 
              : "bg-[#035fa5] hover:bg-[#035fa5]/90 text-white border-[#035fa5]"
          }`}
        >
          Unpaid
        </Button>
        <Button
          variant={filter === "paid" ? "default" : "default"}
          onClick={() => setFilter("paid")}
          className={`rounded-2xl transition-all duration-200 ${
            filter === "paid" 
              ? "bg-[#1b2a3f] hover:bg-[#1b2a3f]/90 text-white border-[#1b2a3f] font-bold" 
              : "bg-[#035fa5] hover:bg-[#035fa5]/90 text-white border-[#035fa5]"
          }`}
        >
          Paid
        </Button>
      </div>

      {/* Loans List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="bg-white/70 border-0 shadow-lg rounded-3xl">
            <CardContent className="p-6 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-slate-600">Loading transactions...</p>
            </CardContent>
          </Card>
        ) : loans.length === 0 ? (
          <Card className="bg-white/70 border-0 shadow-lg rounded-3xl">
            <CardContent className="p-6 text-center">
              <p className="text-slate-600">No transactions found</p>
            </CardContent>
          </Card>
        ) : (
          loans.map((loan) => (
            <Card 
              key={loan.id} 
              className="bg-white/70 border-0 shadow-lg rounded-3xl cursor-pointer hover:bg-white/80 transition-colors"
              onClick={() => setSelectedLoan(loan)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={loan.customerProfilePic || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {loan.customerName ? loan.customerName.charAt(0).toUpperCase() : 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-slate-800">{loan.customerName}</h4>
                      <p className="text-slate-600 text-sm">{loan.description || "No description"}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(loan.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-slate-800">
                      {formatCurrency(loan.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={loan.isPaid ? "default" : "secondary"}
                        className={`rounded-full ${
                          loan.isPaid 
                            ? "bg-green-100 text-green-800 hover:bg-green-200" 
                            : "bg-orange-100 text-orange-800 hover:bg-orange-200"
                        }`}
                      >
                        {loan.isPaid ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Unpaid
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Added by section moved to bottom */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="h-3 w-3" />
                    <span>Added by {loan.addedBy}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Loan Detail Modal */}
      {selectedLoan && (
        <BusinessLoanDetailModal
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onLoanUpdated={handleLoanUpdated}
        />
      )}
    </div>
  )
}

