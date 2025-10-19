"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, UserPlus, Users, Crown, Shield, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BusinessService } from "@/lib/businessService"
import { useBackdropClick } from "@/hooks/useBackdropClick"

interface TeamManagementModalProps {
  onClose: () => void
  businessId: string
  businessName: string
  isOwner: boolean
}

interface User {
  id: string
  full_name: string
  ph_number?: string
  profile_pic?: string
}

interface BusinessMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  details: User
}

export default function TeamManagementModal({ 
  onClose, 
  businessId, 
  businessName, 
  isOwner 
}: TeamManagementModalProps) {
  const [currentView, setCurrentView] = useState<"members" | "add">("members")
  const [members, setMembers] = useState<BusinessMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [addingUserId, setAddingUserId] = useState<string | null>(null)
  const handleBackdropClick = useBackdropClick(onClose)

  // Load current members
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setIsLoading(true)
        const businessMembers = await BusinessService.getBusinessMembers(businessId)
        setMembers(businessMembers)
      } catch (error) {
        console.error("Error loading members:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMembers()
  }, [businessId])

  // Load available users when switching to add view
  useEffect(() => {
    if (currentView === "add") {
      const loadUsers = async () => {
        try {
          const users = await BusinessService.getAllUsers()
          // Filter out users who are already members
          const memberUserIds = (members || []).map(m => m.user_id)
          const filtered = users.filter(user => !memberUserIds.includes(user.id))
          setAvailableUsers(filtered)
        } catch (error) {
          console.error("Error loading users:", error)
        }
      }

      loadUsers()
    }
  }, [currentView, members])

  const handleAddMember = async (userId: string) => {
    try {
      setAddingUserId(userId)
      const newMember = await BusinessService.addBusinessMember(businessId, userId)
      
      // Refresh members list
      const updatedMembers = await BusinessService.getBusinessMembers(businessId)
      setMembers(updatedMembers)
      
      // Remove from available users
      setAvailableUsers(prev => prev.filter(user => user.id !== userId))
    } catch (error) {
      console.error("Error adding member:", error)
      alert(error instanceof Error ? error.message : "Failed to add member")
    } finally {
      setAddingUserId(null)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!isOwner) return
    
    try {
      await BusinessService.removeBusinessMember(businessId, userId)
      setMembers(prev => prev.filter(member => member.user_id !== userId))
    } catch (error) {
      console.error("Error removing member:", error)
      alert(error instanceof Error ? error.message : "Failed to remove member")
    }
  }

  const filteredUsers = availableUsers.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.ph_number && user.ph_number.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-600" />
      case "admin":
        return <Shield className="h-4 w-4 text-blue-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800"
      case "admin":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={handleBackdropClick}>
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full blur-2xl"></div>

        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-6 w-6 text-slate-800" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Team Management</h2>
              <p className="text-slate-600 text-sm">{businessName}</p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={currentView === "members" ? "default" : "outline"}
              onClick={() => setCurrentView("members")}
              className="rounded-2xl flex-1 bg-[#192168]"
            >
              <Users className="h-4 w-4 mr-2" />
              Members ({members?.length || 0})
            </Button>
            {isOwner && (
              <Button
                variant={currentView === "add" ? "default" : "outline"}
                onClick={() => setCurrentView("add")}
                className="rounded-2xl flex-1 bg-[#192168] "
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Members
              </Button>
            )}
          </div>

          {/* Members View */}
          {currentView === "members" && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading team members...</p>
                </div>
              ) : (members?.length || 0) === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No team members yet</p>
                </div>
              ) : (
                (members || []).map((member) => (
                  <Card key={member.id} className="bg-white/70 border-0 shadow-lg rounded-3xl">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.details.profile_pic} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                              {member.details.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-slate-800">{member.details.full_name}</h4>
                            <p className="text-slate-600 text-sm">{member.details.ph_number || 'No phone number'}</p>
                            <p className="text-slate-500 text-xs">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`rounded-full ${getRoleBadgeColor(member.role)}`}>
                            {getRoleIcon(member.role)}
                            <span className="ml-1 capitalize">{member.role}</span>
                          </Badge>
                          {isOwner && member.role !== "owner" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.user_id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Add Members View */}
          {currentView === "add" && isOwner && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-2xl bg-white text-black"
                />
              </div>

              {/* Available Users */}
              <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">
                      {searchTerm ? "No users found" : "No available users to add"}
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <Card key={user.id} className="bg-white/70 border-0 shadow-lg rounded-3xl">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profile_pic} />
                              <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                                {user.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-slate-800">{user.full_name}</h4>
                              <p className="text-slate-600 text-sm">{user.ph_number || 'No phone number'}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAddMember(user.id)}
                            disabled={addingUserId === user.id}
                            className="bg-[#192168] hover:bg-green-700 text-white rounded-2xl"
                            size="sm"
                          >
                            {addingUserId === user.id ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Adding...
                              </div>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

