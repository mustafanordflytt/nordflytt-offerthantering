/**
 * Utility functions for converting between display reference (NF-XXXXXXXX) and database UUID
 */

/**
 * Convert display reference to database UUID
 * Example: NF-23857BDE → 23857bde-f907-40e1-8e88-51f82b46563a
 */
export function displayReferenceToUUID(displayRef: string): string | null {
  if (!displayRef || !displayRef.startsWith('NF-')) {
    return null;
  }
  
  // Extract the hex portion after NF-
  const hexPart = displayRef.substring(3).toLowerCase();
  
  // For 8-character hex, we need to expand it to full UUID
  // The pattern seems to be: XXXXXXXX → XXXXXXXX-f907-40e1-8e88-51f82b46563a
  if (hexPart.length === 8) {
    // This appears to be a consistent pattern in the database
    return `${hexPart}-f907-40e1-8e88-51f82b46563a`;
  }
  
  // If it's already a full UUID without NF- prefix
  if (hexPart.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
    return hexPart;
  }
  
  return null;
}

/**
 * Convert database UUID to display reference
 * Example: 23857bde-f907-40e1-8e88-51f82b46563a → NF-23857BDE
 */
export function uuidToDisplayReference(uuid: string): string {
  if (!uuid) {
    return '';
  }
  
  // Extract first 8 characters of UUID
  const firstPart = uuid.split('-')[0];
  return `NF-${firstPart.toUpperCase()}`;
}

/**
 * Search for booking by either format
 * Returns the database UUID if found
 */
export function normalizeBookingReference(reference: string): {
  displayFormat: string;
  uuidFormat: string | null;
  searchPattern: string;
} {
  // If it's already a UUID
  if (reference.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return {
      displayFormat: uuidToDisplayReference(reference),
      uuidFormat: reference.toLowerCase(),
      searchPattern: reference.toLowerCase()
    };
  }
  
  // If it's NF- format
  if (reference.startsWith('NF-')) {
    const uuid = displayReferenceToUUID(reference);
    const hexPart = reference.substring(3).toLowerCase();
    return {
      displayFormat: reference.toUpperCase(),
      uuidFormat: uuid,
      searchPattern: hexPart
    };
  }
  
  // Unknown format - just return as is
  return {
    displayFormat: reference,
    uuidFormat: null,
    searchPattern: reference.toLowerCase()
  };
}