"use client"

import { X, Plus, Users, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"
import AddBusinessModal from "./add-business-modal"
import JoinBusinessModal from "./join-business-modal"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  currentSection: string
  onSectionChange: (section: string) => void
  onBusinessCreated: (businessData: any) => void
  onBusinessJoined: (businessData: any) => void
  businessSections: any[]
}

export default function Sidebar({
  isOpen,
  onClose,
  currentSection,
  onSectionChange,
  onBusinessCreated,
  onBusinessJoined,
  businessSections,
}: SidebarProps) {
  const [showAddBusiness, setShowAddBusiness] = useState(false)
  const [showJoinBusiness, setShowJoinBusiness] = useState(false)

  const sections = [
    {
      id: "personal",
      name: "Personal",
      type: "account",
      icon: "👤",
      balance: "रु40,540.74",
      description: "Your personal wallet",
    },
  ]

  const handleSectionSelect = (sectionId: string) => {
    onSectionChange(sectionId)
    onClose()
  }

  // Generate unique gradient colors for each business
  const generateBusinessGradient = (businessName: string, index: number) => {
    const gradients = [
      'from-[#192168] via-[#2563eb] to-[#1e40af]', // Blue gradient
      'from-[#7c3aed] via-[#8b5cf6] to-[#6366f1]', // Purple gradient
      'from-[#059669] via-[#10b981] to-[#06b6d4]', // Green-teal gradient
      'from-[#dc2626] via-[#ef4444] to-[#f97316]', // Red-orange gradient
      'from-[#9333ea] via-[#c084fc] to-[#f472b6]', // Purple-pink gradient
      'from-[#0891b2] via-[#06b6d4] to-[#3b82f6]', // Cyan-blue gradient
      'from-[#ca8a04] via-[#eab308] to-[#f59e0b]', // Yellow-amber gradient
      'from-[#be123c] via-[#e11d48] to-[#ec4899]', // Rose-pink gradient
    ];
    
    // Use business name hash for consistent colors
    const hash = businessName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return gradients[Math.abs(hash) % gradients.length];
  };

  // Get user info from localStorage
  let userName = "";
  let userEmail = "";
  let userAvatar = "";
  if (typeof window !== "undefined") {
    userName = localStorage.getItem("userName") || "User";
    userEmail = localStorage.getItem("userEmail") || "";
    userAvatar = localStorage.getItem("userAvatar") || "/placeholder.svg";
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#eaf6ff" }}
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-2xl"></div>

        <div className="p-6 h-full flex flex-col overflow-y-auto relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Accounts</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl hover:bg-white/30">
              <X className="h-6 w-6 text-slate-600" />
            </Button>
          </div>

          {/* Personal Sections */}
            <div className="mb-8">
            <h3 className="text-[#035fa5] text-sm font-medium mb-4 uppercase tracking-wide">Personal</h3>
            <div className="space-y-3">
              {sections.map((section) => (
              <Card
                key={section.id}
                className={`cursor-pointer transition-all duration-300 ${
                currentSection === section.id
                  ? "bg-white/90 border-2 border-[#035fa5] shadow-lg shadow-blue-100/50"
                  : "bg-white/60 border-0 shadow-sm hover:bg-white/80"
                } rounded-3xl`}
                onClick={() => handleSectionSelect(section.id)}
              >
                <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-white/50 shadow-md">
                    <AvatarImage src={userAvatar} />
                    <AvatarFallback className="bg-gradient-to-br from-[#e0f0fa] to-[#b3d8f1] text-[#035fa5] font-semibold text-xl">
                      {userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                  <h4 className="font-semibold text-[#035fa5]">{section.name}</h4>
                  <p className="text-[#035fa5]/80 text-sm">{section.description}</p>
                  </div>
                  {currentSection === section.id && <div className="w-2 h-2 bg-[#035fa5] rounded-full"></div>}
                </div>
                </CardContent>
              </Card>
              ))}
            </div>
            </div>

          {/* Business Sections */}
            <div className="mb-8">
            <h3 className="text-[#035fa5] text-sm font-medium mb-4 uppercase tracking-wide">Business</h3>
            <div className="space-y-3">
              {businessSections.map((section, index) => (
              <Card
                key={section.id}
                className={`cursor-pointer transition-all duration-300 ${
                currentSection === section.id
                  ? "bg-white/90 border-2 border-[#035fa5] shadow-lg shadow-blue-100/50"
                  : "bg-white/60 border-0 shadow-sm hover:bg-white/80"
                } rounded-3xl`}
                onClick={() => handleSectionSelect(section.id)}
              >
                <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-semibold shadow-md relative overflow-hidden">
                    {/* Dynamic gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${generateBusinessGradient(section.name, index)} opacity-90`}></div>
                    {/* Icon overlay with glassmorphism effect */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    {/* Content */}
                    <span className="relative z-10 text-white drop-shadow-sm">
                      {/^[A-Z]$/.test(section.icon) ? (
                        // Letter-based icon
                        <span className="text-lg font-bold">{section.icon}</span>
                      ) : (
                        // Emoji icon
                        <span className="text-xl filter drop-shadow-md">{section.icon}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex-1">
                  <h4 className="font-semibold text-[#035fa5]">{section.name}</h4>
                  <p className="text-[#035fa5]/80 text-sm">{section.description}</p>
                  <p className="text-[#035fa5] font-bold text-lg">{section.balance}</p>
                  </div>
                  {currentSection === section.id && <div className="w-2 h-2 bg-[#035fa5] rounded-full"></div>}
                </div>
                </CardContent>
              </Card>
              ))}
            </div>
            </div>

          {/* Add Business Section */}
          <div className="space-y-3">
            <Card
              className="bg-white/60 border-0  shadow-sm hover:bg-white/80 transition-colors rounded-3xl cursor-pointer"
              onClick={() => setShowAddBusiness(true)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#e0f0fa] to-[#b3d8f1] rounded-2xl flex items-center justify-center">
                    <Plus className="h-6 w-6 text-[#035fa5]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">Add Business Account</h4>
                    <p className="text-slate-600 text-sm">Create a new business profile</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-white/60 border-0 shadow-sm hover:bg-white/80 transition-colors rounded-3xl cursor-pointer"
              onClick={() => setShowJoinBusiness(true)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#e0f0fa] to-[#b3d8f1] rounded-2xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-[#035fa5]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">Join Business</h4>
                    <p className="text-slate-600 text-sm">Join an existing business account</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Profile at Bottom */}
            <div className="mt-auto w-full pt-8">
            <Card className="bg-white/60 border-0 shadow-sm rounded-3xl mx-2 mb-4">
              <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-white/50 shadow-lg">
                <AvatarImage src={userAvatar} />
                <AvatarFallback className="bg-gradient-to-br from-[#b3d8f1] to-[#035fa5] text-white font-semibold">
                  {userName.charAt(0)}
                </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                <h4 className="font-semibold text-slate-800 truncate max-w-[160px]">{userName}</h4>
                <p className="text-slate-600 text-sm truncate max-w-[160px]">{userEmail}</p>
                </div>
              </div>
              </CardContent>
            </Card>
            </div>
        </div>
      </div>
      {/* Modals */}
      {showAddBusiness && (
        <AddBusinessModal
          onClose={() => setShowAddBusiness(false)}
          onBusinessCreated={(businessData) => {
            onBusinessCreated(businessData)
            setShowAddBusiness(false)
          }}
        />
      )}
      {showJoinBusiness && (
        <JoinBusinessModal
          onClose={() => setShowJoinBusiness(false)}
          onBusinessJoined={(businessData) => {
            onBusinessJoined(businessData)
            setShowJoinBusiness(false)
          }}
        />
      )}
    </>
  )
}
