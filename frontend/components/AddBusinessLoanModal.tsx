"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, IndianRupee, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BusinessService } from "@/lib/businessService"
import { useBackdropClick } from "@/hooks/useBackdropClick"

interface AddBusinessLoanModalProps {
  onClose: () => void
  businessId: string
  businessName: string
  onLoanAdded: (loan: any) => void
}

interface User {
  id: string
  full_name: string
  ph_number?: string
  profile_pic?: string
}

export default function AddBusinessLoanModal({ 
  onClose, 
  businessId, 
  businessName, 
  onLoanAdded 
}: AddBusinessLoanModalProps) {
  const [loanData, setLoanData] = useState({
    customerName: "",
    amount: "",
    description: ""
  })
  const [isAdding, setIsAdding] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const handleBackdropClick = useBackdropClick(onClose)

  // Load all users when component mounts
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await BusinessService.getAllUsers()
        setAvailableUsers(users)
      } catch (error) {
        console.error("Error loading users:", error)
      }
    }
    loadUsers()
  }, [])

  // Search users based on customer name input
  useEffect(() => {
    if (loanData.customerName.trim().length > 0) {
      const filtered = availableUsers.filter(user =>
        (user.full_name && user.full_name.toLowerCase().includes(loanData.customerName.toLowerCase())) ||
        (user.ph_number && user.ph_number.toLowerCase().includes(loanData.customerName.toLowerCase()))
      )
      setSearchResults(filtered)
      setShowUserSuggestions(filtered.length > 0)
    } else {
      setSearchResults([])
      setShowUserSuggestions(false)
      setSelectedUser(null)
    }
  }, [loanData.customerName, availableUsers])

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setLoanData(prev => ({ ...prev, customerName: user.full_name || 'Unknown User' }))
    setShowUserSuggestions(false)
  }

  const handleAddLoan = async () => {
    if (!loanData.customerName.trim() || !loanData.amount.trim()) {
      alert("Please fill in customer name and amount")
      return
    }

    const amount = parseFloat(loanData.amount)
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    try {
      setIsAdding(true)
      const newLoan = await BusinessService.addBusinessLoan(
        businessId,
        loanData.customerName.trim(),
        amount,
        loanData.description.trim(),
        selectedUser?.id // Pass user ID if a user was selected
      )
      
      onLoanAdded(newLoan)
      onClose()
    } catch (error) {
      console.error("Error adding loan:", error)
      alert(error instanceof Error ? error.message : "Failed to add loan")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={handleBackdropClick}>
      <div className="bg-white w-full max-w-sm mx-auto rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto relative shadow-xl border border-slate-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/20 to-transparent rounded-full blur-2xl" style={{background: 'linear-gradient(135deg, rgba(25, 33, 104, 0.1) 0%, transparent 70%)'}}></div>

        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-6 w-6 text-slate-800" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Add Customer Loan</h2>
              <p className="text-slate-600 text-sm">{businessName}</p>
            </div>
          </div>

          {/* Form */}
          <Card className="bg-white border border-slate-200 shadow-2xl rounded-3xl">
        
            <CardContent className="space-y-4 mt-5">
              <div className="relative">
                <Label htmlFor="customerName" className="text-slate-700 font-medium">
                  Customer Name *
                </Label>
                <div className="relative">
                  <Input
                    id="customerName"
                    value={loanData.customerName}
                    onChange={(e) => setLoanData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter customer name"
                    className="mt-2 rounded-2xl bg-white border focus:border-[#192168] focus:ring-[#192168] focus:ring-1"
                    style={{borderColor: '#192168', color: '#192168'}}
                  />
                  <Search className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                </div>
                
                {/* User Suggestions */}
                {showUserSuggestions && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-2xl mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="flex items-center gap-3 p-3 hover:bg-green-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profile_pic || undefined} />
                          <AvatarFallback className="text-xs">
                            {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('') : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-800">{user.full_name || 'Unknown User'}</div>
                          <div className="text-xs text-slate-500">{user.ph_number || 'No phone number'}</div>
                        </div>
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Selected User Indicator */}
                {selectedUser && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <User className="h-4 w-4" />
                    <span>Registered user selected: {selectedUser.full_name || 'Unknown User'}</span>
                  </div>
                )}
                
                {/* External Customer Notice */}
                {loanData.customerName.trim() && !selectedUser && searchResults.length === 0 && (
                  <div className="mt-2 text-sm text-amber-600">
                    This will be recorded as an external customer
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="amount" className="text-slate-700 font-medium">
                  Amount (रु) *
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 font-semibold" style={{color: '#192168'}}>रू</span>
                  <Input
                    id="amount"
                    type="number"
                    value={loanData.amount}
                    onChange={(e) => setLoanData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                    className="pl-10 rounded-2xl bg-white border focus:border-[#192168] focus:ring-[#192168] focus:ring-1"
                    style={{borderColor: '#192168', color: '#192168'}}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-slate-700 font-medium">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={loanData.description}
                  onChange={(e) => setLoanData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter loan description or purpose"
                  className="mt-2 rounded-2xl bg-white border focus:border-[#192168] focus:ring-[#192168] focus:ring-1 resize-none"
                  style={{borderColor: '#192168', color: '#192168'}}
                  rows={3}
                />
              </div>

              <div className="rounded-2xl p-4 border border-slate-200" style={{backgroundColor: 'rgba(25, 33, 104, 0.05)'}}>
                <h4 className="font-semibold mb-2" style={{color: '#192168'}}>Summary</h4>
                <div className="space-y-1 text-sm">
                  <p style={{color: '#192168'}}>
                    <span className="font-medium">Customer:</span> {loanData.customerName || "Not specified"}
                  </p>
                  <p style={{color: '#192168'}}>
                    <span className="font-medium">Amount:</span> रु{loanData.amount || "0"}
                  </p>
                  <p style={{color: '#192168'}}>
                    <span className="font-medium">Status:</span> Unpaid (by default)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleAddLoan}
                  disabled={!loanData.customerName.trim() || !loanData.amount.trim() || isAdding}
                  className="text-white rounded-2xl flex-1 hover:opacity-90"
                  style={{backgroundColor: '#192168'}}
                >
                  {isAdding ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </div>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Loan
                    </>
                  )}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="rounded-2xl px-6 bg-red-600 font-extrabold"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

