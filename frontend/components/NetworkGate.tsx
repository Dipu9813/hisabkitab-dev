"use client";

import { useEffect, useState } from "react";
import OfflineApp from "@/components/offline/offline-app";

export default function NetworkGate({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    function updateStatus() {
      setIsOnline(navigator.onLine);
      setChecked(true);
    }
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    updateStatus();
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!checked) return null;
  if (!isOnline) return <OfflineApp />;
  return <>{children}</>;
}

