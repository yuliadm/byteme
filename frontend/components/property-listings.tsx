"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  ArrowUpDown,
  Filter,
  Percent,
  ChevronDown,
  Heart,
  ListFilter,
  ArrowRight,
} from "lucide-react"
import Image from "next/image"
import { mockProperties } from "@/lib/mock-properties"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Sample property data
// Replace the entire defaultProperties array with:
const defaultProperties = mockProperties

interface PropertyListingsProps {
  initialProperties?: any[]
  searchType?: string
  favorites?: number[]
  onToggleFavorite?: (propertyId: number) => void
  onProceedToFinancial?: () => void
}

export function PropertyListings({
  initialProperties,
  searchType,
  favorites = [],
  onToggleFavorite,
  onProceedToFinancial,
}: PropertyListingsProps) {
  const [properties, setProperties] = useState(initialProperties || defaultProperties)
  const [view, setView] = useState<"grid" | "list">("list")
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState([500000, 3000000])
  const [selectedType, setSelectedType] = useState<string>("all")
  const [displayCount, setDisplayCount] = useState(6) // Initially show 6 properties
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all")

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(price)
  }

  const filteredProperties = properties.filter((property) => {
    const matchesType = selectedType === "all" || property.type === selectedType
    const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1]
    const matchesFavorites = activeTab === "all" || (activeTab === "favorites" && favorites.includes(property.id))
    return matchesType && matchesPrice && matchesFavorites
  })

  // Limit the number of properties displayed
  const displayedProperties = filteredProperties.slice(0, displayCount)

  // Function to show more properties
  const showMoreProperties = () => {
    setDisplayCount((prevCount) => prevCount + 3)
  }

  // Handle favorite toggle
  const handleFavoriteToggle = (propertyId: number) => {
    if (onToggleFavorite) {
      onToggleFavorite(propertyId)
    }
  }

  // Get favorite properties
  const favoriteProperties = properties.filter((property) => favorites.includes(property.id))

  return (
    <Card className="h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{searchType === "image" ? "Visual Search Results" : "Property Listings"}</CardTitle>
            <CardDescription className="mt-1">
              Showing {displayedProperties.length} of {filteredProperties.length} properties
              {searchType === "image" ? " matching your image" : " matching your criteria"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setView(view === "grid" ? "list" : "grid")}
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle view</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <div className="px-6 py-2 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property-type">Property Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="property-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="apartment">Apartments</SelectItem>
                  <SelectItem value="house">Houses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Price Range</Label>
                <div className="text-sm text-muted-foreground">
                  {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                </div>
              </div>
              <Slider
                defaultValue={[500000, 3000000]}
                min={500000}
                max={3000000}
                step={50000}
                value={priceRange}
                onValueChange={setPriceRange}
                className="py-4"
              />
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pt-2 border-b">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "favorites")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <ListFilter className="h-4 w-4" />
              All Properties
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Favorites ({favorites.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <CardContent className="flex-1 overflow-y-auto pt-4">
        {displayedProperties.length === 0 && activeTab === "favorites" ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-4">
              Click the heart icon on properties you like to add them to your favorites
            </p>
            <Button variant="outline" onClick={() => setActiveTab("all")} className="flex items-center gap-2">
              <ListFilter className="h-4 w-4" />
              View All Properties
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedProperties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="flex">
                  <div className="w-2/5 relative">
                    <div className="relative h-full">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-white/80 hover:bg-white/90 shadow-sm"
                              onClick={(e) => {
                                e.preventDefault()
                                handleFavoriteToggle(property.id)
                              }}
                            >
                              <Heart
                                className={`h-4 w-4 ${favorites.includes(property.id) ? "fill-[#e30613] text-[#e30613]" : ""}`}
                              />
                              <span className="sr-only">
                                {favorites.includes(property.id) ? "Remove from favorites" : "Add to favorites"}
                              </span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {favorites.includes(property.id) ? "Remove from favorites" : "Add to favorites"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <Image
                        src={property.image || "/placeholder.svg"}
                        alt={property.title}
                        fill
                        className="object-cover h-full"
                      />

                      {property.similarityScore && (
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center">
                          <Percent className="h-3 w-3 mr-1" />
                          {Math.round(property.similarityScore * 100)}% match
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-3/5 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold line-clamp-1">{property.title}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {property.location}
                        </div>
                      </div>
                      <Badge className="bg-black">{formatPrice(property.price)}</Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{property.description}</p>

                    <div className="flex items-center gap-4 mt-4">
                      {property.bedrooms && (
                        <div className="flex items-center text-sm">
                          <Bed className="h-4 w-4 mr-1" />
                          {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center text-sm">
                          <Bath className="h-4 w-4 mr-1" />
                          {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
                        </div>
                      )}
                      {property.area && (
                        <div className="flex items-center text-sm">
                          <Maximize className="h-4 w-4 mr-1" />
                          {property.area} m²
                        </div>
                      )}
                    </div>

                    <Link href={`/property/${property.id}`} className="inline-block mt-4">
                      <Button className="bg-black hover:bg-white hover:text-black hover:border hover:border-black text-white rounded-none transition-colors">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}

            {/* Show more button */}
            {displayedProperties.length < filteredProperties.length && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={showMoreProperties}
                  className="flex items-center gap-2 hover:bg-black hover:text-white hover:border hover:border-black transition-colors"
                >
                  Show More <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Footer with Proceed button - only shown in favorites tab when there are favorites */}
      {activeTab === "favorites" && favorites.length > 0 && (
        <CardFooter className="border-t p-4 flex justify-end">
          <Button
            onClick={onProceedToFinancial}
            className="bg-black hover:bg-white hover:text-black hover:border hover:border-black text-white rounded-none transition-colors flex items-center gap-2"
          >
            Proceed to Financial Assessment
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
