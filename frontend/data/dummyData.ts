// Dummy data for the app

export const recipients = [
  {
    name: "Monica P.",
    phone: "+977 9876543210",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
  {
    name: "William M.",
    phone: "+977 9765432109",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "bg-gradient-to-br from-blue-400 to-blue-600",
  },
  {
    name: "Jessica T.",
    phone: "+977 9654321098",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "bg-gradient-to-br from-pink-400 to-rose-500",
  },
  {
    name: "Tom H.",
    phone: "+977 9543210987",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "bg-gradient-to-br from-purple-400 to-purple-600",
  },
]

export const transactions = [
  { from: "Jordan R.", time: "Today, 17:10", amount: "-₹220", type: "received" },
  { to: "Monica P.", time: "Yesterday, 8:30", amount: "-₹500", type: "sent" },
]

export const chartData = [
  { week: "1st week", income: 60, outcome: 40 },
  { week: "2nd week", income: 80, outcome: 30 },
  { week: "3rd week", income: 45, outcome: 25 },
  { week: "4th week", income: 90, outcome: 35 },
]

export const initialUserGroups = [
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
]

export const initialBusinessSections = []

