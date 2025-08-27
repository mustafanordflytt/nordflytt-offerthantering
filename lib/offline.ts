interface NetworkStatus {
  online: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface CacheConfig {
  cacheName: string;
  version: string;
  staticAssets: string[];
  apiCacheConfig: {
    [endpoint: string]: {
      ttl: number; // Time to live in milliseconds
      strategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate';
    };
  };
}

interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export class OfflineService {
  private static instance: OfflineService;
  private networkStatus: NetworkStatus = { online: navigator.onLine };
  private offlineQueue: OfflineAction[] = [];
  private syncInProgress = false;
  private listeners: Array<(status: NetworkStatus) => void> = [];

  private config: CacheConfig = {
    cacheName: 'nordflytt-staff-v1',
    version: '1.0.0',
    staticAssets: [
      '/',
      '/staff',
      '/manifest.json',
      '/static/css/main.css',
      '/static/js/main.js'
    ],
    apiCacheConfig: {
      '/api/staff/jobs': {
        ttl: 5 * 60 * 1000, // 5 minutes
        strategy: 'networkFirst'
      },
      '/api/staff/profile': {
        ttl: 30 * 60 * 1000, // 30 minutes
        strategy: 'cacheFirst'
      },
      '/api/staff/checkin': {
        ttl: 0, // No cache
        strategy: 'networkFirst'
      }
    }
  };

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  constructor() {
    this.initializeNetworkMonitoring();
    this.loadOfflineQueue();
    this.initializeServiceWorker();
  }

  private initializeNetworkMonitoring(): void {
    // Basic online/offline detection
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Enhanced network information if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.updateNetworkStatus();
      
      connection.addEventListener('change', this.updateNetworkStatus.bind(this));
    }
  }

  private updateNetworkStatus(): void {
    const connection = (navigator as any).connection;
    
    this.networkStatus = {
      online: navigator.onLine,
      connectionType: connection?.type,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt
    };

    this.notifyListeners();
  }

  private handleOnline(): void {
    this.networkStatus.online = true;
    this.notifyListeners();
    this.processPendingActions();
  }

  private handleOffline(): void {
    this.networkStatus.online = false;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.networkStatus));
  }

  addNetworkListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrerad:', registration);

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

      } catch (error) {
        console.error('Service Worker registrering misslyckades:', error);
      }
    }
  }

  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache uppdaterad:', data.payload);
        break;
      case 'BACKGROUND_SYNC':
        console.log('Background sync aktiverad:', data.payload);
        break;
    }
  }

  async cacheRequest(request: Request, response: Response): Promise<void> {
    const cache = await caches.open(this.config.cacheName);
    await cache.put(request, response.clone());
  }

  async getCachedResponse(request: Request): Promise<Response | null> {
    const cache = await caches.open(this.config.cacheName);
    return await cache.match(request);
  }

  async fetchWithCache(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const request = new Request(url, options);
    const cacheConfig = this.getCacheConfigForUrl(url);

    if (!cacheConfig) {
      return fetch(request);
    }

    switch (cacheConfig.strategy) {
      case 'cacheFirst':
        return this.cacheFirstStrategy(request, cacheConfig);
      case 'networkFirst':
        return this.networkFirstStrategy(request, cacheConfig);
      case 'staleWhileRevalidate':
        return this.staleWhileRevalidateStrategy(request, cacheConfig);
      default:
        return fetch(request);
    }
  }

  private getCacheConfigForUrl(url: string) {
    const pathname = new URL(url, window.location.origin).pathname;
    return this.config.apiCacheConfig[pathname];
  }

  private async cacheFirstStrategy(
    request: Request, 
    config: any
  ): Promise<Response> {
    const cachedResponse = await this.getCachedResponse(request);
    
    if (cachedResponse && this.isCacheValid(cachedResponse, config.ttl)) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await this.cacheRequest(request, networkResponse);
      }
      return networkResponse;
    } catch (error) {
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }

  private async networkFirstStrategy(
    request: Request, 
    config: any
  ): Promise<Response> {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok && config.ttl > 0) {
        await this.cacheRequest(request, networkResponse);
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await this.getCachedResponse(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }

  private async staleWhileRevalidateStrategy(
    request: Request, 
    config: any
  ): Promise<Response> {
    const cachedResponse = await this.getCachedResponse(request);
    
    // Fetch in background
    const networkPromise = fetch(request).then(async (response) => {
      if (response.ok) {
        await this.cacheRequest(request, response);
      }
      return response;
    }).catch(() => null);

    // Return cached response immediately if available
    if (cachedResponse) {
      return cachedResponse;
    }

    // Wait for network if no cache
    return networkPromise || fetch(request);
  }

  private isCacheValid(response: Response, ttl: number): boolean {
    if (ttl === 0) return false;
    
    const dateHeader = response.headers.get('date');
    if (!dateHeader) return false;

    const cacheDate = new Date(dateHeader);
    const now = new Date();
    return (now.getTime() - cacheDate.getTime()) < ttl;
  }

  addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): void {
    const offlineAction: OfflineAction = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0
    };

    this.offlineQueue.push(offlineAction);
    this.saveOfflineQueue();

    // Try to process immediately if online
    if (this.networkStatus.online) {
      this.processPendingActions();
    }
  }

  private async processPendingActions(): Promise<void> {
    if (this.syncInProgress || this.offlineQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      const actionsToProcess = [...this.offlineQueue];
      
      for (const action of actionsToProcess) {
        try {
          await this.processAction(action);
          this.removeFromQueue(action.id);
        } catch (error) {
          action.retryCount++;
          
          if (action.retryCount >= action.maxRetries) {
            console.error(`Action ${action.id} failed permanently:`, error);
            this.removeFromQueue(action.id);
          } else {
            console.warn(`Action ${action.id} failed, will retry:`, error);
          }
        }
      }
      
      this.saveOfflineQueue();
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'checkin':
        return this.processCheckinAction(action);
      case 'checkout':
        return this.processCheckoutAction(action);
      case 'status_update':
        return this.processStatusUpdateAction(action);
      case 'image_upload':
        return this.processImageUploadAction(action);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async processCheckinAction(action: OfflineAction): Promise<void> {
    const response = await fetch('/api/staff/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action.data)
    });

    if (!response.ok) {
      throw new Error(`Checkin failed: ${response.status}`);
    }
  }

  private async processCheckoutAction(action: OfflineAction): Promise<void> {
    const response = await fetch('/api/staff/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action.data)
    });

    if (!response.ok) {
      throw new Error(`Checkout failed: ${response.status}`);
    }
  }

  private async processStatusUpdateAction(action: OfflineAction): Promise<void> {
    const response = await fetch(`/api/staff/jobs/${action.data.jobId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: action.data.status })
    });

    if (!response.ok) {
      throw new Error(`Status update failed: ${response.status}`);
    }
  }

  private async processImageUploadAction(action: OfflineAction): Promise<void> {
    const formData = new FormData();
    
    action.data.images.forEach((imageData: any, index: number) => {
      formData.append(`image_${index}`, imageData.file);
      formData.append(`description_${index}`, imageData.description || '');
      formData.append(`category_${index}`, imageData.category || '');
    });
    
    formData.append('jobId', action.data.jobId);

    const response = await fetch('/api/staff/images/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Image upload failed: ${response.status}`);
    }
  }

  private removeFromQueue(actionId: string): void {
    this.offlineQueue = this.offlineQueue.filter(action => action.id !== actionId);
  }

  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('nordflytt_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private loadOfflineQueue(): void {
    try {
      const saved = localStorage.getItem('nordflytt_offline_queue');
      if (saved) {
        this.offlineQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  getPendingActionsCount(): number {
    return this.offlineQueue.length;
  }

  getPendingActions(): OfflineAction[] {
    return [...this.offlineQueue];
  }

  clearOfflineQueue(): void {
    this.offlineQueue = [];
    this.saveOfflineQueue();
  }

  async clearCache(): Promise<void> {
    const cache = await caches.open(this.config.cacheName);
    const keys = await cache.keys();
    await Promise.all(keys.map(key => cache.delete(key)));
  }

  getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
    if (!this.networkStatus.online) return 'offline';
    
    const { effectiveType, rtt, downlink } = this.networkStatus;
    
    if (effectiveType === '4g' && (rtt || 0) < 100 && (downlink || 0) > 10) {
      return 'excellent';
    } else if (effectiveType === '3g' || ((rtt || 0) < 300 && (downlink || 0) > 1)) {
      return 'good';
    } else {
      return 'poor';
    }
  }

  shouldUseOfflineMode(): boolean {
    const quality = this.getConnectionQuality();
    return quality === 'offline' || quality === 'poor';
  }
}

export const offlineService = OfflineService.getInstance();

export type { NetworkStatus, OfflineAction };