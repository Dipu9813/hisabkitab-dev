"use client"

import { useState } from "react"
import { X, Plus, Users, Search, Crown, UserCheck, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useBackdropClick } from "@/hooks/useBackdropClick"

interface BusinessContactsModalProps {
  onClose: () => void
  businessName: string
}

export default function BusinessContactsModal({ onClose, businessName }: BusinessContactsModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"members" | "invite">("members")
  const handleBackdropClick = useBackdropClick(onClose)

  const businessMembers = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@company.com",
      phone: "+91 98765 43210",
      role: "Admin",
      joinedDate: "Jan 2024",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "Sarah Wilson",
      email: "sarah.wilson@company.com",
      phone: "+91 87654 32109",
      role: "Manager",
      joinedDate: "Feb 2024",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      phone: "+91 76543 21098",
      role: "Member",
      joinedDate: "Mar 2024",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily.davis@company.com",
      phone: "+91 65432 10987",
      role: "Member",
      joinedDate: "Mar 2024",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const filteredMembers = businessMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Admin":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "Manager":
        return <UserCheck className="h-4 w-4 text-blue-500" />
      default:
        return <Users className="h-4 w-4 text-slate-500" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-yellow-100 text-yellow-800"
      case "Manager":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={handleBackdropClick}>
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 w-full max-w-sm mx-auto rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-2xl"></div>

        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Team Members</h2>
              <p className="text-slate-600 text-sm">{businessName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl hover:bg-white/30">
              <X className="h-6 w-6 text-slate-600" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === "members" ? "default" : "outline"}
              onClick={() => setActiveTab("members")}
              className={`flex-1 rounded-2xl py-3 font-semibold transition-all duration-300 ${
                activeTab === "members"
                  ? "bg-white text-slate-800 shadow-lg shadow-slate-200/50"
                  : "bg-white/30 text-slate-700 border-0 hover:bg-white/50 backdrop-blur-sm"
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Members ({businessMembers.length})
            </Button>
            <Button
              variant={activeTab === "invite" ? "default" : "outline"}
              onClick={() => setActiveTab("invite")}
              className={`flex-1 rounded-2xl py-3 font-semibold transition-all duration-300 ${
                activeTab === "invite"
                  ? "bg-white text-slate-800 shadow-lg shadow-slate-200/50"
                  : "bg-white/30 text-slate-700 border-0 hover:bg-white/50 backdrop-blur-sm"
              }`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>

          {activeTab === "members" ? (
            <>
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/50 border-0 text-slate-800 placeholder:text-slate-400 rounded-2xl"
                />
              </div>

              {/* Members List */}
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-800">{member.name}</h4>
                            {getRoleIcon(member.role)}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="h-3 w-3 text-slate-500" />
                            <p className="text-slate-600 text-sm">{member.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-slate-500" />
                            <p className="text-slate-600 text-sm">{member.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getRoleColor(member.role)}`}
                          >
                            {member.role}
                          </span>
                          <p className="text-slate-500 text-xs mt-1">Joined {member.joinedDate}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center">
                  <Plus className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-slate-800 font-bold text-lg mb-2">Invite Team Members</h3>
                <p className="text-slate-600 text-sm">Add new members to your business account</p>
              </div>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl">
                <CardContent className="p-6">
                  <h4 className="text-slate-800 font-semibold mb-4">Invite via Email</h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Enter email address"
                      className="bg-white/50 border-0 text-slate-800 placeholder:text-slate-500 rounded-2xl"
                    />
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl py-3 font-semibold shadow-lg shadow-blue-200/50">
                      Send Invitation
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl">
                <CardContent className="p-6">
                  <h4 className="text-slate-800 font-semibold mb-4">Share Business Code</h4>
                  <div className="bg-blue-50 rounded-2xl p-4 mb-4">
                    <p className="text-blue-800 font-mono text-center text-lg font-bold">BIZ789012</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-white/50 border-0 text-slate-700 hover:bg-white/70 rounded-2xl py-3 font-semibold backdrop-blur-sm"
                  >
                    Copy Business Code
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-0 rounded-3xl">
                <CardContent className="p-4">
                  <h4 className="text-slate-800 font-semibold mb-2">Invitation Methods:</h4>
                  <ul className="text-slate-600 text-sm space-y-1">
                    <li>• Send email invitations directly</li>
                    <li>• Share the business code</li>
                    <li>• Share the business QR code</li>
                    <li>• Members can join using the "Join Business" feature</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
