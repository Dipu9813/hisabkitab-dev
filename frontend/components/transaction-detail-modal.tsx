"use client"

import { X, Copy, Check, Download, Share, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TransactionDetailModalProps {
  transaction: any
  onClose: () => void
}

export default function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  const [copied, setCopied] = useState(false)

  const transactionId = `TXN${Date.now().toString().slice(-8)}`
  const fullDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(transactionId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy transaction ID:", err)
    }
  }

  const handleShare = async () => {
    const shareText = `Transaction Receipt\n\nAmount: ${transaction.amount}\n${transaction.from ? `From: ${transaction.from}` : `To: ${transaction.to}`}\nDate: ${fullDate}\nTransaction ID: ${transactionId}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Transaction Receipt",
          text: shareText,
        })
      } catch (err) {
        console.error("Error sharing:", err)
      }
    } else {
      // Fallback to copy
      await navigator.clipboard.writeText(shareText)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 w-full max-w-sm mx-auto rounded-3xl max-h-[90vh] overflow-y-auto relative">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-2xl"></div>

        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Transaction Details</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl hover:bg-white/30">
              <X className="h-6 w-6 text-slate-600" />
            </Button>
          </div>

          {/* Status */}
          <div className="text-center mb-8">
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center ${
                transaction.type === "received"
                  ? "bg-gradient-to-br from-green-100 to-emerald-100"
                  : "bg-gradient-to-br from-red-100 to-rose-100"
              }`}
            >
              {transaction.type === "received" ? (
                <ArrowDownLeft className="h-8 w-8 text-emerald-600" />
              ) : (
                <ArrowUpRight className="h-8 w-8 text-rose-600" />
              )}
            </div>
            <h3 className="text-slate-800 font-bold text-xl mb-2">
              {transaction.type === "received" ? "Money Received" : "Money Sent"}
            </h3>
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Completed
            </div>
          </div>

          {/* Amount */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-slate-600 text-sm mb-2">Amount</p>
              <p
                className={`text-4xl font-bold ${
                  transaction.type === "received" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {transaction.amount}
              </p>
            </CardContent>
          </Card>

          {/* Transaction Info */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl mb-6">
            <CardContent className="p-6 space-y-4">
              {/* Contact Info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/placeholder.svg?height=48&width=48" />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    {(transaction.from || transaction.to)
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-800">{transaction.from || transaction.to}</p>
                  <p className="text-sm text-slate-600">{transaction.type === "received" ? "Sender" : "Recipient"}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-600">Date & Time</span>
                  <span className="text-slate-800 font-medium">{fullDate}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Transaction ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 font-mono text-sm">{transactionId}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyId}
                      className="h-6 w-6 rounded-lg hover:bg-emerald-100"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-slate-600" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Method</span>
                  <span className="text-slate-800 font-medium">FinancePay Wallet</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Transaction Fee</span>
                  <span className="text-slate-800 font-medium">₹0.00</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Reference</span>
                  <span className="text-slate-800 font-medium">Payment Transfer</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1 bg-white/50 border-0 text-slate-700 hover:bg-white/70 rounded-2xl py-3 font-semibold backdrop-blur-sm"
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>

              <Button
                variant="outline"
                className="flex-1 bg-white/50 border-0 text-slate-700 hover:bg-white/70 rounded-2xl py-3 font-semibold backdrop-blur-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl py-3 font-semibold shadow-lg shadow-emerald-200/50 transition-all duration-300"
            >
              Done
            </Button>
          </div>

          {/* Help */}
          <div className="text-center mt-6">
            <p className="text-slate-600 text-sm">
              Need help with this transaction?{" "}
              <button className="text-emerald-600 font-medium hover:underline">Contact Support</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

