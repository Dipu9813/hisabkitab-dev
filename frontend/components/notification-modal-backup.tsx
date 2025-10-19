"use client"

import { X, Bell, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { jwtDecode } from "jwt-decode"
import { Button } from "@/components            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
                  <Bell className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-600 text-lg font-semibold">No notifications yet</p>
                <p className="text-slate-500 text-sm">You're all caught up!</p>
              </div>
            )}
            {!loading && notifications.map((notification) => (n"
import { Card, CardContent } from "@/components/ui/card"

interface NotificationModalProps {
  onClose: () => void
  token: string
  onUnreadCountChange?: (count: number) => void
}

export default function NotificationModal({ onClose, token, onUnreadCountChange }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Get user ID from token
  let currentUserId = ""
  try {
    currentUserId = jwtDecode<{ sub: string }>(token).sub
  } catch {}

  useEffect(() => {
    const checkNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) {
          console.error("Failed to fetch loans:", res.status, res.statusText);
          return;
        }
        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Invalid response type:", contentType);
          return;
        }
        const responseData = await res.json()
        if (!responseData.data) {
          console.error("No data in response:", responseData);
          return;
        }
        const { data: loans } = responseData
        let newNotifications = []
        
        // Pending loans
        const pendingLoans = loans.filter(
          (loan: any) => loan.receiver_id === currentUserId && loan.status === "pending"
        )
        console.log("Pending loans found:", pendingLoans.length);
        for (const loan of pendingLoans) {
          newNotifications.push({
            id: `pending_${loan.id}`,
            title: "Pending Loan Request",
            message: `${loan.lender?.full_name || 'Someone'} wants to lend you रु${loan.amount}`,
            time: new Date(loan.created_at || loan.date).toLocaleString(),
            read: false,
          })
        }
        
        // Payment confirmations needed
        const paymentRequests = loans.filter(
          (loan: any) => loan.lender_id === currentUserId && loan.status === "payment_requested"
        )
        console.log("Payment requests found:", paymentRequests.length);
        for (const loan of paymentRequests) {
          newNotifications.push({
            id: `payment_${loan.id}`,
            title: "Payment Confirmation",
            message: `${loan.receiver?.full_name || 'Someone'} claims to have paid रु${loan.amount}`,
            time: new Date(loan.updated_at || loan.date).toLocaleString(),
            read: false,
          })
        }
        
        // Deadlines
        const now = new Date()
        const confirmedLoans = loans.filter((loan: any) => loan.status === "confirmed" && loan.deadline)
        console.log("Confirmed loans with deadline:", confirmedLoans.length);
        for (const loan of confirmedLoans) {
          const deadline = new Date(loan.deadline)
          const daysToDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          if (daysToDeadline <= 3 && daysToDeadline > 0) {
            const userRole = loan.lender_id === currentUserId ? "lender" : "receiver"
            newNotifications.push({
              id: `deadline_${loan.id}`,
              title: "Loan Due Soon",
              message:
                userRole === "lender"
                  ? `Your loan of रु${loan.amount} to ${loan.receiver?.full_name || 'someone'} is due in ${Math.ceil(daysToDeadline)} days`
                  : `You need to repay रु${loan.amount} to ${loan.lender?.full_name || 'someone'} in ${Math.ceil(daysToDeadline)} days`,
              time: new Date().toLocaleString(),
              read: false,
            })
          }
        }
        
        console.log("Total notifications generated:", newNotifications.length);
        setNotifications(newNotifications)
        setUnreadCount(newNotifications.length)
        onUnreadCountChange?.(newNotifications.length)
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    checkNotifications()
    const interval = setInterval(checkNotifications, 30000)
    return () => clearInterval(interval)
  }, [token, currentUserId])

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
    const newCount = Math.max(0, unreadCount - 1)
    setUnreadCount(newCount)
    onUnreadCountChange?.(newCount)
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    setUnreadCount(0)
    onUnreadCountChange?.(0)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-[#eaf6ff] w-full max-w-sm mx-auto rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Notifications</h2>
              {unreadCount > 0 && <p className="text-slate-600 text-sm">{unreadCount} unread notifications</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl hover:bg-white/30">
              <X className="h-6 w-6 text-slate-600" />
            </Button>
          </div>

          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="w-full bg-[#192168] border-0 text-[#eaf6ff] hover:bg-white/70 rounded-2xl py-3 font-semibold backdrop-blur-sm mb-6"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}

          {/* Notifications List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
                  <Bell className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-600 text-lg font-semibold">No notifications yet</p>
                <p className="text-slate-500 text-sm">You’re all caught up!</p>
              </div>
            )}
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-all duration-300 ${
                  notification.read
                    ? "bg-white/50 border-0 shadow-sm"
                    : "bg-white/80 border-2 border-blue-200 shadow-lg shadow-emerald-100/50"
                } rounded-3xl hover:bg-white/90`}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        notification.read ? "bg-slate-100" : "bg-blue-300/20"
                      }`}
                    >
                      <Bell className={`h-5 w-5 text-[#192168]`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-slate-800 text-sm">{notification.title}</h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-[#192168] rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm mb-2">{notification.message}</p>
                      <p className="text-slate-500 text-xs">{notification.time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}



