const OSRM_API_URL = "https://router.project-osrm.org/route/v1/driving/"

export async function calculateDistance(startAddress: string, endAddress: string): Promise<number | null> {
  try {
    // Convert addresses to coordinates (geocoding)
    const startCoords = await geocodeAddress(startAddress)
    const endCoords = await geocodeAddress(endAddress)

    if (!startCoords || !endCoords) {
      throw new Error("Invalid address")
    }

    // Calculate route using OSRM
    const response = await fetch(
      `${OSRM_API_URL}${startCoords.lon},${startCoords.lat};${endCoords.lon},${endCoords.lat}?overview=false`,
    )
    const data = await response.json()

    if (data.code !== "Ok") {
      throw new Error("Route calculation failed")
    }

    // Return distance in kilometers
    return data.routes[0].distance / 1000
  } catch (error) {
    console.error("Error calculating distance:", error)
    return null
  }
}

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
    )
    const data = await response.json()

    if (data.length === 0) {
      throw new Error("Address not found")
    }

    return {
      lat: Number.parseFloat(data[0].lat),
      lon: Number.parseFloat(data[0].lon),
    }
  } catch (error) {
    console.error("Error geocoding address:", error)
    return null
  }
}
