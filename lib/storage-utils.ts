// Storage utilities with quota management
// Safe for SSR - includes browser checks
export class StorageManager {
  private static readonly MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB safe limit (of 5MB total)
  
  static setItem(key: string, value: string): boolean {
    if (typeof window === 'undefined') {
      return false; // No storage available during SSR
    }
    
    try {
      // Check storage size before setting
      const estimatedSize = new Blob([value]).size;
      const currentUsage = this.getStorageUsage();
      
      if (currentUsage + estimatedSize > this.MAX_STORAGE_SIZE) {
        console.warn('Storage quota approaching limit, cleaning old data...');
        this.cleanOldData(key);
      }
      
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded, attempting cleanup...');
        this.emergencyCleanup(key, value);
        return false;
      }
      console.error('Storage error:', error);
      return false;
    }
  }
  
  static getItem(key: string): string | null {
    if (typeof window === 'undefined') {
      return null; // No storage available during SSR
    }
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Storage read error:', error);
      return null;
    }
  }
  
  static getStorageUsage(): number {
    if (typeof window === 'undefined') {
      return 0; // No storage during SSR
    }
    
    let totalSize = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += new Blob([localStorage[key]]).size;
        }
      }
    } catch (error) {
      console.error('Error calculating storage usage:', error);
    }
    return totalSize;
  }
  
  static cleanOldData(currentKey: string): void {
    if (typeof window === 'undefined') {
      return; // No storage during SSR
    }
    
    try {
      // Clean old photos (keep only last 20)
      if (currentKey === 'staff_photos') {
        const photos = JSON.parse(localStorage.getItem('staff_photos') || '[]');
        if (photos.length > 20) {
          // Sort by timestamp and keep newest 20
          const sortedPhotos = photos.sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          const trimmedPhotos = sortedPhotos.slice(0, 20);
          localStorage.setItem('staff_photos', JSON.stringify(trimmedPhotos));
          console.log(`Cleaned photos: ${photos.length} -> ${trimmedPhotos.length}`);
        }
      }
      
      // Clean old notifications (keep only last 10)
      const notifications = localStorage.getItem('triggered_notifications');
      if (notifications) {
        const notificationList = JSON.parse(notifications);
        if (notificationList.length > 10) {
          const trimmedNotifications = notificationList.slice(-10);
          localStorage.setItem('triggered_notifications', JSON.stringify(trimmedNotifications));
        }
      }
      
      // Clean old time tracking data
      for (let key in localStorage) {
        if (key.startsWith('time_tracking_') && localStorage.hasOwnProperty(key)) {
          const data = JSON.parse(localStorage[key] || '{}');
          if (data.startTime && Date.now() - new Date(data.startTime).getTime() > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key); // Remove tracking data older than 7 days
          }
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
  
  static emergencyCleanup(key: string, value: string): boolean {
    if (typeof window === 'undefined') {
      return false; // No storage during SSR
    }
    
    try {
      console.warn('Emergency storage cleanup initiated');
      
      // Remove old cached data
      const itemsToRemove = ['cached_distance_results', 'old_form_data', 'temp_data'];
      itemsToRemove.forEach(item => {
        if (localStorage.getItem(item)) {
          localStorage.removeItem(item);
          console.log(`Removed ${item} from storage`);
        }
      });
      
      // Aggressively clean photos (keep only last 10)
      const photos = JSON.parse(localStorage.getItem('staff_photos') || '[]');
      if (photos.length > 10) {
        const trimmedPhotos = photos.slice(-10);
        localStorage.setItem('staff_photos', JSON.stringify(trimmedPhotos));
        console.log(`Emergency photo cleanup: ${photos.length} -> ${trimmedPhotos.length}`);
      }
      
      // Try to set the item again
      localStorage.setItem(key, value);
      console.log('Emergency cleanup successful');
      return true;
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
      // Fallback: Use sessionStorage temporarily
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(key, value);
          console.warn('Falling back to sessionStorage');
          return false; // Indicate localStorage failed but data is saved temporarily
        } catch (sessionError) {
          console.error('Both localStorage and sessionStorage failed:', sessionError);
          return false;
        }
      }
      return false;
    }
  }
  
  static getStorageReport(): object {
    if (typeof window === 'undefined') {
      return {
        currentUsage: '0 KB',
        maxSize: `${(this.MAX_STORAGE_SIZE / 1024).toFixed(1)} KB`,
        percentage: '0%',
        photosCount: 0,
        available: true
      };
    }
    
    const usage = this.getStorageUsage();
    const percentage = (usage / this.MAX_STORAGE_SIZE) * 100;
    
    return {
      currentUsage: `${(usage / 1024).toFixed(1)} KB`,
      maxSize: `${(this.MAX_STORAGE_SIZE / 1024).toFixed(1)} KB`,
      percentage: `${percentage.toFixed(1)}%`,
      photosCount: JSON.parse(localStorage.getItem('staff_photos') || '[]').length,
      available: usage < this.MAX_STORAGE_SIZE
    };
  }
}

// Enhanced photo storage specifically for staff photos
export const photoStorage = {
  savePhoto: (photo: any): boolean => {
    const photos = JSON.parse(StorageManager.getItem('staff_photos') || '[]');
    photos.push(photo);
    return StorageManager.setItem('staff_photos', JSON.stringify(photos));
  },
  
  getPhotos: (serviceType?: string): any[] => {
    const photos = JSON.parse(StorageManager.getItem('staff_photos') || '[]');
    return serviceType ? photos.filter((p: any) => p.serviceType === serviceType) : photos;
  },
  
  getPhotoCount: (serviceType?: string): number => {
    return photoStorage.getPhotos(serviceType).length;
  },
  
  clearOldPhotos: (daysOld: number = 7): number => {
    const photos = JSON.parse(StorageManager.getItem('staff_photos') || '[]');
    const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    const recentPhotos = photos.filter((photo: any) => 
      new Date(photo.timestamp).getTime() > cutoffDate
    );
    
    StorageManager.setItem('staff_photos', JSON.stringify(recentPhotos));
    return photos.length - recentPhotos.length; // Return number of photos removed
  }
};