"use client";
import { useState, useEffect } from "react";
import { Bell, Menu, Home, BarChart3, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/sidebar";
import NotificationModal from "@/components/notification-modal";
import ProfileModal from "@/components/profile-modal";
import { jwtDecode } from "jwt-decode";

export default function ClientLayout({ children, modalOpen }: { children: React.ReactNode, modalOpen?: boolean }) {
  // State for navigation and modals
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeScreen, setActiveScreen] = useState("home");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  // Sidebar-related state
  const [currentSection, setCurrentSection] = useState("personal");
  const [businessSections, setBusinessSections] = useState<any[]>([]);

  // Fetch notifications on component load
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setNotificationsLoading(false);
          return;
        }

        let currentUserId = "";
        try {
          currentUserId = jwtDecode<{ sub: string }>(token).sub;
        } catch {
          setNotificationsLoading(false);
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (!res.ok) return;
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return;
        
        const responseData = await res.json();
        if (!responseData.data) return;
        
        const { data: loans } = responseData;
        let unreadCount = 0;
        
        // Count pending loans
        const pendingLoans = loans.filter(
          (loan: any) => loan.receiver_id === currentUserId && loan.status === "pending"
        );
        unreadCount += pendingLoans.length;
        
        // Count payment confirmation requests
        const paymentRequests = loans.filter(
          (loan: any) => loan.lender_id === currentUserId && loan.status === "payment_requested"
        );
        unreadCount += paymentRequests.length;
        
        // Count upcoming deadlines (within 3 days)
        const now = new Date();
        const confirmedLoans = loans.filter((loan: any) => loan.status === "confirmed" && loan.deadline);
        for (const loan of confirmedLoans) {
          const deadline = new Date(loan.deadline);
          const daysToDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          if (daysToDeadline <= 3 && daysToDeadline > 0) {
            unreadCount++;
          }
        }
        
        setUnreadNotifications(unreadCount);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchNotifications();
    // Set up periodic check for notifications
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleSidebarToggle = () => setShowSidebar(true);
  const handleProfileClick = () => setShowProfileModal(true);
  const handleNotificationClick = () => {
    setShowNotifications(true);
  };
  // Handlers for sidebar
  const handleSectionChange = (section: string) => setCurrentSection(section);
  const handleBusinessCreated = (businessData: any) => {
    setBusinessSections((prev) => [...prev, businessData]);
    setCurrentSection(businessData.id);
  };
  const handleBusinessJoined = (businessData: any) => {
    setBusinessSections((prev) => [...prev, businessData]);
    setCurrentSection(businessData.id);
  };

  return (
    <>
      {/* Top Navigation */}
      <div className="flex justify-between items-center px-6 py-6 relative z-10 max-w-sm mx-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSidebarToggle}
          className="text-slate-800 hover:bg-white/20 rounded-2xl backdrop-blur-sm"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNotificationClick}
            className="text-slate-800 hover:bg-white/20 rounded-2xl backdrop-blur-sm relative"
          >
            <Bell className="h-6 w-6" />
            {notificationsLoading ? (
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            ) : unreadNotifications > 0 ? (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            ) : null}
          </Button>
          <Avatar
            className="h-12 w-12 ring-2 ring-white/50 shadow-lg cursor-pointer hover:ring-emerald-300 transition-all"
            onClick={handleProfileClick}
          >
            <AvatarImage src={typeof window !== 'undefined' ? (localStorage.getItem('userAvatar') || '/placeholder.svg') : '/placeholder.svg'} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold">
              {typeof window !== 'undefined' ? ((localStorage.getItem('userName') || 'U').charAt(0)) : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-sm mx-auto min-h-screen relative overflow-hidden" style={{ background: '#eaf6ff' }}>
        {children}
      </div>

      {/* Bottom Navigation */}
      <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white/70 border-t border-white/30 px-6 py-4 z-50 rounded-4xl shadow-lg shadow-slate-300/50 supports-backdrop-blur:bg-white/60 backdrop-blur-md transition-all duration-300 ${modalOpen ? 'opacity-60 pointer-events-none backdrop-blur-lg' : ''}`}
        style={{ boxShadow: '0 -6px 24px -4px rgba(30, 41, 59, 0.12)', backdropFilter: modalOpen ? 'blur(16px)' : 'blur(8px)', WebkitBackdropFilter: modalOpen ? 'blur(16px)' : 'blur(8px)' }}>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveScreen("home")}
            className={`rounded-2xl transition-all duration-300 ${activeScreen === "home" ? "text-white" : "text-slate-600 hover:bg-slate-100"}`}
            style={activeScreen === "home" ? { background: '#035fa5' } : {}}
          >
            <Home className={`h-6 w-6 ${activeScreen === "home" ? "text-white" : "text-slate-600"}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveScreen("groups")}
            className={`rounded-2xl transition-all duration-300 ${activeScreen === "groups" ? "text-white" : "text-slate-600 hover:bg-slate-100"}`}
            style={activeScreen === "groups" ? { background: '#035fa5' } : {}}
          >
            <Users className={`h-6 w-6 ${activeScreen === "groups" ? "text-white" : "text-slate-600"}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveScreen("analytics")}
            className={`rounded-2xl transition-all duration-300 ${activeScreen === "analytics" ? "text-white" : "text-slate-600 hover:bg-slate-100"}`}
            style={activeScreen === "analytics" ? { background: '#035fa5' } : {}}
          >
            <BarChart3 className={`h-6 w-6 ${activeScreen === "analytics" ? "text-white" : "text-slate-600"}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveScreen("chat")}
            className={`rounded-2xl transition-all duration-300 ${activeScreen === "chat" ? "text-white" : "text-slate-600 hover:bg-slate-100"}`}
            style={activeScreen === "chat" ? { background: '#035fa5' } : {}}
          >
            <MessageCircle className={`h-6 w-6 ${activeScreen === "chat" ? "text-white" : "text-slate-600"}`} />
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        onBusinessCreated={handleBusinessCreated}
        onBusinessJoined={handleBusinessJoined}
        businessSections={businessSections}
      />
      {/* Modals */}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      {showNotifications && <NotificationModal onClose={() => setShowNotifications(false)} token={typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : ''} onUnreadCountChange={setUnreadNotifications} />}
    </>
  );
}


