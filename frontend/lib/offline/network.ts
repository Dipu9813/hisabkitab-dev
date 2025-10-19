// Network detection utilities
import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Show notification that connection is restored
        console.log('Connection restored');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}

export function checkNetworkStatus(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

export async function pingServer(url: string = '/api/health'): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-cache',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private isOnline: boolean = true;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.setupListeners();
      this.startPeriodicCheck();
    }
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private setupListeners() {
    const handleOnline = () => this.updateStatus(true);
    const handleOffline = () => this.updateStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  private startPeriodicCheck() {
    this.checkInterval = setInterval(async () => {
      const serverReachable = await pingServer();
      if (this.isOnline !== serverReachable) {
        this.updateStatus(serverReachable);
      }
    }, 30000); // Check every 30 seconds
  }

  private updateStatus(isOnline: boolean) {
    if (this.isOnline !== isOnline) {
      this.isOnline = isOnline;
      this.listeners.forEach(listener => listener(isOnline));
    }
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  public subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.listeners.clear();
  }
}

