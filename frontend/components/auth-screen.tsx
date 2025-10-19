"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Eye, EyeOff, Wallet2, Phone, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface AuthScreenProps {
  onAuthSuccess: () => void
  onSignupSuccess: () => void
}

export default function AuthScreen({ onAuthSuccess, onSignupSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [mpin, setMpin] = useState("")
  const [confirmMpin, setConfirmMpin] = useState("")
  const [showMpin, setShowMpin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const phoneRef = useRef<HTMLInputElement | null>(null)
  const mpinRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (phoneRef.current) {
        phoneRef.current.focus()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1200))

    if (isSignUp) {
      if (mpin !== confirmMpin) {
        setError("MPIN doesn't match")
        setIsLoading(false)
        return
      }
      if (mpin.length !== 4) {
        setError("MPIN must be 4 digits")
        setIsLoading(false)
        return
      }
      onSignupSuccess()
    } else {
      if (phoneNumber === "1000000000" && mpin === "1111") {
        onAuthSuccess()
      } else {
        setError("Invalid credentials. Use phone: 1000000000 and MPIN: 1111")
      }
    }

    setIsLoading(false)
  }

  const handleInputFocus = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    if (inputRef.current) {
      inputRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "")
    return digits.slice(0, 10)
  }

  const formatMPIN = (value: string) => {
    const digits = value.replace(/\D/g, "")
    return digits.slice(0, 4)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Modern Glassy Background Blobs */}
      <div className="absolute top-[-80px] right-[-80px] w-[350px] h-[350px] bg-gradient-to-br from-emerald-400/30 to-cyan-300/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-[-60px] left-[-60px] w-[220px] h-[220px] bg-gradient-to-tr from-teal-300/30 to-emerald-200/10 rounded-full blur-2xl animate-pulse-slower" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-200/40 mb-4 border-4 border-white/40">
            <Wallet2 className="h-10 w-10 text-white drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 mb-1 tracking-tight">FinancePay</h1>
          <p className="text-slate-500 text-base font-medium">
            {isSignUp ? "Create your account" : "Sign in to continue"}
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-2xl shadow-emerald-200/40 rounded-3xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="phone" className="text-slate-700 font-semibold text-sm">
                  Phone Number
                </Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
                  <Input
                    ref={phoneRef}
                    id="phone"
                    type="tel"
                    placeholder="1000000000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                    onFocus={() => handleInputFocus(phoneRef)}
                    className="pl-10 bg-white/70 border border-emerald-100 text-slate-800 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-emerald-400/40 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mpin" className="text-slate-700 font-semibold text-sm">
                  MPIN (4 digits)
                </Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
                  <Input
                    ref={mpinRef}
                    id="mpin"
                    type={showMpin ? "text" : "password"}
                    placeholder="1111"
                    value={mpin}
                    onChange={(e) => setMpin(formatMPIN(e.target.value))}
                    onFocus={() => handleInputFocus(mpinRef)}
                    className="pl-10 pr-12 bg-white/70 border border-emerald-100 text-slate-800 placeholder:text-slate-400 rounded-xl text-center text-2xl tracking-widest focus:ring-2 focus:ring-emerald-400/40 transition"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMpin(!showMpin)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl hover:bg-emerald-50"
                  >
                    {showMpin ? (
                      <EyeOff className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-emerald-400" />
                    )}
                  </Button>
                </div>
              </div>

              {isSignUp && (
                <div>
                  <Label htmlFor="confirmMpin" className="text-slate-700 font-semibold text-sm">
                    Confirm MPIN
                  </Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
                    <Input
                      id="confirmMpin"
                      type="password"
                      placeholder="Confirm MPIN"
                      value={confirmMpin}
                      onChange={(e) => setConfirmMpin(formatMPIN(e.target.value))}
                      className="pl-10 bg-white/70 border border-emerald-100 text-slate-800 placeholder:text-slate-400 rounded-xl text-center text-2xl tracking-widest focus:ring-2 focus:ring-emerald-400/40 transition"
                      required
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-red-400 rounded-full" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl py-3 text-lg font-bold shadow-lg shadow-emerald-200/40 transition-all duration-300 disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isSignUp ? "Creating Account..." : "Signing In..."}
                  </div>
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-7 text-center">
              <p className="text-slate-500 text-sm font-medium">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError("")
                  setPhoneNumber("")
                  setMpin("")
                  setConfirmMpin("")
                }}
                className="text-emerald-600 hover:text-emerald-700 font-semibold mt-1 text-base"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </Button>
            </div>

            {!isSignUp && (
              <div className="mt-5 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 shadow-sm">
                <p className="text-blue-800 text-xs text-center font-medium">
                  <strong>Demo Credentials:</strong>
                  <br />
                  Phone: 1000000000
                  <br />
                  MPIN: 1111
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Animations for background blobs */}
      <style>{`
        .animate-pulse-slow {
          animation: pulse-slow 6s cubic-bezier(.4,0,.6,1) infinite;
        }
        .animate-pulse-slower {
          animation: pulse-slow 10s cubic-bezier(.4,0,.6,1) infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1) translateY(0); opacity: 1; }
          50% { transform: scale(1.08) translateY(10px); opacity: 0.85; }
        }
      `}</style>
    </div>
  )
}

