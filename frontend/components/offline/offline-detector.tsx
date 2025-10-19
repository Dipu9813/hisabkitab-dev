"use client";

import { useEffect, useState } from 'react';
import { useNetworkStatus } from '@/lib/offline/network';
import OfflineApp from './offline-app';
import NetworkStatusNotification from './network-status-notification';
//detects offline mode
interface OfflineDetectorProps {
  children: React.ReactNode;
}

export default function OfflineDetector({ children }: OfflineDetectorProps) {
  const { isOnline } = useNetworkStatus();
  const [showOfflineMode, setShowOfflineMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setShowOfflineMode(!isOnline);
    }
  }, [isOnline, mounted]);

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>;
  }

  if (showOfflineMode) {
    return <OfflineApp />;
  }

  return (
    <>
      <NetworkStatusNotification />
      {children}
    </>
  );
}
