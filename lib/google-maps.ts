import { LoadScript, LoadScriptNext } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface DistanceResult {
  distance: number;  // Distance in kilometers
  duration: number;  // Duration in minutes
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'INVALID_REQUEST' | 'ERROR';
}

export async function calculateDistance(origin: string, destination: string): Promise<DistanceResult> {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is not configured');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        origin
      )}&destinations=${encodeURIComponent(
        destination
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Error calculating distance:', data);
      return {
        distance: 0,
        duration: 0,
        status: data.status
      };
    }

    const result = data.rows[0].elements[0];
    
    if (result.status !== 'OK') {
      return {
        distance: 0,
        duration: 0,
        status: result.status
      };
    }

    return {
      distance: result.distance.value / 1000, // Convert meters to kilometers
      duration: result.duration.value / 60,   // Convert seconds to minutes
      status: 'OK'
    };
  } catch (error) {
    console.error('Error calculating distance:', error);
    return {
      distance: 0,
      duration: 0,
      status: 'ERROR'
    };
  }
} 