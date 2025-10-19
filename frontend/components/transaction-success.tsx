"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface TransactionSuccessProps {
  amount: string
  recipient: string
  mobileNumber: string
  remarks: string
  onBackToHome: () => void
}

export default function TransactionSuccess({
  amount,
  recipient,
  mobileNumber,
  remarks,
  onBackToHome,
}: TransactionSuccessProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [showMoneyAnimation, setShowMoneyAnimation] = useState(false)
  const [recipientName, setRecipientName] = useState(recipient)

  useEffect(() => {
    // Fetch recipient name by phone number
    async function fetchRecipientName() {
      if (!mobileNumber) return;
      try {
        let token = "";
        if (typeof window !== "undefined") {
          token = localStorage.getItem("token") || "";
        }
        const res = await fetch(`http://localhost:3000/users/search/${encodeURIComponent(mobileNumber)}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.full_name) setRecipientName(data.full_name)
        }
      } catch {}
    }
    fetchRecipientName();
  }, [mobileNumber])

  useEffect(() => {
    // Trigger animations
    // setTimeout(() => setShowMoneyAnimation(true), 500)
    setTimeout(() => setShowConfetti(true), 1000)
  }, [])

  // Generate confetti pieces
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: ["bg-yellow-400", "bg-pink-400", "bg-blue-400", "bg-green-400", "bg-purple-400", "bg-red-400", "#192168","#192168"][
      Math.floor(Math.random() * 6)
    ],
  }))

  return (
    <div className="p-6 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className={`absolute w-3 h-3 ${piece.color} rounded-sm opacity-90`}
              style={{
                left: `${piece.left}%`,
                top: "-10px",
                animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s infinite`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center relative z-10">
        {/* Success Icon with Animation */}
        <div className="relative">
          <img 
            src="/bara/happy_bara.png" 
            alt="Happy Bara" 
            className="w-45 h-45 object-contain mx-auto"
          />
        </div>

        <h2 className="text-3xl font-bold text-slate-800 mb-2">Request Successful!</h2>
        <p className="text-slate-600 mb-8 font-medium">Your loan amount has been sent successfully</p>

        {/* Transaction Details */}
        <Card className="bg-white/80 border-0 shadow-xl rounded-3xl mb-8">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Amount Sent</span>
              <span className="text-4xl font-extrabold text-[#035fa5] tracking-tight">रु{amount}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500 font-medium">Recipient</span>
              <div className="text-right">
                <span className="block font-bold text-slate-800 text-lg">{recipientName}</span>
                <span className="block text-xs text-slate-400">{mobileNumber}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500 font-medium">Remarks</span>
              <span className="text-slate-700 font-semibold text-right max-w-[60%] truncate">{remarks || '—'}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500 font-medium">Date:</span>
              <span className="text-slate-700 font-semibold text-right">
              {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Transaction ID</span>
              <span className="text-slate-800 font-mono text-xs font-semibold bg-slate-100 px-2 py-1 rounded-lg">TXN{Date.now().toString().slice(-8)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onBackToHome}
            className="w-full bg-[#192168] hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl py-4 text-lg font-semibold shadow-lg shadow-blue-200/50 transition-all duration-300"
          >
            Back to Home
          </Button>
          <Button
            variant="outline"
            className="w-full bg-white/50 border-0 shadow-2xl text-slate-700 hover:bg-white/70 rounded-2xl py-4 font-semibold backdrop-blur-sm"
          >
            Share Receipt
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes pingOnce {
          0% { transform: scale(0.7); opacity: 0.5; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pingOnce {
          animation: pingOnce 0.7s cubic-bezier(0.4, 0, 0.2, 1) 1;
        }
      `}</style>
    </div>
  )
}
