"use client"

import { useState, useEffect, useRef } from "react"
import { X, QrCode, Download, Share, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useBackdropClick } from "@/hooks/useBackdropClick"

interface BusinessQRModalProps {
  onClose: () => void
  businessName: string
  businessCode: string
}

export default function BusinessQRModal({ onClose, businessName, businessCode }: BusinessQRModalProps) {
  const [copied, setCopied] = useState(false)
  const handleBackdropClick = useBackdropClick(onClose)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Generate QR code for business code
    const generateQR = async () => {
      if (qrRef.current) {
        // Clear previous QR code
        qrRef.current.innerHTML = ""
        
        // Import QRCode library dynamically
        try {
          const QRCode = (await import('qrcode')).default
          const canvas = document.createElement('canvas')
          await QRCode.toCanvas(canvas, businessCode, {
            width: 200,
            margin: 2,
            color: {
              dark: '#1e40af', // Blue color
              light: '#ffffff'
            }
          })
          qrRef.current.appendChild(canvas)
        } catch (error) {
          console.error('Error generating QR code:', error)
          // Fallback display
          qrRef.current.innerHTML = `
            <div class="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
              <div class="text-center">
                <div class="text-blue-600 mb-2">${businessCode}</div>
                <div class="text-xs text-slate-600">QR Code</div>
              </div>
            </div>
          `
        }
      }
    }

    generateQR()
  }, [businessCode])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(businessCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy business code:", err)
    }
  }

  const handleShare = async () => {
    const shareText = `Join our business account on FinancePay!\n\nBusiness: ${businessName}\nCode: ${businessCode}\n\nDownload FinancePay and use this code to join our business account.`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${businessName} on FinancePay`,
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

  const handleDownload = () => {
    // In a real app, this would generate and download the QR code image
    console.log("Downloading business QR code...")
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={handleBackdropClick}>
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 w-full max-w-sm mx-auto rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-2xl"></div>

        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Business QR Code</h2>
              <p className="text-slate-600 text-sm">{businessName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl hover:bg-white/30">
              <X className="h-6 w-6 text-slate-600" />
            </Button>
          </div>

          {/* QR Code */}
          <div className="text-center mb-8">
            <h3 className="text-slate-800 font-bold text-xl mb-4">Scan to Join Business</h3>
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 rounded-3xl p-8 inline-block">
              <div ref={qrRef} className="w-48 h-48 mx-auto bg-white rounded-2xl p-4 shadow-inner flex items-center justify-center">
                {/* QR Code will be generated here */}
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            </Card>
            <p className="text-slate-600 text-sm mt-4 max-w-xs mx-auto">
              Share this QR code with team members to join your business account
            </p>
          </div>

          {/* Business Code */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl mb-6">
            <CardContent className="p-6">
              <h4 className="text-slate-800 font-bold text-lg mb-4">Business Code</h4>
              <div className="flex items-center justify-between bg-blue-50 rounded-2xl p-4">
                <span className="text-blue-800 font-mono font-bold text-xl">{businessCode}</span>
                <Button variant="ghost" size="icon" onClick={handleCopyCode} className="rounded-2xl hover:bg-blue-100">
                  {copied ? <Check className="h-5 w-5 text-blue-600" /> : <Copy className="h-5 w-5 text-blue-600" />}
                </Button>
              </div>
              <p className="text-slate-600 text-sm mt-3">
                Team members can use this code to join your business account manually
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleShare}
              className="w-full bg-[#192168] hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl py-4 text-lg font-semibold shadow-lg shadow-blue-200/50 transition-all duration-300"
            >
              <Share className="h-5 w-5 mr-2" />
              Share Business Code
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex-1 bg-white/50 border-0 text-slate-700 hover:bg-white/70 rounded-2xl py-4 font-semibold backdrop-blur-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR
              </Button>

              <Button
                onClick={handleCopyCode}
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
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-0 rounded-2xl mt-6">
            <CardContent className="p-4">
              <h4 className="text-slate-800 font-semibold mb-2">How team members can join:</h4>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>• Scan this QR code with FinancePay app</li>
                <li>• Use "Join Business" feature and enter the code</li>
                <li>• Click on shared invitation links</li>
                <li>• They'll get access to business transactions and features</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
