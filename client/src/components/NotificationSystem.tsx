"use client";
import { useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';

interface Notification {
  id: string;
  type: 'loan_request' | 'loan_approved' | 'deadline_approaching' | 'deadline_passed';
  message: string;
  read: boolean;
  timestamp: string;
  loanId?: string;
}

export default function NotificationSystem({ token }: { token: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  console.log('NotificationSystem rendering with token:', token ? 'token exists' : 'no token');
  
  // Safety check - if no token is provided
  if (!token) {
    console.error('NotificationSystem: No token provided');
    return null;
  }
  
  // Get user ID from token
  let currentUserId = "";
  try {
    currentUserId = jwtDecode<{ sub: string }>(token).sub;
  } catch {}
  // Fetch loans and generate notifications
  const generateNotifications = async () => {
    try {
      // Fetch loans
      const res = await fetch("http://localhost:3000/loans", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!res.ok) {
        console.error(`Error fetching loans: ${res.status} ${res.statusText}`);
        return;
      }
      
      // Check content type to avoid parsing HTML as JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`Expected JSON but got ${contentType}`);
        return;
      }
      
      const responseData = await res.json();
      if (!responseData.data) {
        console.error('Unexpected response format:', responseData);
        return;
      }
      
      const { data: loans } = responseData;
      const newNotifications: Notification[] = [];
      
      // Get existing notifications from localStorage
      const storedNotifications = localStorage.getItem(`notifications_${currentUserId}`);
      const existingNotifications: Notification[] = storedNotifications 
        ? JSON.parse(storedNotifications) 
        : [];
      
      const now = new Date();
      
      // Process each loan to generate appropriate notifications
      loans.forEach((loan: any) => {
        // For receiver: New loan requests
        if (loan.receiver_id === currentUserId && loan.status === 'pending') {
          // Check if we already have this notification
          const existingNotif = existingNotifications.find(
            n => n.type === 'loan_request' && n.loanId === loan.id
          );
          
          if (!existingNotif) {
            newNotifications.push({
              id: `loan_request_${loan.id}`,
              type: 'loan_request',
              message: `You have a new loan request of $${loan.amount} to approve`,
              read: false,
              timestamp: now.toISOString(),
              loanId: loan.id
            });
          }
        }
        
        // For lender: Loan approved notifications
        if (loan.lender_id === currentUserId && loan.status === 'confirmed') {
          // Check if the loan was recently confirmed (in the last 24 hours)
          const confirmDate = new Date(loan.updated_at || loan.created_at);
          const hoursSinceConfirm = (now.getTime() - confirmDate.getTime()) / (1000 * 60 * 60);
          
          // Only show notification for recently confirmed loans
          if (hoursSinceConfirm <= 24) {
            const existingNotif = existingNotifications.find(
              n => n.type === 'loan_approved' && n.loanId === loan.id
            );
            
            if (!existingNotif) {
              newNotifications.push({
                id: `loan_approved_${loan.id}`,
                type: 'loan_approved',
                message: `Your loan of $${loan.amount} has been approved`,
                read: false,
                timestamp: now.toISOString(),
                loanId: loan.id
              });
            }
          }
        }
        
        // For both: Approaching deadlines (3 days before)
        if (loan.status === 'confirmed' && loan.deadline) {
          const deadline = new Date(loan.deadline);
          const daysToDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          
          // Approaching deadline (between 3 and 2 days)
          if (daysToDeadline > 0 && daysToDeadline <= 3) {
            const notifId = `deadline_approaching_${loan.id}`;
            const existingNotif = existingNotifications.find(n => n.id === notifId);
            
            if (!existingNotif) {
              const userRole = loan.lender_id === currentUserId ? 'lender' : 'receiver';
              newNotifications.push({
                id: notifId,
                type: 'deadline_approaching',
                message: userRole === 'lender' 
                  ? `Your loan of $${loan.amount} is due in ${Math.ceil(daysToDeadline)} days`
                  : `You need to repay $${loan.amount} in ${Math.ceil(daysToDeadline)} days`,
                read: false,
                timestamp: now.toISOString(),
                loanId: loan.id
              });
            }
          }
          
          // Passed deadline
          if (daysToDeadline < 0) {
            const notifId = `deadline_passed_${loan.id}`;
            const existingNotif = existingNotifications.find(n => n.id === notifId);
            
            if (!existingNotif) {
              const userRole = loan.lender_id === currentUserId ? 'lender' : 'receiver';
              newNotifications.push({
                id: notifId,
                type: 'deadline_passed',
                message: userRole === 'lender' 
                  ? `Your loan of $${loan.amount} is overdue by ${Math.abs(Math.floor(daysToDeadline))} days`
                  : `Your payment of $${loan.amount} is overdue by ${Math.abs(Math.floor(daysToDeadline))} days`,
                read: false,
                timestamp: now.toISOString(),
                loanId: loan.id
              });
            }
          }
        }
      });
      
      // Merge and save notifications
      const mergedNotifications = [...newNotifications, ...existingNotifications]
        // Sort by timestamp (newest first)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        // Limit to the most recent 50 notifications
        .slice(0, 50);
      
      setNotifications(mergedNotifications);
      localStorage.setItem(`notifications_${currentUserId}`, JSON.stringify(mergedNotifications));
      
      // Update unread count
      setUnreadCount(mergedNotifications.filter(n => !n.read).length);
      
    } catch (err) {
      console.error("Error generating notifications:", err);
    }
  };

  // Fetch notifications on component mount and every 2 minutes
  useEffect(() => {
    generateNotifications();
    
    // Set interval to check for new notifications
    const interval = setInterval(() => {
      generateNotifications();
    }, 2 * 60 * 1000); // Every 2 minutes
    
    return () => clearInterval(interval);
  }, [token]);
  
  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Mark notification as read
  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    
    setNotifications(updatedNotifications);
    localStorage.setItem(`notifications_${currentUserId}`, JSON.stringify(updatedNotifications));
    setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    
    // Dispatch custom event to refresh loan data
    window.dispatchEvent(new Event('notificationInteraction'));
    
    // Also update localStorage to trigger the storage event for cross-component communication
    const storageKey = `notifications_${currentUserId}_lastInteraction`;
    localStorage.setItem(storageKey, new Date().toISOString());
  };
  
  // Mark all as read
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
    setNotifications(updatedNotifications);
    localStorage.setItem(`notifications_${currentUserId}`, JSON.stringify(updatedNotifications));
    setUnreadCount(0);
  };

  // Format timestamp to relative time (e.g., "2 hours ago")
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // diff in seconds
    
    if (diff < 60) return "just now";
    else if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    else if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    else if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    else return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 bg-white text-blue-600 hover:bg-blue-50 shadow-sm border border-blue-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
          {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 max-h-[80vh] overflow-y-auto">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="py-4 px-3 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-3 transition duration-150 ease-in-out hover:bg-gray-50 ${
                    notification.read ? 'bg-white' : 'bg-blue-50'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      {/* Icon based on notification type */}
                      <div className={`mt-1 mr-3 rounded-full p-2 ${
                        notification.type === 'loan_request' ? 'bg-blue-100 text-blue-500' :
                        notification.type === 'loan_approved' ? 'bg-green-100 text-green-500' :
                        notification.type === 'deadline_approaching' ? 'bg-yellow-100 text-yellow-500' :
                        'bg-red-100 text-red-500'
                      }`}>
                        {notification.type === 'loan_request' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        )}
                        {notification.type === 'loan_approved' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {notification.type === 'deadline_approaching' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {notification.type === 'deadline_passed' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-800 font-medium">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    {!notification.read && (
                      <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
