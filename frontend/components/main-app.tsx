"use client"

import { useState } from "react"
import {
  Bell,
  Menu,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Edit3,
  Home,
  Grid3X3,
  BarChart3,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import SendModal from "./send-modal"
import ReceiveModal from "./receive-modal"
import ProfileModal from "./profile-modal"
import GroupModal from "./group-modal"
import GroupDetailsModal from "./group-details-modal"

export default function MainApp() {
  const [activeScreen, setActiveScreen] = useState<"home" | "apps" | "transactions" | "profile">("home")
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("weekly")
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showGroupDetails, setShowGroupDetails] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [userGroups, setUserGroups] = useState<any[]>([
    {
      id: 1,
      name: "Family Group",
      members: 4,
      totalBalance: 2500,
      recentActivity: "Mom sent ₹500",
      description: "Family expenses and shared costs",
      membersList: [
        { name: "John Doe", phone: "+91 98765 43210", role: "Admin" },
        { name: "Jane Doe", phone: "+91 87654 32109", role: "Member" },
        { name: "Mom", phone: "+91 76543 21098", role: "Member" },
        { name: "Dad", phone: "+91 65432 10987", role: "Member" },
      ],
      transactions: [
        { from: "Mom", amount: "₹500", time: "2 hours ago", type: "received" },
        { to: "Jane Doe", amount: "₹200", time: "Yesterday", type: "sent" },
      ],
    },
  ])

  const recipients = [
    {
      name: "Monica P.",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "bg-gradient-to-br from-yellow-400 to-orange-500",
    },
    {
      name: "William M.",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "bg-gradient-to-br from-blue-400 to-blue-600",
    },
    {
      name: "Jessica T.",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "bg-gradient-to-br from-pink-400 to-rose-500",
    },
    {
      name: "Tom H.",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "bg-gradient-to-br from-purple-400 to-purple-600",
    },
  ]

  const transactions = [
    { from: "Jordan R.", time: "Today, 17:10", amount: "-₹220", type: "received" },
    { to: "Monica P.", time: "Yesterday, 8:30", amount: "-₹500", type: "sent" },
  ]

  const chartData = [
    { week: "1st week", income: 60, outcome: 40 },
    { week: "2nd week", income: 80, outcome: 30 },
    { week: "3rd week", income: 45, outcome: 25 },
    { week: "4th week", income: 90, outcome: 35 },
  ]

  const handleGroupClick = (group: any) => {
    setSelectedGroup(group)
    setShowGroupDetails(true)
  }

  const handleJoinGroup = (groupData: any) => {
    setUserGroups((prev) => [...prev, groupData])
  }

  const renderContent = () => {
    switch (activeScreen) {
      case "home":
        return (
          <div className="px-6 relative z-10 pb-24">
            <div className="mb-8">
              <p className="text-slate-600 text-sm mb-2 font-medium">Credit Card</p>
              <h1 className="text-slate-800 text-4xl font-bold mb-6 tracking-tight">Total Balance</h1>

              {/* Card Info */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg shadow-sm"></div>
                <span className="text-slate-800 font-semibold text-lg">•••• 5482</span>
                <ChevronDown className="h-5 w-5 text-slate-600 ml-auto" />
              </div>

              {/* Balance Amount */}
              <div className="text-slate-800 text-5xl font-bold mb-12 tracking-tight">
                ₹40,540<span className="text-slate-500 text-3xl font-medium">.74</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-6 mb-12">
              <div className="flex flex-col items-center">
                <Button
                  size="icon"
                  onClick={() => setShowSendModal(true)}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-200/50 transition-all duration-300 hover:scale-105"
                >
                  <ArrowUpRight className="h-8 w-8" />
                </Button>
                <span className="text-slate-700 text-sm mt-3 font-medium">Send</span>
              </div>
              <div className="flex flex-col items-center">
                <Button
                  size="icon"
                  onClick={() => setShowReceiveModal(true)}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl shadow-blue-200/50 transition-all duration-300 hover:scale-105"
                >
                  <ArrowDownLeft className="h-8 w-8" />
                </Button>
                <span className="text-slate-700 text-sm mt-3 font-medium">Receive</span>
              </div>
              <div className="flex flex-col items-center">
                <Button
                  size="icon"
                  onClick={() => setShowGroupModal(true)}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-xl shadow-purple-200/50 transition-all duration-300 hover:scale-105"
                >
                  <Users className="h-8 w-8" />
                </Button>
                <span className="text-slate-700 text-sm mt-3 font-medium">Group</span>
              </div>
            </div>

            {/* Groups Section */}
            {userGroups.length > 0 && (
              <div className="mb-8">
                <h2 className="text-slate-800 text-xl font-bold mb-4">Your Groups</h2>
                <div className="space-y-3">
                  {userGroups.map((group) => (
                    <Card
                      key={group.id}
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl cursor-pointer hover:bg-white/80 transition-colors"
                      onClick={() => handleGroupClick(group)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                              <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{group.name}</p>
                              <p className="text-sm text-slate-600">{group.members} members</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-800">₹{group.totalBalance}</p>
                            <p className="text-xs text-slate-600">{group.recentActivity}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Last Recipients */}
            <div className="mb-8">
              <p className="text-slate-600 text-sm mb-4 font-medium">Last Recipients</p>
              <h2 className="text-slate-800 text-2xl font-bold mb-6">Send to</h2>
              <div className="flex gap-5 mb-8">
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <Avatar className="h-16 w-16 mb-3 ring-2 ring-white/50 shadow-lg">
                      <AvatarImage src={recipient.avatar || "/placeholder.svg"} />
                      <AvatarFallback className={`${recipient.color} text-white text-lg font-semibold`}>
                        {recipient.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-slate-700 text-xs text-center font-medium">{recipient.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-4">
              {transactions.map((transaction, index) => (
                <Card
                  key={index}
                  className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl"
                >
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          transaction.type === "received"
                            ? "bg-gradient-to-br from-green-100 to-emerald-100"
                            : "bg-gradient-to-br from-red-100 to-rose-100"
                        }`}
                      >
                        {transaction.type === "received" ? (
                          <ArrowDownLeft className="h-6 w-6 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="h-6 w-6 text-rose-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-slate-800 font-semibold text-base">
                          {transaction.from ? `From ${transaction.from}` : `To ${transaction.to}`}
                        </p>
                        <p className="text-slate-500 text-sm">{transaction.time}</p>
                      </div>
                    </div>
                    <span className="text-slate-800 font-bold text-lg">{transaction.amount}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case "apps":
        return (
          <div className="px-6 relative z-10 pb-24">
            <h1 className="text-slate-800 text-3xl font-bold mb-8 tracking-tight">Apps & Services</h1>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "Bill Pay", icon: "💡", color: "from-yellow-400 to-orange-500" },
                { name: "Mobile Recharge", icon: "📱", color: "from-blue-400 to-blue-600" },
                { name: "Insurance", icon: "🛡️", color: "from-green-400 to-green-600" },
                { name: "Investments", icon: "📈", color: "from-purple-400 to-purple-600" },
                { name: "Loans", icon: "🏦", color: "from-red-400 to-red-600" },
                { name: "Travel", icon: "✈️", color: "from-indigo-400 to-indigo-600" },
              ].map((app, index) => (
                <Card
                  key={index}
                  className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl"
                >
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${app.color} rounded-2xl flex items-center justify-center text-2xl`}
                    >
                      {app.icon}
                    </div>
                    <p className="font-semibold text-slate-800">{app.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case "transactions":
        return (
          <div className="px-6 relative z-10 pb-24">
            <div className="mb-8">
              <p className="text-slate-600 text-sm mb-2 font-medium">Optimize performances</p>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-slate-800 text-4xl font-bold tracking-tight">Analytics</h1>
                <div className="flex items-center gap-2 text-slate-600 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-2">
                  <span className="font-medium">Dec 22</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-3 mb-8">
              <Button
                variant={activeTab === "daily" ? "default" : "outline"}
                onClick={() => setActiveTab("daily")}
                className={`rounded-2xl px-8 py-3 font-semibold transition-all duration-300 ${
                  activeTab === "daily"
                    ? "bg-white text-slate-800 shadow-lg shadow-slate-200/50"
                    : "bg-white/30 text-slate-700 border-0 hover:bg-white/50 backdrop-blur-sm"
                }`}
              >
                Daily
              </Button>
              <Button
                variant={activeTab === "weekly" ? "default" : "outline"}
                onClick={() => setActiveTab("weekly")}
                className={`rounded-2xl px-8 py-3 font-semibold transition-all duration-300 ${
                  activeTab === "weekly"
                    ? "bg-white text-slate-800 shadow-lg shadow-slate-200/50"
                    : "bg-white/30 text-slate-700 border-0 hover:bg-white/50 backdrop-blur-sm"
                }`}
              >
                Weekly
              </Button>
            </div>

            {/* Balance Amount */}
            <div className="text-slate-800 text-5xl font-bold mb-12 tracking-tight">
              ₹21,023<span className="text-slate-500 text-3xl font-medium">.45</span>
            </div>

            {/* Chart */}
            <div className="mb-8">
              <div className="flex justify-end gap-6 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"></div>
                  <span className="text-slate-600 font-medium">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-slate-300 to-slate-400 rounded-full"></div>
                  <span className="text-slate-600 font-medium">Outcome</span>
                </div>
              </div>
              <div className="flex items-end justify-between h-40 mb-6 bg-white/50 backdrop-blur-sm rounded-3xl p-6">
                {chartData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-8 bg-gradient-to-t from-emerald-500 to-teal-600 rounded-t-lg shadow-sm"
                        style={{ height: `${data.income}px` }}
                      ></div>
                      <div
                        className="w-8 bg-gradient-to-t from-slate-300 to-slate-400 rounded-t-lg shadow-sm"
                        style={{ height: `${data.outcome}px` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                {chartData.map((data, index) => (
                  <span key={index}>{data.week}</span>
                ))}
              </div>
            </div>

            {/* History Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Credit Card</p>
                  <h2 className="text-slate-800 text-2xl font-bold">History</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-600 hover:bg-white/30 rounded-2xl backdrop-blur-sm"
                >
                  <Edit3 className="h-5 w-5" />
                </Button>
              </div>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">N</span>
                    </div>
                    <div>
                      <p className="text-slate-800 font-semibold text-base">Netflix</p>
                      <p className="text-slate-500 text-sm">01.12.2022, 14:40</p>
                    </div>
                  </div>
                  <span className="text-slate-800 font-bold text-lg">-₹17</span>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "profile":
        return (
          <div className="px-6 relative z-10 pb-24">
            <h1 className="text-slate-800 text-3xl font-bold mb-8 tracking-tight">Profile</h1>
            <div className="space-y-4">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-white/50 shadow-lg">
                      <AvatarImage src="/placeholder.svg?height=64&width=64" />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xl font-bold">
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-slate-800 font-bold text-xl">John Doe</h3>
                      <p className="text-slate-600">john.doe@email.com</p>
                      <p className="text-slate-600 text-sm">+91 98765 43210</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {[
                { title: "Account Settings", icon: "⚙️" },
                { title: "Security", icon: "🔒" },
                { title: "Notifications", icon: "🔔" },
                { title: "Help & Support", icon: "❓" },
                { title: "About", icon: "ℹ️" },
              ].map((item, index) => (
                <Card
                  key={index}
                  className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl"
                >
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-slate-800 font-medium">{item.title}</span>
                    </div>
                    <ChevronDown className="h-5 w-5 text-slate-600 rotate-[-90deg]" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Mobile Container */}
      <div className="max-w-sm mx-auto bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 min-h-screen relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full blur-2xl"></div>

        {/* Status Bar */}
        <div className="flex justify-between items-center px-6 pt-4 pb-2 text-slate-800 text-sm font-medium relative z-10">
          <span className="font-semibold">9:41</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-slate-800 rounded-full"></div>
              <div className="w-1 h-3 bg-slate-800 rounded-full"></div>
              <div className="w-1 h-3 bg-slate-800 rounded-full"></div>
              <div className="w-1 h-3 bg-slate-800/50 rounded-full"></div>
            </div>
            <div className="w-6 h-3 border border-slate-800 rounded-sm ml-1">
              <div className="w-4 h-2 bg-slate-800 rounded-sm m-0.5"></div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-6 relative z-10">
          <Button variant="ghost" size="icon" className="text-slate-800 hover:bg-white/20 rounded-2xl backdrop-blur-sm">
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-800 hover:bg-white/20 rounded-2xl backdrop-blur-sm relative"
            >
              <Bell className="h-6 w-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            </Button>
            <Avatar
              className="h-12 w-12 ring-2 ring-white/50 shadow-lg cursor-pointer hover:ring-emerald-300 transition-all"
              onClick={() => setShowProfileModal(true)}
            >
              <AvatarImage src="/placeholder.svg?height=48&width=48" />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold">
                JD
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Content */}
        {renderContent()}

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white/80 backdrop-blur-md border-t border-white/20 px-6 py-4 z-50">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveScreen("home")}
              className={`rounded-2xl transition-all duration-300 ${
                activeScreen === "home" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Home className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveScreen("apps")}
              className={`rounded-2xl transition-all duration-300 ${
                activeScreen === "apps" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Grid3X3 className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveScreen("transactions")}
              className={`rounded-2xl transition-all duration-300 ${
                activeScreen === "transactions" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveScreen("profile")}
              className={`rounded-2xl transition-all duration-300 ${
                activeScreen === "profile" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <User className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals - Centered for mobile */}
      {showSendModal && <SendModal onClose={() => setShowSendModal(false)} />}
      {showReceiveModal && <ReceiveModal onClose={() => setShowReceiveModal(false)} />}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      {showGroupModal && <GroupModal onClose={() => setShowGroupModal(false)} onJoinGroup={handleJoinGroup} />}
      {showGroupDetails && selectedGroup && (
        <GroupDetailsModal group={selectedGroup} onClose={() => setShowGroupDetails(false)} />
      )}
    </div>
  )
}

