import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Sample property data
const properties = [
  {
    id: 1,
    title: "Modern Apartment in Zurich",
    description: "Spacious 3-bedroom apartment with stunning views of Lake Zurich",
    price: 1250000,
    location: "Zurich, Switzerland",
    image: "/placeholder.svg?height=400&width=600",
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    type: "apartment",
  },
  {
    id: 2,
    title: "Luxury Villa with Garden",
    description: "Beautiful villa with large garden and swimming pool in a quiet neighborhood",
    price: 2800000,
    location: "Lucerne, Switzerland",
    image: "/placeholder.svg?height=400&width=600",
    bedrooms: 5,
    bathrooms: 3,
    area: 250,
    type: "house",
  },
  {
    id: 3,
    title: "Cozy Studio in City Center",
    description: "Modern studio apartment in the heart of Basel, close to all amenities",
    price: 650000,
    location: "Basel, Switzerland",
    image: "/placeholder.svg?height=400&width=600",
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    type: "apartment",
  },
  {
    id: 4,
    title: "Family Home with Garden",
    description: "Spacious family home with garden, perfect for growing families",
    price: 1450000,
    location: "Bern, Switzerland",
    image: "/placeholder.svg?height=400&width=600",
    bedrooms: 4,
    bathrooms: 2,
    area: 180,
    type: "house",
  },
  {
    id: 5,
    title: "Penthouse with Terrace",
    description: "Luxurious penthouse with large terrace and panoramic views",
    price: 1950000,
    location: "Geneva, Switzerland",
    image: "/placeholder.svg?height=400&width=600",
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    type: "apartment",
  },
  {
    id: 6,
    title: "Mountain Chalet",
    description: "Traditional Swiss chalet with modern amenities in a scenic location",
    price: 1750000,
    location: "Zermatt, Switzerland",
    image: "/placeholder.svg?height=400&width=600",
    bedrooms: 4,
    bathrooms: 3,
    area: 200,
    type: "house",
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  // Extract filter parameters
  const minPrice = Number(searchParams.get("minPrice")) || 0
  const maxPrice = Number(searchParams.get("maxPrice")) || 10000000
  const propertyType = searchParams.get("type") || "all"
  const location = searchParams.get("location") || ""
  const minBedrooms = Number(searchParams.get("minBedrooms")) || 0

  // Filter properties based on parameters
  const filteredProperties = properties.filter((property) => {
    const matchesPrice = property.price >= minPrice && property.price <= maxPrice
    const matchesType = propertyType === "all" || property.type === propertyType
    const matchesLocation = !location || property.location.toLowerCase().includes(location.toLowerCase())
    const matchesBedrooms = property.bedrooms >= minBedrooms

    return matchesPrice && matchesType && matchesLocation && matchesBedrooms
  })

  return NextResponse.json(filteredProperties)
}
