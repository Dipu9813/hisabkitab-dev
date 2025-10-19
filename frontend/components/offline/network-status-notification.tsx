"use client";

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { useNetworkStatus } from '@/lib/offline/network';

export default function NetworkStatusNotification() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'offline' | 'online'>('offline');
//check network status to use online or offline App
  useEffect(() => {
    if (!isOnline) {
      setNotificationType('offline');
      setShowNotification(true);
    } else if (wasOffline && isOnline) {
      setNotificationType('online');
      setShowNotification(true);
      // Auto-hide online notification after 5 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification) return null;

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm`}>
      <div className={`rounded-lg shadow-lg p-4 ${
        notificationType === 'offline' 
          ? 'bg-red-50 border border-red-200' 
          : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-full ${
            notificationType === 'offline' 
              ? 'bg-red-100' 
              : 'bg-green-100'
          }`}>
            {notificationType === 'offline' ? (
              <WifiOff className={`h-5 w-5 ${
                notificationType === 'offline' ? 'text-red-600' : 'text-green-600'
              }`} />
            ) : (
              <Wifi className="h-5 w-5 text-green-600" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className={`font-medium ${
              notificationType === 'offline' ? 'text-red-900' : 'text-green-900'
            }`}>
              {notificationType === 'offline' ? "You're Offline" : "Back Online"}
            </h3>
            <p className={`text-sm mt-1 ${
              notificationType === 'offline' ? 'text-red-700' : 'text-green-700'
            }`}>
              {notificationType === 'offline' 
                ? "You can still use HisabKitab offline. Data will sync when you're back online."
                : "Connection restored! Your offline data will sync automatically."
              }
            </p>
          </div>
          
          <button
            onClick={handleDismiss}
            className={`p-1 rounded-full hover:bg-opacity-20 ${
              notificationType === 'offline' 
                ? 'hover:bg-red-600 text-red-400' 
                : 'hover:bg-green-600 text-green-400'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

