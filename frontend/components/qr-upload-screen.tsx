"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Camera, Check, ArrowLeft, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface QRUploadScreenProps {
  onComplete: () => void
  onBack: () => void
}

export default function QRUploadScreen({ onComplete, onBack }: QRUploadScreenProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<"esewa" | "khalti" | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleComplete = async () => {
    if (!uploadedImage || !selectedProvider) return

    setIsUploading(true)

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    onComplete()
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full blur-2xl"></div>

      <div className="w-full max-w-sm relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-2xl hover:bg-white/30">
            <ArrowLeft className="h-6 w-6 text-slate-800" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Upload Payment QR</h1>
            <p className="text-slate-600 text-sm">Add your eSewa or Khalti QR code</p>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="mb-6">
          <p className="text-slate-800 font-medium mb-3">Select your payment provider:</p>
          <div className="flex gap-3">
            <Card
              className={`flex-1 cursor-pointer transition-all duration-300 ${
                selectedProvider === "esewa"
                  ? "bg-green-100 border-2 border-green-500"
                  : "bg-white/70 border-0 hover:bg-white/80"
              }`}
              onClick={() => setSelectedProvider("esewa")}
            >
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-green-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <p className="font-semibold text-slate-800">eSewa</p>
              </CardContent>
            </Card>

            <Card
              className={`flex-1 cursor-pointer transition-all duration-300 ${
                selectedProvider === "khalti"
                  ? "bg-purple-100 border-2 border-purple-500"
                  : "bg-white/70 border-0 hover:bg-white/80"
              }`}
              onClick={() => setSelectedProvider("khalti")}
            >
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-purple-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <p className="font-semibold text-slate-800">Khalti</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 rounded-3xl mb-6">
          <CardContent className="p-6">
            {!uploadedImage ? (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center">
                  <QrCode className="h-12 w-12 text-emerald-600" />
                </div>
                <h3 className="text-slate-800 font-bold text-lg mb-2">Upload Your QR Code</h3>
                <p className="text-slate-600 text-sm mb-6">
                  Upload a clear image of your{" "}
                  {selectedProvider === "esewa" ? "eSewa" : selectedProvider === "khalti" ? "Khalti" : "payment"} QR
                  code
                </p>

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

                <div className="space-y-3">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!selectedProvider || isUploading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl py-3 font-semibold shadow-lg shadow-emerald-200/50 transition-all duration-300 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Uploading...
                      </div>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2" />
                        Choose from Gallery
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    disabled={!selectedProvider}
                    className="w-full bg-white/50 border-0 text-slate-700 hover:bg-white/70 rounded-2xl py-3 font-semibold backdrop-blur-sm disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-48 h-48 mx-auto mb-4 bg-white rounded-2xl p-4 shadow-inner">
                  <img
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Uploaded QR Code"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-green-600 font-semibold">QR Code Uploaded Successfully!</p>
                </div>
                <p className="text-slate-600 text-sm mb-4">
                  Your {selectedProvider === "esewa" ? "eSewa" : "Khalti"} QR code has been uploaded and verified.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadedImage(null)
                    setSelectedProvider(null)
                  }}
                  className="bg-white/50 border-0 text-slate-700 hover:bg-white/70 rounded-2xl px-4 py-2 font-medium backdrop-blur-sm"
                >
                  Upload Different QR
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleComplete}
            disabled={!uploadedImage || !selectedProvider || isUploading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl py-4 text-lg font-semibold shadow-lg shadow-emerald-200/50 transition-all duration-300 disabled:opacity-50"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              "Complete Setup"
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full text-slate-600 hover:text-slate-800 font-medium"
          >
            Skip for now
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 rounded-2xl mt-6">
          <CardContent className="p-4">
            <h4 className="text-slate-800 font-semibold mb-2">Why upload your QR?</h4>
            <ul className="text-slate-600 text-sm space-y-1">
              <li>• Quick and easy payments</li>
              <li>• Secure transaction processing</li>
              <li>• Seamless integration with your wallet</li>
              <li>• You can update this anytime in settings</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

