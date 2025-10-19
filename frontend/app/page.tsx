"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Menu,
  Home,
  Grid3X3,
  BarChart3,
  MessageCircle,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import SendModal from "../components/send-modal"
import ReceiveModal from "../components/receive-modal"
import ProfileModal from "../components/profile-modal"
import GroupModal from "../components/group-modal"
import { recipients, transactions, chartData, initialUserGroups, initialBusinessSections } from "../data/dummyData"
import HomeScreen from "@/components/HomeScreen"
import GroupsScreen from "@/components/GroupsScreen"
import AnalyticsScreen from "@/components/AnalyticsScreen"
import AIChatScreen from "@/components/ai-chat-screen"
import SplashScreen from "@/components/splash-screen"
import QRUploadScreen from "@/components/qr-upload-screen"
import GroupDetailsModal from "@/components/group-details-modal"
import TransactionDetailModal from "@/components/transaction-detail-modal"
import NotificationModal from "@/components/notification-modal"
import BusinessContactsModal from "@/components/business-contacts-modal"
import BusinessQRModal from "@/components/business-qr-modal"
import Sidebar from "@/components/sidebar"
import SignInPage from "./login/page"
import { useRouter } from "next/navigation"
import GroupTransactionsModal from "@/components/GroupTransactionsModal"
import { BusinessService } from "@/lib/businessService"
import TeamManagementModal from "@/components/TeamManagementModal"
import AddBusinessLoanModal from "@/components/AddBusinessLoanModal"
//overall page
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<"splash" | "auth" | "qr-upload" | "main">("splash")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeScreen, setActiveScreen] = useState<"home" | "groups" | "analytics" | "chat">("home")
  const [currentSection, setCurrentSection] = useState("personal")
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("weekly")
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showGroupDetails, setShowGroupDetails] = useState(false)
  const [showTransactionDetail, setShowTransactionDetail] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [userGroups, setUserGroups] = useState<any[]>([])
  const [businessSections, setBusinessSections] = useState<any[]>(initialBusinessSections)
  const [showBusinessContacts, setShowBusinessContacts] = useState(false)
  const [showBusinessQR, setShowBusinessQR] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showTeamManagement, setShowTeamManagement] = useState(false)
  const [showAddBusinessLoan, setShowAddBusinessLoan] = useState(false)
  const [businessRefreshKey, setBusinessRefreshKey] = useState(0) // Add refresh key for business components
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [groupsError, setGroupsError] = useState("")
  const [showGroupTransactionsModal, setShowGroupTransactionsModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const router = useRouter();

  // Section data
  const handleBusinessCreated = (businessData: any) => {
    // Format the business data consistently
    const formattedBusiness = {
      id: businessData.id,
      name: businessData.name,
      icon: "🏢",
      balance: businessData.balance || "रु0.00",
      description: `Business Code: ${businessData.businessCode}`,
      businessCode: businessData.businessCode,
      cardNumber: businessData.cardNumber || `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
      isOwner: true, // Creator is always owner
      joinedAt: businessData.createdAt,
      createdAt: businessData.createdAt,
      members: businessData.members || 1,
      role: "Owner",
      qrCode: businessData.qrCode || `business_qr_${businessData.id}`,
    };
    
    setBusinessSections((prev) => [...prev, formattedBusiness]);
    setCurrentSection(formattedBusiness.id);
  }

  const handleBusinessJoined = (businessData: any) => {
    // Format the business data consistently
    const formattedBusiness = {
      id: businessData.id,
      name: businessData.name,
      icon: "🏢",
      balance: businessData.balance || "रु0.00",
      description: `Business Code: ${businessData.businessCode}`,
      businessCode: businessData.businessCode,
      cardNumber: businessData.cardNumber || `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
      isOwner: false, // Joined users are not owners
      joinedAt: businessData.joinedAt,
      createdAt: businessData.createdAt,
      members: businessData.members || 1,
      role: "Member",
      qrCode: businessData.qrCode || `business_qr_${businessData.id}`,
    };
    
    setBusinessSections((prev) => [...prev, formattedBusiness]);
    setCurrentSection(formattedBusiness.id);
  }

  const getAllSectionData = () => {
    const sections: { [key: string]: { name: string; balance: string; cardNumber: string; type: string; businessCode?: string; isOwner?: boolean } } = {
      personal: {
        name: "SRK",
        balance: "रु40,540.74",
        cardNumber: "•••• 5482",
        type: "Personal Account",
      },
    };

    businessSections.forEach((business) => {
      sections[business.id] = {
        name: business.name,
        balance: business.balance,
        cardNumber: business.cardNumber,
        type: "Business Account",
        businessCode: business.businessCode,
        isOwner: business.isOwner,
      }
    })

    return sections
  }
  
  // Load user's businesses on app start
  const loadUserBusinesses = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        console.log("No token found, skipping business loading");
        return;
      }

      console.log("Loading user businesses...");
      const businesses = await BusinessService.getUserBusinesses();
      console.log("Loaded businesses:", businesses);
      
      // Load business totals for each business
      const formattedBusinesses = await Promise.all(
        businesses.map(async (business: any) => {
          let balance = "रु0.00";
          try {
            const total = await BusinessService.getBusinessTotalAmount(business.id);
            balance = `रु${total.toLocaleString()}`;
          } catch (error) {
            console.error(`Error loading balance for business ${business.id}:`, error);
          }

          // Generate a modern business icon based on business name
          const getBusinessIcon = (businessName: string) => {
            const name = businessName.toLowerCase();
            // Industry-specific icons
            if (name.includes('restaurant') || name.includes('food') || name.includes('cafe')) return '🍽️';
            if (name.includes('tech') || name.includes('software') || name.includes('digital')) return '💻';
            if (name.includes('shop') || name.includes('store') || name.includes('retail')) return '🛍️';
            if (name.includes('medical') || name.includes('health') || name.includes('clinic')) return '🏥';
            if (name.includes('education') || name.includes('school') || name.includes('academy')) return '🎓';
            if (name.includes('finance') || name.includes('bank') || name.includes('investment')) return '💰';
            if (name.includes('construction') || name.includes('build') || name.includes('engineering')) return '🏗️';
            if (name.includes('transport') || name.includes('logistics') || name.includes('delivery')) return '🚚';
            if (name.includes('consulting') || name.includes('service') || name.includes('agency')) return '💼';
            if (name.includes('creative') || name.includes('design') || name.includes('art')) return '🎨';
            
            // Fallback to first letter with colored background
            return business.name.charAt(0).toUpperCase();
          };

          return {
            id: business.id,
            name: business.name,
            icon: getBusinessIcon(business.name),
            balance,
            description: `Business Code: ${business.businessId}`,
            businessCode: business.businessId,
            cardNumber: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
            isOwner: business.isOwner,
            joinedAt: business.joinedAt,
            createdAt: business.createdAt,
            members: 1,
            role: business.isOwner ? "Owner" : "Member",
            qrCode: `business_qr_${business.id}`,
          };
        })
      );
      
      console.log("Formatted businesses with balances:", formattedBusinesses);
      setBusinessSections(formattedBusinesses);
    } catch (error) {
      console.error("Error loading businesses:", error);
      // Don't show alert here as it might be due to network issues or server being down
      // Just log the error and continue
    }
  }
  
  useEffect(() => {
    // Check for token in localStorage on mount
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      setIsAuthenticated(true);
      setCurrentScreen('main');
      // Load businesses when user is authenticated
      loadUserBusinesses();
    } else {
      // Show splash screen for 4 seconds, then go to auth
      const timer = setTimeout(() => {
        setCurrentScreen("auth");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Move fetchGroups to top-level so it can be called from anywhere
  const fetchGroups = async () => {
    setGroupsLoading(true);
    setGroupsError("");
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const groups = data.data || [];
      // Fetch details for each group
      const detailedGroups = await Promise.all(
        groups.map(async (group: any) => {
          try {
            const detailRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/groups/${group.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (!detailRes.ok) throw new Error();
            const detailData = await detailRes.json();
            return {
              ...group,
              phase: group.phase, // Ensure phase is always present
              members: detailData.members?.length || 0,
              membersList:
                detailData.members?.map((m: any) => ({
                  name: m.details?.full_name || "",
                  phone: m.details?.ph_number || "",
                  avatar: m.details?.profile_pic || "/placeholder.svg",
                  role: group.creator_id === m.user_id ? "Admin" : "Member",
                })) || [],
              // Add more details as needed
            };
          } catch {
            return group;
          }
        })
      );
      // Sort by phase: active first, then settled, then by created_at descending
      detailedGroups.sort((a, b) => {
        const phaseOrder: Record<string, number> = { active: 0, settled: 1 };
        const aPhase = phaseOrder[String(a.phase)] ?? 2;
        const bPhase = phaseOrder[String(b.phase)] ?? 2;
        if (aPhase !== bPhase) return aPhase - bPhase;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      setUserGroups(detailedGroups);
    } catch (err: any) {
      setGroupsError(err.message || "Failed to fetch groups");
    } finally {
      setGroupsLoading(false);
    }
  };

  // Fetch groups from backend and then fetch details for each group
  useEffect(() => {
    if (isAuthenticated) {
      fetchGroups()
      loadUserBusinesses() // Also load businesses when authenticated
      loadNotifications() // Load notifications when authenticated
    }
  }, [isAuthenticated])

  // Load notifications on app start
  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setNotificationsLoading(false);
        return;
      }

      const { jwtDecode } = await import('jwt-decode');
      let currentUserId = "";
      try {
        currentUserId = jwtDecode<{ sub: string }>(token).sub;
      } catch {
        setNotificationsLoading(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans`, {
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
      console.error("Error loading notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Set up periodic notification checking
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(loadNotifications, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
    setCurrentScreen("main")
    // Load businesses when user successfully authenticates
    loadUserBusinesses()
    // Load notifications when user successfully authenticates
    loadNotifications()
  }

  const handleSignupSuccess = () => {
    setCurrentScreen("qr-upload");
  };

  const handleQRUploadComplete = () => {
    setIsAuthenticated(true)
    setCurrentScreen("main")
    // Load businesses when user completes onboarding
    loadUserBusinesses()
    // Load notifications when user completes onboarding
    loadNotifications()
  }

  const handleQRUploadBack = () => {
    setCurrentScreen("auth");
  };

  const handleSendClick = (recipient?: any) => {
    if (recipient) {
      setSelectedRecipient(recipient);
    }
    setShowSendModal(true);
  };

  const handleReceiveClick = () => {
    setShowReceiveModal(true);
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleGroupClick = (group?: any) => {
    if (group) {
      setSelectedGroup(group);
      setShowGroupDetails(true);
    } else {
      setShowGroupModal(true);
    }
  };

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetail(true);
  };

  const handleNotificationClick = () => {
    setShowNotifications(true);
  };

  const handleSidebarToggle = () => {
    setShowSidebar(true);
  };

  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
  };

  const handleCloseSendModal = () => {
    setShowSendModal(false);
    setSelectedRecipient(null);
  };

  const handleCloseReceiveModal = () => {
    setShowReceiveModal(false);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  const handleCloseGroupModal = () => {
    setShowGroupModal(false);
  };

  // Group creation handler
  const handleCreateGroup = async (
    groupName: string,
    memberPhones: string[],
    onSuccess: () => void,
    onError: (msg: string) => void
  ) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: groupName, memberPhones }),
      });
      if (!res.ok) throw new Error(await res.text());
      // After creating, re-fetch all groups to update UI
      await fetchGroups();
      onSuccess();
    } catch (err: any) {
      onError(err.message || "Failed to create group");
    }
  };

  // Join group handler (simulate or call backend as needed)
  const handleJoinGroup = (groupData: any) => {
    setUserGroups((prev) => [...prev, groupData]);
  };

  const getCurrentSectionData = () => {
    const allSections = getAllSectionData();
    return (
      allSections[currentSection as keyof typeof allSections] ||
      allSections.personal
    );
  };

  const renderContent = () => {
    const sectionInfo = getCurrentSectionData();

    switch (activeScreen) {
      case "home":
        return (
          <HomeScreen
            sectionInfo={sectionInfo}
            currentSection={currentSection}
            recipients={recipients}
            transactions={transactions}
            handleSendClick={handleSendClick}
            handleReceiveClick={handleReceiveClick}
            setActiveScreen={setActiveScreen}
            handleGroupClick={handleGroupClick}
            setShowBusinessContacts={() => setShowTeamManagement(true)}
            setShowBusinessQR={setShowBusinessQR}
            setShowAIChat={setShowAIChat}
            setShowAddBusinessLoan={setShowAddBusinessLoan}
            getCurrentSectionData={getCurrentSectionData}
            refreshBusinessBalances={refreshBusinessBalances}
            businessRefreshKey={businessRefreshKey}
          />
        );

      case "groups":
        return (
          <GroupsScreen
            userGroups={userGroups}
            handleGroupClick={handleGroupClick}
            handleJoinGroup={handleJoinGroup}
            onOpenGroupTransactionsModal={handleOpenGroupTransactionsModal}
            loading={groupsLoading}
            error={groupsError}
          />
        );

      case "analytics":
        return (
          <AnalyticsScreen
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            chartData={chartData}
            sectionInfo={sectionInfo}
            currentSection={currentSection}
          />
        );

      case "chat":
        return (
          <AIChatScreen 
            currentSection={currentSection}
            sectionInfo={sectionInfo}
            businessData={businessSections.find(b => b.id === currentSection)}
          />
        )

      default:
        return null;
    }
  };

  // Ensure handleOpenGroupTransactionsModal is defined before use
  const handleOpenGroupTransactionsModal = (groupId: string) => {
    setSelectedGroupId(groupId);
    setShowGroupTransactionsModal(true);
  };

  // Listen for messages from service worker (for notification clicks)
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      console.log("📱 Received message from service worker:", event.data);

      if (event.data.type === "NAVIGATE_TO_LOAN") {
        const { loanId, action } = event.data;

        if (loanId) {
          console.log("🔗 Navigating to loan:", loanId, "with action:", action);

          // Set the active screen to home if not already there
          setActiveScreen("home");

          // If it's a "pay" action, we might want to trigger the payment modal
          if (action === "pay") {
            // You can add logic here to automatically open the payment modal
            console.log("💳 Auto-opening payment flow for loan:", loanId);
            // Example: setSelectedLoanForPayment(loanId);
          }

          // Store the loan ID in localStorage or state to highlight it
          if (typeof window !== "undefined") {
            localStorage.setItem("highlightLoanId", loanId);
            // Clear it after a short delay
            setTimeout(() => {
              localStorage.removeItem("highlightLoanId");
            }, 5000);
          }
        }
      }
    };

    if (
      typeof window !== "undefined" &&
      "navigator" in window &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.addEventListener(
        "message",
        handleServiceWorkerMessage
      );

      return () => {
        navigator.serviceWorker.removeEventListener(
          "message",
          handleServiceWorkerMessage
        );
      };
    }
  }, []);

  // Check for loan query parameter on app load (from notifications)
  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated) {
      const urlParams = new URLSearchParams(window.location.search);
      const loanId = urlParams.get("loan");
      const action = urlParams.get("action");

      if (loanId) {
        console.log(
          "🔗 Detected loan ID from URL:",
          loanId,
          "with action:",
          action
        );

        // Set the active screen to home
        setActiveScreen("home");

        // Store the loan ID for highlighting
        localStorage.setItem("highlightLoanId", loanId);

        // If there's an action parameter, store it too
        if (action) {
          localStorage.setItem("loanAction", action);
        }

        // Clean up the URL (remove query parameters)
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        // Clear the highlight after 5 seconds
        setTimeout(() => {
          localStorage.removeItem("highlightLoanId");
          localStorage.removeItem("loanAction");
        }, 5000);
      }
    }
  }, [isAuthenticated]);
  // Refresh business balances function
  const refreshBusinessBalances = async () => {
    try {
      const updatedBusinesses = await Promise.all(
        businessSections.map(async (business: any) => {
          let balance = "रु0.00";
          try {
            const total = await BusinessService.getBusinessTotalAmount(business.id);
            balance = `रु${total.toLocaleString()}`;
          } catch (error) {
            console.error(`Error loading balance for business ${business.id}:`, error);
          }
          return { ...business, balance };
        })
      );
      setBusinessSections(updatedBusinesses);
    } catch (error) {
      console.error("Error refreshing business balances:", error);
    }
  };

  if (currentScreen === "splash") {
    return <SplashScreen />;
  }

  if (currentScreen === "auth" && !isAuthenticated) {
    return <SignInPage />;
  }

  if (currentScreen === "qr-upload") {
    return (
      <QRUploadScreen
        onComplete={handleQRUploadComplete}
        onBack={handleQRUploadBack}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#eaf6ff" }}>
      {/* Mobile Container */}
      <div
        className="max-w-sm mx-auto min-h-screen relative overflow-hidden"
        style={{ background: "#eaf6ff" }}
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full blur-2xl"></div>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-6 relative z-10">
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
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
              ) : unreadNotifications > 0 ? (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
              ) : null}
            </Button>
            <Avatar
              className="h-12 w-12 ring-2 ring-white/50 shadow-lg cursor-pointer hover:ring-emerald-300 transition-all"
              onClick={handleProfileClick}
            >
              <AvatarImage
                src={
                  typeof window !== "undefined"
                    ? localStorage.getItem("userAvatar") || "/placeholder.svg"
                    : "/placeholder.svg"
                }
              />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold">
                {typeof window !== "undefined"
                  ? (localStorage.getItem("userName") || "U").charAt(0)
                  : "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Content */}
        {activeScreen === "groups" ? (
          <GroupsScreen
            userGroups={userGroups}
            handleGroupClick={handleGroupClick}
            handleJoinGroup={handleJoinGroup}
            onOpenGroupTransactionsModal={handleOpenGroupTransactionsModal}
            loading={groupsLoading}
            error={groupsError}
          />
        ) : (
          renderContent()
        )}

        {/* Bottom Navigation */}
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white/70 backdrop-blur-md border-t border-white/30 px-6 py-4 z-50 rounded-4xl shadow-lg shadow-slate-300/50${
          showSendModal || showReceiveModal || showProfileModal || showGroupModal || showGroupDetails || showTransactionDetail || showNotifications || showBusinessContacts || showBusinessQR || showGroupTransactionsModal || showAIChat || showTeamManagement || showAddBusinessLoan ? ' opacity-60 pointer-events-none backdrop-blur-lg' : ''
        }`} style={{ boxShadow: '0 -6px 24px -4px rgba(30, 41, 59, 0.12)' }}>
          <div className="flex items-center justify-between">
            {/* Home */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveScreen("home")}
              className={`rounded-2xl transition-all duration-300 ${
                activeScreen === "home"
                  ? "text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              style={activeScreen === "home" ? { background: "#035fa5" } : {}}
            >
              <Home
                className={`h-6 w-6 ${
                  activeScreen === "home" ? "text-white" : "text-slate-600"
                }`}
              />
            </Button>

            {/* Groups */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveScreen("groups")}
              className={`rounded-2xl transition-all duration-300 ${
                activeScreen === "groups"
                  ? "text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              style={activeScreen === "groups" ? { background: "#035fa5" } : {}}
            >
              <User
                className={`h-6 w-6 ${
                  activeScreen === "groups" ? "text-white" : "text-slate-600"
                }`}
              />
            </Button>

            {/* Analytics */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveScreen("analytics")}
              className={`rounded-2xl transition-all duration-300 ${
                activeScreen === "analytics"
                  ? "text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              style={
                activeScreen === "analytics" ? { background: "#035fa5" } : {}
              }
            >
              <BarChart3
                className={`h-6 w-6 ${
                  activeScreen === "analytics" ? "text-white" : "text-slate-600"
                }`}
              />
            </Button>

            {/* AI Chat */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveScreen("chat")}
              className={`rounded-2xl transition-all duration-300 ${
                activeScreen === "chat"
                  ? "text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              style={activeScreen === "chat" ? { background: "#035fa5" } : {}}
            >
              <MessageCircle
                className={`h-6 w-6 ${
                  activeScreen === "chat" ? "text-white" : "text-slate-600"
                }`}
              />
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
      </div>

      {/* Modals - Centered for mobile */}
      {showSendModal && <SendModal onClose={handleCloseSendModal} />}
      {showReceiveModal && <ReceiveModal onClose={handleCloseReceiveModal} />}
      {showProfileModal && <ProfileModal onClose={handleCloseProfileModal} />}
      {showGroupModal && (
        <GroupModal
          onClose={handleCloseGroupModal}
          onJoinGroup={handleJoinGroup}
          onCreateGroup={handleCreateGroup}
        />
      )}
      {showGroupDetails && selectedGroup && (
        <GroupDetailsModal
          group={selectedGroup}
          onClose={() => setShowGroupDetails(false)}
        />
      )}
      {showTransactionDetail && selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setShowTransactionDetail(false)}
        />
      )}
      {showNotifications && (
        <NotificationModal
          onClose={() => setShowNotifications(false)}
          token={
            typeof window !== "undefined"
              ? localStorage.getItem("token") || ""
              : ""
          }
          onUnreadCountChange={setUnreadNotifications}
        />
      )}
      {showBusinessContacts && (
        <BusinessContactsModal
          onClose={() => setShowBusinessContacts(false)}
          businessName={getCurrentSectionData().name}
        />
      )}
      {showBusinessQR && currentSection !== "personal" && (
        <BusinessQRModal
          onClose={() => setShowBusinessQR(false)}
          businessName={getCurrentSectionData().name}
          businessCode={getCurrentSectionData().businessCode || "BIZ123456"}
        />
      )}
      {showGroupTransactionsModal && selectedGroupId && (
        <GroupTransactionsModal
          groupId={selectedGroupId}
          onClose={() => setShowGroupTransactionsModal(false)}
        />
      )}
      
      {/* New Business Modals */}
      {showAIChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-full max-w-md mx-auto max-h-[90vh] relative">
            <AIChatScreen />
            <Button 
              onClick={() => setShowAIChat(false)}
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white rounded-full"
              size="icon"
            >
              ×
            </Button>
          </div>
        </div>
      )}
      
      {showTeamManagement && currentSection !== "personal" && (
        <TeamManagementModal
          onClose={() => setShowTeamManagement(false)}
          businessId={currentSection}
          businessName={getCurrentSectionData().name}
          isOwner={getCurrentSectionData().isOwner || false}
        />
      )}
      
      {showAddBusinessLoan && currentSection !== "personal" && (
        <AddBusinessLoanModal
          onClose={() => setShowAddBusinessLoan(false)}
          businessId={currentSection}
          businessName={getCurrentSectionData().name}
          onLoanAdded={(loan) => {
            // Refresh business balances after adding loan
            refreshBusinessBalances()
            // Trigger refresh of business components
            setBusinessRefreshKey(prev => prev + 1)
            setShowAddBusinessLoan(false)
          }}
        />
      )}
    </div>
  );
}



