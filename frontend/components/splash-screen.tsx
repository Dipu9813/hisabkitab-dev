"use client"

import { useEffect, useState } from "react"
import { Loader, Wallet } from "lucide-react"
import { LoaderAnimation } from "./Loader/Loader"

export default function SplashScreen() {
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    setFadeIn(true)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#f0fdfa' }}>
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-white/20 rounded-full blur-lg animate-bounce"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/15 rounded-full blur-md animate-ping"></div>
      </div>

      <div
        className={`text-center relative z-10 transition-all duration-1000 ${fadeIn ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        {/* Logo */}
            <img src="/Logo.png" alt="Logo" className="h-90 w-90 object-contain" />


       <LoaderAnimation/>      
       </div>
    </div>
  )
}

