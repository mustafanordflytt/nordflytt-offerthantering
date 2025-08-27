interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationPermissions {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

interface DistanceCheckResult {
  isWithinRange: boolean;
  distance: number;
  accuracy: number;
}

export class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private currentPosition: LocationData | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async checkPermissions(): Promise<LocationPermissions> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation stöds inte av denna enhet');
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return {
        granted: permission.state === 'granted',
        denied: permission.state === 'denied',
        prompt: permission.state === 'prompt'
      };
    } catch (error) {
      console.warn('Kunde inte kontrollera GPS-behörigheter:', error);
      return {
        granted: false,
        denied: false,
        prompt: true
      };
    }
  }

  async requestLocation(): Promise<LocationData> {
    const permissions = await this.checkPermissions();
    
    if (permissions.denied) {
      throw new Error('GPS-behörighet nekad. Aktivera platsdelning i inställningar.');
    }

    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          
          this.currentPosition = locationData;
          resolve(locationData);
        },
        (error) => {
          let errorMessage = 'Kunde inte hämta position';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'GPS-behörighet nekad av användaren';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position ej tillgänglig. Kontrollera GPS-inställningar.';
              break;
            case error.TIMEOUT:
              errorMessage = 'GPS-förfrågan tog för lång tid. Försök igen.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }

  startWatchingLocation(callback: (location: LocationData) => void): number {
    if (!navigator.geolocation) {
      throw new Error('Geolocation stöds inte av denna enhet');
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        
        this.currentPosition = locationData;
        callback(locationData);
      },
      (error) => {
        console.error('GPS-övervakning misslyckades:', error);
      },
      options
    );

    return this.watchId;
  }

  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Jordens radie i km
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * 
      Math.cos(this.degreesToRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Avstånd i km
    
    return distance * 1000; // Returnera i meter
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async verifyLocationForJob(
    jobLatitude: number,
    jobLongitude: number,
    allowedDistanceMeters: number = 100
  ): Promise<DistanceCheckResult> {
    try {
      const currentLocation = await this.requestLocation();
      
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        jobLatitude,
        jobLongitude
      );

      return {
        isWithinRange: distance <= allowedDistanceMeters,
        distance: Math.round(distance),
        accuracy: currentLocation.accuracy
      };
    } catch (error) {
      throw new Error(`Positionsverifiering misslyckades: ${error.message}`);
    }
  }

  getCurrentPosition(): LocationData | null {
    return this.currentPosition;
  }

  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY&language=sv&pretty=1`
      );
      
      if (!response.ok) {
        throw new Error('Kunde inte hämta adressinformation');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted;
      }
      
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.warn('Reverse geocoding misslyckades:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  isLocationStale(location: LocationData, maxAgeMinutes: number = 5): boolean {
    const now = Date.now();
    const ageMinutes = (now - location.timestamp) / (1000 * 60);
    return ageMinutes > maxAgeMinutes;
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${meters} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  }

  getAccuracyDescription(accuracy: number): string {
    if (accuracy <= 5) {
      return 'Mycket hög precision';
    } else if (accuracy <= 20) {
      return 'Hög precision';
    } else if (accuracy <= 100) {
      return 'Medel precision';
    } else {
      return 'Låg precision';
    }
  }

  async checkLocationForCheckin(
    jobId: string,
    jobLatitude: number,
    jobLongitude: number,
    allowedDistance: number = 100
  ): Promise<{
    success: boolean;
    message: string;
    location?: LocationData;
    distance?: number;
  }> {
    try {
      const result = await this.verifyLocationForJob(
        jobLatitude,
        jobLongitude,
        allowedDistance
      );

      if (result.isWithinRange) {
        return {
          success: true,
          message: `Incheckning godkänd! Du är ${this.formatDistance(result.distance)} från uppdragsadressen.`,
          location: this.currentPosition!,
          distance: result.distance
        };
      } else {
        return {
          success: false,
          message: `Du är för långt från uppdragsadressen (${this.formatDistance(result.distance)}). Du måste vara inom ${this.formatDistance(allowedDistance)}.`,
          location: this.currentPosition!,
          distance: result.distance
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Positionsverifiering misslyckades: ${error.message}`
      };
    }
  }
}

export const locationService = LocationService.getInstance();

export type { LocationData, LocationPermissions, DistanceCheckResult };