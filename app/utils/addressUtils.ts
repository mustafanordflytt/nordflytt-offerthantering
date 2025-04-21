const OSM_NOMINATIM_API = "https://nominatim.openstreetmap.org/search"
const OSRM_API_URL = "https://router.project-osrm.org/route/v1/driving/"

export async function searchAddresses(
  query: string,
): Promise<Array<{ display_name: string; lat: number; lon: number }>> {
  try {
    const response = await fetch(
      `${OSM_NOMINATIM_API}?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=se`,
      {
        headers: {
          "User-Agent": "NordflyttBookingForm/1.0",
        },
      },
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    if (!Array.isArray(data)) {
      throw new Error("Unexpected response format")
    }
    return data.map((item: any) => ({
      display_name: item.display_name,
      lat: Number.parseFloat(item.lat),
      lon: Number.parseFloat(item.lon),
    }))
  } catch (error) {
    console.error("Error fetching address suggestions:", error)
    throw error
  }
}

export async function calculateDistance(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
): Promise<number | null> {
  try {
    const response = await fetch(`${OSRM_API_URL}${startLon},${startLat};${endLon},${endLat}?overview=false`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()

    if (data.code !== "Ok") {
      throw new Error(`Route calculation failed: ${data.code}`)
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No routes found in the response")
    }

    // Return distance in kilometers
    return data.routes[0].distance / 1000
  } catch (error) {
    console.error("Error calculating distance:", error)
    throw error
  }
}
