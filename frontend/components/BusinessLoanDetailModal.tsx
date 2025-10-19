"use client"

import { useState } from "react"
import { ArrowLeft, User, Calendar, IndianRupee, Check, X, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BusinessService, BusinessLoan } from "@/lib/businessService"
import { useBackdropClick } from "@/hooks/useBackdropClick"

interface BusinessLoanDetailModalProps {
  loan: BusinessLoan
  onClose: () => void
  onLoanUpdated: (updatedLoan: BusinessLoan) => void
}

export default function BusinessLoanDetailModal({ 
  loan, 
  onClose, 
  onLoanUpdated 
}: BusinessLoanDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const handleBackdropClick = useBackdropClick(onClose)

  const handleMarkAsPaid = async () => {
    try {
      setIsUpdating(true)
      const updatedLoan = await BusinessService.updateLoanStatus(loan.id, true)
      onLoanUpdated(updatedLoan)
      onClose()
    } catch (error) {
      console.error("Error marking loan as paid:", error)
      alert(error instanceof Error ? error.message : "Failed to mark loan as paid")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMarkAsUnpaid = async () => {
    try {
      setIsUpdating(true)
      const updatedLoan = await BusinessService.updateLoanStatus(loan.id, false)
      onLoanUpdated(updatedLoan)
      onClose()
    } catch (error) {
      console.error("Error marking loan as unpaid:", error)
      alert(error instanceof Error ? error.message : "Failed to mark loan as unpaid")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center mb-20" onClick={handleBackdropClick}>
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full blur-2xl"></div>

        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-6 w-6 text-slate-800" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Loan Details</h2>
              <Badge 
                variant={loan.isPaid ? "default" : "destructive"}
                className={`mt-1 ${loan.isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {loan.isPaid ? "Paid" : "Unpaid"}
              </Badge>
            </div>
          </div>

          {/* Loan Information */}
          <Card className="bg-white/70 border-0 shadow-lg rounded-3xl mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Loan Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Name */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#192168] flex items-center justify-center text-white font-semibold">
                  {loan.customerName ? loan.customerName.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <p className="text-sm text-slate-600">Customer</p>
                  <p className="font-semibold text-slate-800">{loan.customerName}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-lg font-bold">रु</span>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Amount</p>
                  <p className="font-bold text-2xl text-green-700">रु {loan.amount}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Date Created</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(loan.date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Description */}
              {loan.description && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">Description</p>
                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                    <p className="text-slate-800">{loan.description}</p>
                  </div>
                </div>
              )}

              {/* Added by */}
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600 mb-2">Added by</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    {loan.addedByProfilePic ? (
                      <img 
                        src={loan.addedByProfilePic} 
                        alt={loan.addedBy}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-white">
                        {loan.addedBy.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-slate-800">{loan.addedBy}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!loan.isPaid ? (
              <Button 
                onClick={handleMarkAsPaid}
                disabled={isUpdating}
                className="w-full bg-[#192168]  text-white rounded-2xl py-3 flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Check className="h-5 w-5" />
                )}
                {isUpdating ? "Updating..." : "Mark as Paid"}
              </Button>
            ) : (
              <Button 
                onClick={handleMarkAsUnpaid}
                disabled={isUpdating}
                className="w-full bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 rounded-2xl py-3 flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
              >
                {isUpdating ? (
                  <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                ) : (
                  <X className="h-5 w-5" />
                )}
                {isUpdating ? "Updating..." : "Mark as Unpaid"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

