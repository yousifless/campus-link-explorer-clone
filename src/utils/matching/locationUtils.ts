import { Location } from '@/types/user';

/**
 * Calculates the distance between two points using the Haversine formula
 * @param point1 First location point
 * @param point2 Second location point
 * @returns Distance in kilometers
 */
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Converts degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates a location compatibility score based on distance
 * @param point1 First location point
 * @param point2 Second location point
 * @param maxDistance Maximum acceptable distance in kilometers (default: 10)
 * @returns A score between 0 and 1, where 1 indicates perfect match
 */
export function calculateLocationScore(
  point1: Location,
  point2: Location,
  maxDistance: number = 10
): number {
  const distance = calculateDistance(point1, point2);
  if (distance > maxDistance) return 0;
  
  // Linear scaling from 0 to maxDistance to 1 to 0
  return 1 - (distance / maxDistance);
}

/**
 * Checks if two locations are within an acceptable range
 * @param point1 First location point
 * @param point2 Second location point
 * @param maxDistance Maximum acceptable distance in kilometers (default: 10)
 * @returns boolean indicating if locations are within range
 */
export function areLocationsCompatible(
  point1: Location,
  point2: Location,
  maxDistance: number = 10
): boolean {
  const distance = calculateDistance(point1, point2);
  return distance <= maxDistance;
}

// Parse location string into coordinates
export function parseLocation(location: string): { latitude: number; longitude: number } | null {
  try {
    const [lat, lon] = location.split(',').map(Number);
    if (isNaN(lat) || isNaN(lon)) return null;
    return { latitude: lat, longitude: lon };
  } catch (error) {
    console.error('Error parsing location:', error);
    return null;
  }
} 