"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, Phone, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

interface ContactSearchProps {
  onBack: () => void
  onSelect: (number: string, contact: any) => void
}

export default function ContactSearch({ onBack, onSelect }: ContactSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [contacts, setContacts] = useState<any[]>([])
  const [hasPermission, setHasPermission] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Fetch all users from database
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true)
      setUsersError("")
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        
        // Get current user info from token
        let userId = null;
        try {
          const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (profileRes.ok) {
            const profileData = await profileRes.json()
            userId = profileData.data?.id
            setCurrentUser(profileData.data)
          }
        } catch {}
        
        // Fetch all users
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        let users = data.data || []
        console.log('Raw users data:', users) // Debug: Check what's in the users array
        
        // Filter out current user from the list
        const filteredUsers = users.filter((user: any) => user.id !== userId)
        setAllUsers(filteredUsers)
        
        // Convert users to contact format
        const formattedContacts = filteredUsers.map((user: any) => {
          console.log(`User ${user.full_name} profile_pic:`, user.profile_pic) // Debug each user's profile pic
          
          // Handle profile pic URL - might need to construct full URL
          let avatarUrl = null;
          if (user.profile_pic) {
            // If it's already a full URL, use it as is
            if (user.profile_pic.startsWith('http://') || user.profile_pic.startsWith('https://')) {
              avatarUrl = user.profile_pic;
            } else if (user.profile_pic.startsWith('/')) {
              // If it starts with /, construct full URL
              avatarUrl = `${process.env.NEXT_PUBLIC_API_URL}${user.profile_pic}`;
            } else {
              // If it's a relative path without /, add both / and the server URL
              avatarUrl = `${process.env.NEXT_PUBLIC_API_URL}/${user.profile_pic}`;
            }
          }
          console.log(`Final avatar URL for ${user.full_name}:`, avatarUrl);
          
          return {
            id: user.id,
            name: user.full_name,
            phone: user.ph_number,
            avatar: avatarUrl,
            profile_pic: user.profile_pic, // Keep original for debugging
            full_name: user.full_name // Add this for consistency
          }
        })
        console.log('Formatted contacts with avatars:', formattedContacts)
        setContacts(formattedContacts)
        setHasPermission(true)
        
      } catch (err: any) {
        setUsersError(err.message || "Failed to fetch users")
      } finally {
        setUsersLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const requestContactAccess = async () => {
    setIsLoading(true)

    // Simulate permission request delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // The actual user fetching is already done in useEffect
    // This is just for UI flow consistency
    setIsLoading(false)
  }

  const filteredContacts = contacts.filter(
    (contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || contact.phone.includes(searchQuery),
  )

  // Show loading state while fetching users
  if (usersLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-6 w-6 text-slate-800" />
          </Button>
          <h2 className="text-2xl font-bold text-slate-800">Loading Contacts</h2>
        </div>
        
        <div className="text-center py-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#192168] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-slate-800 font-bold text-xl mb-4">Loading Contacts</h3>
          <p className="text-slate-600">Fetching available contacts from database...</p>
        </div>
      </div>
    )
  }

  // Show error state if failed to fetch users
  if (usersError) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-6 w-6 text-slate-800" />
          </Button>
          <h2 className="text-2xl font-bold text-slate-800">Error</h2>
        </div>
        
        <div className="text-center py-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center">
            <Users className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-slate-800 font-bold text-xl mb-4">Failed to Load Contacts</h3>
          <p className="text-slate-600 mb-4">{usersError}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-[#192168] text-white rounded-2xl px-6 py-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!hasPermission) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-6 w-6 text-slate-800" />
          </Button>
          <h2 className="text-2xl font-bold text-slate-800">Access Contacts</h2>
        </div>

        <div className="text-center py-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center">
            <Users className="h-12 w-12 text-[#192168]" />
          </div>

          <h3 className="text-slate-800 font-bold text-xl mb-4">Access Your Contacts</h3>
          <p className="text-slate-600 mb-8 max-w-xs mx-auto">
            Loading contacts from database to help you send money quickly to people you know.
          </p>

          <Button
            onClick={requestContactAccess}
            disabled={isLoading}
            className="w-full bg-[#192168] text-white rounded-2xl py-4 text-lg font-semibold shadow-lg shadow-emerald-200/50 transition-all duration-300 disabled:opacity-50 mb-4"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Accessing Contacts...
              </div>
            ) : (
              <>
                <Phone className="h-5 w-5 mr-2" />
                Continue
              </>
            )}
          </Button>

          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> Contacts are loaded from registered users in the database. Only users who have joined the platform will appear in your contact list.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-6 w-6 text-slate-800" />
        </Button>
        <h2 className="text-2xl font-bold text-slate-800">Select Contact</h2>
      </div>

      {/* Call Bara Image */}
      <div className="flex justify-center">
        <img 
          src="/bara/call_bara.png" 
          alt="Call Bara" 
          className="w-50 h-50 object-contain"
        />
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/50 border-0 text-slate-800 placeholder:text-slate-400 rounded-2xl"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <Card
              key={contact.id}
              className="bg-white/50 border-0 shadow-sm cursor-pointer hover:bg-white/70 transition-colors"
              onClick={() => onSelect(contact.phone, contact)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="relative h-10 w-10">
                  {contact.avatar ? (
                    <img 
                      src={contact.avatar} 
                      alt={contact.name}
                      className="w-full h-full object-cover rounded-full"
                      onLoad={() => console.log(`Avatar loaded successfully for ${contact.name}:`, contact.avatar)}
                      onError={(e) => {
                        console.log(`Avatar failed to load for ${contact.name}:`, contact.avatar, e)
                        // Replace with fallback on error
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center font-medium text-sm">${contact.name.split(" ").map((n: string) => n[0]).join("")}</div>`;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center font-medium text-sm">
                      {contact.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{contact.name}</p>
                  <p className="text-sm text-slate-600">{contact.phone}</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-600">No contacts found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  )
}


