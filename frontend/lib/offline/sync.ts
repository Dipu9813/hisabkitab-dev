// Utility functions for offline/online state management
export interface SyncQueueItem {
  id: string;
  type: 'create_group' | 'add_expense' | 'delete_group' | 'delete_expense';
  data: unknown;
  timestamp: string;
  retryCount: number;
}

export class OfflineSync {
  private static instance: OfflineSync;
  private syncQueue: SyncQueueItem[] = [];
  private isOnline: boolean = true;
  private readonly STORAGE_KEY = 'hisabkitab_sync_queue';
  private readonly MAX_RETRIES = 3;

  private constructor() {
    this.loadSyncQueue();
    this.setupNetworkListeners();
  }

  static getInstance(): OfflineSync {
    if (!OfflineSync.instance) {
      OfflineSync.instance = new OfflineSync();
    }
    return OfflineSync.instance;
  }

  private loadSyncQueue() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      this.syncQueue = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  private saveSyncQueue() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      this.isOnline = true;
      this.processSyncQueue();
    };

    const handleOffline = () => {
      this.isOnline = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial state
    this.isOnline = navigator.onLine;
  }

  addToSyncQueue(type: SyncQueueItem['type'], data: unknown): string {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const item: SyncQueueItem = {
      id,
      type,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    this.syncQueue.push(item);
    this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return id;
  }

  private async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const items = [...this.syncQueue];
    
    for (const item of items) {
      try {
        const success = await this.syncItem(item);
        if (success) {
          this.removeSyncItem(item.id);
        } else {
          this.incrementRetryCount(item.id);
        }
      } catch (error) {
        console.error('Error syncing item:', error);
        this.incrementRetryCount(item.id);
      }
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<boolean> {
    // This is where you would implement actual API calls to sync data
    // For now, we'll just simulate success
    console.log('Syncing item:', item);
    
    // Simulate API call
    try {
      switch (item.type) {
        case 'create_group':
          // Call API to create group on server
          console.log('Would sync group creation:', item.data);
          break;
        case 'add_expense':
          // Call API to add expense on server
          console.log('Would sync expense addition:', item.data);
          break;
        case 'delete_group':
          // Call API to delete group on server
          console.log('Would sync group deletion:', item.data);
          break;
        case 'delete_expense':
          // Call API to delete expense on server
          console.log('Would sync expense deletion:', item.data);
          break;
      }
      
      return true; // Simulate success
    } catch (error) {
      console.error('Sync failed for item:', item, error);
      return false;
    }
  }

  private removeSyncItem(id: string) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
    this.saveSyncQueue();
  }

  private incrementRetryCount(id: string) {
    const item = this.syncQueue.find(item => item.id === id);
    if (item) {
      item.retryCount++;
      if (item.retryCount >= this.MAX_RETRIES) {
        console.warn('Max retries reached for sync item, removing:', item);
        this.removeSyncItem(id);
      } else {
        this.saveSyncQueue();
      }
    }
  }

  getSyncQueueLength(): number {
    return this.syncQueue.length;
  }

  clearSyncQueue() {
    this.syncQueue = [];
    this.saveSyncQueue();
  }

  getSyncQueue(): SyncQueueItem[] {
    return [...this.syncQueue];
  }
}

// Export utility functions
export function queueForSync(type: SyncQueueItem['type'], data: unknown): string {
  return OfflineSync.getInstance().addToSyncQueue(type, data);
}

export function getSyncStatus() {
  const sync = OfflineSync.getInstance();
  return {
    queueLength: sync.getSyncQueueLength(),
    pendingItems: sync.getSyncQueue()
  };
}

