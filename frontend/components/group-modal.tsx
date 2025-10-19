"use client"

import { useState, useEffect, useRef } from "react"
import { X, Users, Plus, QrCode, ArrowLeft, Copy, Check, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import QRScanner from "./qr-scanner"

interface GroupModalProps {
  onClose: () => void
  onJoinGroup: (groupData: any) => void
  onCreateGroup?: (groupName: string, memberPhones: string[], onSuccess: () => void, onError: (msg: string) => void) => void
}

type Step = "main" | "create" | "join" | "invite" | "scan"

export default function GroupModal({ onClose, onJoinGroup, onCreateGroup }: GroupModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("create")
  const [groupName, setGroupName] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<any[]>([])
  const [groupCode, setGroupCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState("")
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Fetch all users on mount and get profile_pic by user id
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true)
      setUsersError("")
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        // Get current user info from token (assume JWT with id, or fetch from /profile)
        let userId = null;
        try {
          const profileRes = await fetch("http://localhost:3000/profile", {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (profileRes.ok) {
            const profileData = await profileRes.json()
            userId = profileData.data?.id
            setCurrentUser(profileData.data)
          }
        } catch {}
        const res = await fetch("http://localhost:3000/users", {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        let users = data.data || []
        // Fetch profile_pic for each user by id
        const usersWithPics = await Promise.all(users.map(async (user: any) => {
          try {
            const picRes = await fetch(`http://localhost:3000/users/id/${user.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (!picRes.ok) return user
            const picData = await picRes.json()
            return { ...user, profile_pic: picData.data?.profile_pic || null }
          } catch {
            return user
          }
        }))
        // Move current user to top and auto-select
        let sortedUsers = usersWithPics
        if (userId) {
          const idx = usersWithPics.findIndex((u: any) => u.id === userId)
          if (idx !== -1) {
            const [me] = usersWithPics.splice(idx, 1)
            sortedUsers = [me, ...usersWithPics]
            setSelectedContacts([me])
          }
        }
        setAllUsers(sortedUsers)
      } catch (err: any) {
        setUsersError(err.message || "Failed to fetch users")
      } finally {
        setUsersLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    setCreateError("")
    if (onCreateGroup) {
      setCreateLoading(true)
      onCreateGroup(
        groupName,
        selectedContacts.map((c) => c.ph_number), // FIXED: use ph_number
        () => {
          setCreateLoading(false)
          onClose()
        },
        (msg) => {
          setCreateError(msg)
          setCreateLoading(false)
        }
      )
    } else {
      // fallback: local only
      const code = `GRP${Date.now().toString().slice(-6)}`
      setGroupCode(code)
      const newGroup = {
        id: Date.now(),
        name: groupName,
        members: selectedContacts.length + 1,
        totalBalance: 0,
        recentActivity: "Group created",
        code: code,
      }
      onJoinGroup(newGroup)
      onClose()
    }
  }

  const handleJoinGroup = (groupData: string) => {
    // Simulate joining a group from QR scan
    const newGroup = {
      id: Date.now(),
      name: "Scanned Group",
      members: 5,
      totalBalance: 1200,
      recentActivity: "You joined the group",
      code: groupData,
    }

    onJoinGroup(newGroup)
    console.log('GroupModal: handleJoinGroup -> calling onClose')
    onClose()
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(groupCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy group code:", err)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case "main":
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-slate-800">Groups</h2>
            </div>

            <p className="text-slate-600 mb-8 font-medium">Create a new group or join an existing one</p>

            <div className="space-y-4">
              <Card
                className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl cursor-pointer hover:bg-white/80 transition-colors"
                onClick={() => setCurrentStep("create")}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-2xl flex items-center justify-center">
                    <Plus className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Create Group</h3>
                    <p className="text-sm text-slate-600">Start a new group and invite members</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl cursor-pointer hover:bg-white/80 transition-colors"
                onClick={() => setCurrentStep("join")}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Join Group</h3>
                    <p className="text-sm text-slate-600">Scan QR code to join an existing group</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "create":
        return (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" onClick={() => setCurrentStep("main")}> 
                <ArrowLeft className="h-6 w-6 text-slate-800" />
              </Button>
              <h2 className="text-2xl font-bold text-slate-800">Create Group</h2>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="groupName" className="text-slate-800 font-medium">
                  Group Name
                </Label>
                <Input
                  id="groupName"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="mt-2 bg-white/50 border-0 text-slate-800 placeholder:text-slate-500 rounded-2xl"
                />
              </div>

              <div>
                <Label className="text-slate-800 font-medium mb-3 block">Add Members</Label>
                {usersLoading ? (
                  <div className="text-slate-600">Loading users...</div>
                ) : usersError ? (
                  <div className="text-red-600">{usersError}</div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {allUsers
                      // Always keep creator at the top, then selected (not creator), then unselected
                      .sort((a, b) => {
                        if (currentUser && a.id === currentUser.id) return -1;
                        if (currentUser && b.id === currentUser.id) return 1;
                        const aSelected = selectedContacts.some((c) => c.id === a.id && a.id !== currentUser?.id)
                        const bSelected = selectedContacts.some((c) => c.id === b.id && b.id !== currentUser?.id)
                        if (aSelected && !bSelected) return -1;
                        if (!aSelected && bSelected) return 1;
                        return 0;
                      })
                      .map((user) => {
                        const isSelected = selectedContacts.some((c) => c.id === user.id)
                        const isCreator = currentUser && user.id === currentUser.id
                        return (
                          <div
                            key={user.id}
                            className={`flex items-center gap-2 bg-white/70 rounded-2xl px-3 py-2 cursor-pointer ${isSelected ? 'bg-emerald-100' : ''}`}
                            onClick={() => {
                              if (!isSelected) {
                                // Add to selectedContacts (after creator if not creator)
                                setSelectedContacts((prev) => {
                                  if (isCreator) return prev // can't deselect creator
                                  const creator = prev.find((c) => c.id === currentUser?.id)
                                  const rest = prev.filter((c) => c.id !== user.id && c.id !== currentUser?.id)
                                  return creator ? [creator, ...rest, user] : [...rest, user]
                                })
                              } else if (!isCreator) {
                                setSelectedContacts((prev) => prev.filter((c) => c.id !== user.id))
                              }
                            }}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.profile_pic || "/placeholder.svg?height=40&width=40"} />
                              <AvatarFallback className="bg-emerald-500 text-white text-xs">
                                {user.full_name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-slate-800 text-sm font-medium">{user.full_name} ({user.ph_number})</span>
                            {isSelected && (
                              <span className="ml-auto">
                                {isCreator ? (
                                  <Crown className="h-5 w-5 text-yellow-500" />
                                ) : (
                                  <span className="text-[#192168] font-bold">✓</span>
                                )}
                              </span>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || createLoading || selectedContacts.length === 0}
                className="w-full bg-[#192168] text-white rounded-2xl py-4 text-lg font-semibold shadow-lg shadow-emerald-200/50 transition-all duration-300 disabled:opacity-50"
              >
                {createLoading ? "Creating..." : "Create Group"}
              </Button>
              {createError && <div className="text-red-600 text-sm mt-2">{createError}</div>}

              {groupCode && (
                <Card className="bg-gradient-to-r from-emerald-100 to-teal-100 border-0 rounded-3xl">
                  <CardContent className="p-4">
                    <div className="text-center mb-4">
                      <h4 className="text-slate-800 font-bold mb-2">Group Created!</h4>
                      <div className="w-24 h-24 mx-auto bg-white rounded-2xl p-2 shadow-inner mb-3">
                        <img
                          src="/placeholder.svg?height=96&width=96&text=Group+QR"
                          alt="Group QR Code"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white/50 rounded-2xl p-3">
                      <span className="text-slate-800 font-mono font-medium">{groupCode}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyCode}
                        className="rounded-xl hover:bg-emerald-100"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-slate-600" />
                        )}
                      </Button>
                    </div>
                    <p className="text-slate-600 text-sm text-center mt-3">
                      Share this QR code or group code with others to invite them
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )

      case "invite":
        return (
          <div>Invite Step (Coming Soon)</div>
        )

      case "join":
        return (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" onClick={() => setCurrentStep("main")}>
                <ArrowLeft className="h-6 w-6 text-slate-800" />
              </Button>
              <h2 className="text-2xl font-bold text-slate-800">Join Group</h2>
            </div>

            <p className="text-slate-600 mb-8 font-medium">Scan the group QR code to join</p>

            <Button
              onClick={() => setCurrentStep("scan")}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl py-4 text-lg font-semibold shadow-lg shadow-blue-200/50 transition-all duration-300 mb-6"
            >
              <QrCode className="h-5 w-5 mr-2" />
              Scan QR Code
            </Button>

            <div className="text-center">
              <p className="text-slate-600 text-sm mb-4">Or enter group code manually</p>
              <Input
                placeholder="Enter group code"
                className="bg-white/50 border-0 text-slate-800 placeholder:text-slate-500 rounded-2xl mb-4"
              />
              <Button
                variant="outline"
                className="w-full bg-white/50 border-0 text-slate-700 hover:bg-white/70 rounded-2xl py-3 font-semibold backdrop-blur-sm"
              >
                Join Group
              </Button>
            </div>
          </div>
        )

      case "scan":
        return <QRScanner onBack={() => setCurrentStep("join")} onScan={handleJoinGroup} />

      default:
        return null
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ pointerEvents: 'auto', zIndex: 99999 }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 w-full max-w-sm mx-auto rounded-3xl max-h-[90vh] overflow-y-auto relative"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-2xl"></div>
        {renderStepContent()}
      </div>
    </div>
  )
}
