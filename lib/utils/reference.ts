/**
 * Genererar en unik bokningsreferens baserad på timestamp och slumptal
 * Format: [timestamp][3-siffrigt slumptal]
 * @returns {string} Unik bokningsreferens
 */
export function generateBookingReference(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return timestamp.toString() + random;
} 