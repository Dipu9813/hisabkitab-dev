"use client"

import { useState, useEffect, useRef } from "react"
import { X, Download, Share, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { QRCodeSVG } from "qrcode.react"

interface ReceiveModalProps {
  onClose: () => void
}

export default function ReceiveModal({ onClose }: ReceiveModalProps) {
  const [copied, setCopied] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null);

  // Get user info from localStorage (same logic as profile-modal)
  let userName = ""
  let userPhone = ""
  let userAvatar = ""
  let userUpiId = ""
  if (typeof window !== "undefined") {
    userName = localStorage.getItem("userName") || "User"
    userPhone = localStorage.getItem("userPhone") || ""
    userAvatar = localStorage.getItem("userAvatar") || ""
    userUpiId = localStorage.getItem("upiId") || ""
  }
  const userData = {
    name: userName,
    phone: userPhone,
    avatar: userAvatar,
    profileUrl: `${typeof window !== "undefined" ? window.location.origin : ''}/user/${userName.replace(/\s+/g, '').toLowerCase()}`,
  }


  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Send me money",
          text: `Send money to ${userData.name} using UPI ID: ${userData.phone}`,
          url: userData.profileUrl,
        })
      } catch (err) {
        console.error("Error sharing:", err)
      }
    } 
  }

  const handleDownload = () => {
    // In a real app, this would generate and download the QR code image
    console.log("Downloading QR code...")
  }

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ pointerEvents: 'auto', zIndex: 99999 }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-[#eaf6ff] w-full max-w-sm mx-auto rounded-3xl max-h-[90vh] overflow-y-auto relative"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-2xl"></div>

        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-800">Receive Loan</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl hover:bg-white/30">
              <X className="h-6 w-6 text-slate-600" />
            </Button>
          </div>

          {/* User Profile */}
          <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-xl shadow-emerald-100/40 rounded-3xl mb-8 transition-all duration-300">
            <CardContent className="flex items-center gap-5 p-6">
              <Avatar className="h-16 w-16 ring-4 ring-[#035fa5] shadow-xl">
                <AvatarImage
                  src={userData.avatar || "/placeholder.svg?height=64&width=64"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl font-bold">
                  {userData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-900 font-bold text-2xl truncate">{userData.name}</h3>
                <p className="text-slate-500 text-sm mb-1 truncate">Phone: {userData.phone}</p>
                
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <div className="text-center mb-8">
            <h3 className="text-slate-800 font-bold text-xl mb-4">Scan to Receive Loan</h3>
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 rounded-3xl p-8 inline-block">
              <div className="w-48 h-48 mx-auto bg-white rounded-2xl p-4 shadow-inner">
                {/* QR Code for user's phone number */}
                {userData.phone ? (
                  <QRCodeSVG
                    value={userData.phone}
                    size={176}
                    bgColor="#fff"
                    fgColor="#1b2a3f"
                    level="H"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <img
                    src="/placeholder.svg?height=192&width=192&text=QR+Code"
                    alt="QR Code for payment"
                    className="w-full h-full object-contain rounded-lg"
                  />
                )}
              </div>
            </Card>
            <p className="text-slate-600 text-sm mt-4 max-w-xs mx-auto">
              Share this QR code with anyone who wants to send you loan money.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleShare}
              className="w-full bg-[#192168] text-white rounded-2xl py-4 text-lg font-semibold shadow-lg shadow-emerald-200/50 transition-all duration-300"
            >
              <Share className="h-5 w-5 mr-2" />
              Share QR Code
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex-1 bg-white/50 border-0 text-slate-700 hover:bg-white/70 rounded-2xl py-4 font-semibold backdrop-blur-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              <Button
                // onClick={handleCopyUPI}
                variant="outline"
                className="flex-1 bg-white/50 border-0 text-slate-700 hover:bg-white/70 rounded-2xl py-4 font-semibold backdrop-blur-sm"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Phone Number
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 rounded-2xl mt-6">
            <CardContent className="p-4">
              <h4 className="text-slate-800 font-semibold mb-2">How to receive money:</h4>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>• Share your QR code with the sender</li>
                <li>• They can scan it to get your loan account details</li>
                <li>• Load Record will be credited to your account instantly</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

