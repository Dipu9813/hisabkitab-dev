"use client"

import { useState } from "react"
import { ArrowLeft, QrCode, Building, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import QRScanner from "./qr-scanner"
import { BusinessService } from "@/lib/businessService"
import { useBackdropClick } from "@/hooks/useBackdropClick"

interface JoinBusinessModalProps {
  onClose: () => void
  onBusinessJoined: (businessData: any) => void
}

type Step = "method" | "manual" | "scan" | "success"

export default function JoinBusinessModal({ onClose, onBusinessJoined }: JoinBusinessModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("method")
  const [businessCode, setBusinessCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [joinedBusiness, setJoinedBusiness] = useState<any>(null)
  const handleBackdropClick = useBackdropClick(onClose)

  const handleJoinBusiness = async (code: string) => {
    setIsJoining(true)

    try {
      // Call the business service to join business
      const business = await BusinessService.joinBusiness(code.trim().toUpperCase())

      // Format the business data for display
      const businessData = {
        id: business.id,
        name: business.name,
        type: "Business",
        balance: "रु0.00", // Initial balance display
        cardNumber: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
        businessCode: business.businessId,
        qrCode: `business_qr_${business.id}`,
        members: 1, // You could fetch member count from another endpoint
        role: "Member",
        joinedAt: new Date().toISOString(),
      }

      setJoinedBusiness(businessData)
      setIsJoining(false)
      setCurrentStep("success")

      // Auto-close and join business after 2 seconds
      setTimeout(() => {
        onBusinessJoined(businessData)
        onClose()
      }, 2000)

    } catch (error) {
      console.error("Error joining business:", error)
      setIsJoining(false)
      // You might want to show an error message to the user here
      alert(error instanceof Error ? error.message : "Failed to join business")
    }
  }

  const handleCodeSubmit = () => {
    if (businessCode.trim()) {
      handleJoinBusiness(businessCode)
    }
  }

  const handleQRScan = (scannedCode: string) => {
    handleJoinBusiness(scannedCode)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case "method":
        return (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-6 w-6 text-slate-800" />
              </Button>
              <h2 className="text-2xl font-bold text-slate-800">Join Business</h2>
            </div>

            <p className="text-slate-600 mb-8">Choose how to join the business account</p>

            <div className="space-y-4">
              <Card
                className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl cursor-pointer hover:bg-white/80 transition-colors"
                onClick={() => setCurrentStep("manual")}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Enter Business Code</h3>
                    <p className="text-sm text-slate-600">Type the business code manually</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl cursor-pointer hover:bg-white/80 transition-colors"
                onClick={() => setCurrentStep("scan")}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Scan Business QR</h3>
                    <p className="text-sm text-slate-600">Scan the business QR code</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-0 rounded-3xl mt-6">
              <CardContent className="p-4">
                <h4 className="text-slate-800 font-semibold mb-2">Need a business code?</h4>
                <p className="text-slate-600 text-sm">
                  Ask your business admin to share the business code or QR code with you. You'll need this to join their
                  business account.
                </p>
              </CardContent>
            </Card>
          </div>
        )

      case "manual":
        return (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" onClick={() => setCurrentStep("method")}>
                <ArrowLeft className="h-6 w-6 text-slate-800" />
              </Button>
              <h2 className="text-2xl font-bold text-slate-800">Enter Business Code</h2>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="businessCode" className="text-slate-800 font-medium">
                  Business Code
                </Label>
                <Input
                  id="businessCode"
                  placeholder="BIZ123456"
                  value={businessCode}
                  onChange={(e) => setBusinessCode(e.target.value.toUpperCase())}
                  className="mt-2 bg-white/50 border-0 text-slate-800 placeholder:text-slate-500 rounded-2xl text-center font-mono text-lg"
                />
              </div>

              <Button
                onClick={handleCodeSubmit}
                disabled={!businessCode.trim() || isJoining}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl py-4 text-lg font-semibold shadow-lg shadow-blue-200/50 transition-all duration-300 disabled:opacity-50"
              >
                {isJoining ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Joining Business...
                  </div>
                ) : (
                  "Join Business"
                )}
              </Button>

              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 rounded-3xl">
                <CardContent className="p-4">
                  <h4 className="text-slate-800 font-semibold mb-2">Business Code Format:</h4>
                  <p className="text-slate-600 text-sm">
                    Business codes are usually 6-9 characters long and start with "BIZ" followed by numbers (e.g.,
                    BIZ123456).
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "scan":
        return <QRScanner onBack={() => setCurrentStep("method")} onScan={handleQRScan} />

      case "success":
        return (
          <div className="p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center animate-bounce">
              <Check className="h-10 w-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2">Successfully Joined!</h2>
            <p className="text-slate-600 mb-6">You've been added to the business account</p>

            {joinedBusiness && (
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center">
                      <Building className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-800 text-lg">{joinedBusiness.name}</h3>
                      <p className="text-slate-600 text-sm">{joinedBusiness.type}</p>
                      <p className="text-blue-600 font-bold">{joinedBusiness.balance}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-slate-600 text-sm">Members</p>
                      <p className="font-bold text-slate-800">{joinedBusiness.members}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Your Role</p>
                      <p className="font-bold text-slate-800">{joinedBusiness.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-slate-600 text-sm">Redirecting to business account...</p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={handleBackdropClick}>
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 w-full max-w-sm mx-auto rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-2xl"></div>
        {renderStepContent()}
      </div>
    </div>
  )
}
