"use client";
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export default function VisibleNotification({ token }: { token: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Get user ID from token
  let currentUserId = "";
  try {
    currentUserId = jwtDecode<{ sub: string }>(token).sub;
  } catch {}
    useEffect(() => {    // Check for any pending loan requests
    const checkNotifications = async () => {
      try {
        // Fetch loans
        const res = await fetch("http://localhost:3000/loans", {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" 
          },
        });
        
        if (!res.ok) {
          console.error(`Error fetching loans: ${res.status} ${res.statusText}`);
          
          // If it's a 401/403 error, the token might be invalid
          if (res.status === 401 || res.status === 403) {
            console.error('Authentication failed. Token might be invalid or expired.');
            // You might want to redirect to login here
            // window.location.href = '/login';
          }
          return;
        }
        
        // Check content type to avoid parsing HTML as JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error(`Expected JSON but got ${contentType}`);
          const textResponse = await res.text();
          console.error('Response body:', textResponse);
          return;
        }
        
        const responseData = await res.json();
        if (!responseData.data) {
          console.error('Unexpected response format:', responseData);
          return;
        }
        
        const { data: loans } = responseData;
        let newNotifications = [];
        
        // Simple notifications for pending loans
        const pendingLoans = loans.filter((loan: any) => 
          loan.receiver_id === currentUserId && loan.status === 'pending'
        );
        
        // Add pending loan notifications
        for (const loan of pendingLoans) {
          newNotifications.push({
            id: `pending_${loan.id}`,
            message: `You have a pending loan request of $${loan.amount}`,
            timestamp: new Date().toISOString()
          });
        }
        
        // Add deadline notifications
        const now = new Date();
        const confirmedLoans = loans.filter((loan: any) => loan.status === 'confirmed' && loan.deadline);
        
        for (const loan of confirmedLoans) {
          const deadline = new Date(loan.deadline);
          const daysToDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysToDeadline <= 3 && daysToDeadline > 0) {
            const userRole = loan.lender_id === currentUserId ? 'lender' : 'receiver';
            newNotifications.push({
              id: `deadline_${loan.id}`,
              message: userRole === 'lender' 
                ? `Your loan of $${loan.amount} is due in ${Math.ceil(daysToDeadline)} days`
                : `You need to repay $${loan.amount} in ${Math.ceil(daysToDeadline)} days`,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        setNotifications(newNotifications);
        setUnreadCount(newNotifications.length);
      } catch (err) {
        console.error("Failed to check notifications", err);
      }
    };
    
    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, [token, currentUserId]);
    return (
    <div className="relative inline-block">
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-full shadow-md transition-all duration-200 ease-in-out"
      >
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="font-medium">Notifications</span>
      </button>
        {showNotifications && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden transform transition-all duration-300 origin-top-right border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex justify-between items-center">
            <h3 className="font-semibold text-white text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-white text-blue-600 text-xs px-2 py-1 rounded-full font-bold">
                {unreadCount} New
              </span>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto bg-gray-50">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-gray-500 font-medium">Your notifications will appear here</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map(notification => (
                  <li key={notification.id} className="p-4 hover:bg-white transition-colors duration-150">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="bg-white p-3 border-t border-gray-100 flex justify-center">
              <button 
                onClick={() => {
                  setNotifications([]);
                  setUnreadCount(0);
                  setShowNotifications(false);
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-md transition-colors duration-150"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
