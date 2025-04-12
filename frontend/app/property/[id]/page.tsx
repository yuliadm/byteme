"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/header"
import { MortgageWizard } from "@/components/mortgage-wizard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Bed, Bath, Maximize, Calendar, Leaf, ArrowLeft, Heart } from "lucide-react"
import { mockProperties } from "@/lib/mock-properties"

export default function PropertyDetails() {
  const params = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)

  // Get favorites from localStorage
  const [favorites, setFavorites] = useState<number[]>([])

  useEffect(() => {
    // Load favorites from localStorage
    const storedFavorites = localStorage.getItem("propertyFavorites")
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites))
    }
  }, [])

  useEffect(() => {
    if (params.id) {
      // In a real app, we would fetch the property data from an API
      // For this demo, we'll use the mock data
      const foundProperty = mockProperties.find((p) => p.id.toString() === params.id)
      setProperty(foundProperty || null)
      setIsLoading(false)
    }
  }, [params.id])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(price)
  }

  const toggleFavorite = (propertyId: number) => {
    const newFavorites = favorites.includes(propertyId)
      ? favorites.filter((id) => id !== propertyId)
      : [...favorites, propertyId]

    setFavorites(newFavorites)
    localStorage.setItem("propertyFavorites", JSON.stringify(newFavorites))
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col">
        <Header />
        <div className="container mx-auto p-4 md:p-6">
          <div className="animate-pulse">
            <div className="h-8 w-1/3 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  if (!property) {
    return (
      <main className="flex min-h-screen flex-col">
        <Header />
        <div className="container mx-auto p-4 md:p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <p className="mb-6">The property you are looking for does not exist or has been removed.</p>
          <Button onClick={() => router.push("/")} className="bg-[#e30613] hover:bg-[#c00510]">
            Return to Home
          </Button>
        </div>
      </main>
    )
  }

  const isFavorite = favorites.includes(property.id)

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <MortgageWizard currentStep={currentStep} onStepChange={setCurrentStep} favorites={favorites} />
      <div className="container mx-auto p-4 md:p-6">
        <Button variant="ghost" className="mb-4 flex items-center gap-2" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - 2/3 width on desktop */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property images */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
              <Image
                src={property.image || "/placeholder.svg?height=600&width=800"}
                alt={property.title}
                fill
                className="object-cover"
                priority
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/80 hover:bg-white/90"
                onClick={() => toggleFavorite(property.id)}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-[#e30613] text-[#e30613]" : ""}`} />
                <span className="sr-only">{isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
              </Button>
            </div>

            {/* Property title and location */}
            <div>
              <div className="flex items-start justify-between">
                <h1 className="text-2xl md:text-3xl font-bold">{property.title}</h1>
                <Badge className="text-lg bg-[#e30613]">{formatPrice(property.price)}</Badge>
              </div>
              <div className="flex items-center text-muted-foreground mt-2">
                <MapPin className="h-4 w-4 mr-1" />
                {property.location}
              </div>
            </div>

            {/* Property details tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-4">
                <div className="space-y-4">
                  <p className="text-muted-foreground">{property.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <Bed className="h-5 w-5 mb-2" />
                      <span className="text-sm text-muted-foreground">Bedrooms</span>
                      <span className="font-bold">{property.bedrooms}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <Bath className="h-5 w-5 mb-2" />
                      <span className="text-sm text-muted-foreground">Bathrooms</span>
                      <span className="font-bold">{property.bathrooms}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <Maximize className="h-5 w-5 mb-2" />
                      <span className="text-sm text-muted-foreground">Area</span>
                      <span className="font-bold">{property.area} m²</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <Calendar className="h-5 w-5 mb-2" />
                      <span className="text-sm text-muted-foreground">Year Built</span>
                      <span className="font-bold">{property.yearBuilt || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="features" className="pt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Property Features</h3>
                  {property.features && property.features.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {property.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <div className="h-2 w-2 rounded-full bg-[#e30613]" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No features listed for this property.</p>
                  )}

                  {property.energyRating && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Energy Rating</h3>
                      <div className="flex items-center gap-2">
                        <Leaf className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Energy Class {property.energyRating}</span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="location" className="pt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Location</h3>
                  <p className="text-muted-foreground">
                    This property is located in {property.location}. Detailed location information and neighborhood
                    details would be available here in a real application.
                  </p>
                  <div className="aspect-[16/9] w-full bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Map would be displayed here</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - 1/3 width on desktop */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Contact Agent</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <span className="font-medium">RA</span>
                  </div>
                  <div>
                    <p className="font-medium">Raiffeisen Agent</p>
                    <p className="text-sm text-muted-foreground">Property Specialist</p>
                  </div>
                </div>
                <Button className="w-full bg-[#e30613] hover:bg-[#c00510] mb-2">Contact Agent</Button>
                <Button variant="outline" className="w-full">
                  Schedule Viewing
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Mortgage Calculator</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Property Price</p>
                    <p className="font-medium">{formatPrice(property.price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p>
                    <p className="font-medium">{formatPrice(Math.round(property.price * 0.003))} / month</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on 20% down payment, 1.5% interest rate, 25-year term
                    </p>
                  </div>
                  <Button className="w-full bg-[#e30613] hover:bg-[#c00510]">Calculate Your Mortgage</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Similar Properties</h3>
                <div className="space-y-4">
                  {mockProperties
                    .filter((p) => p.id !== property.id && p.type === property.type)
                    .slice(0, 2)
                    .map((similarProperty) => (
                      <div key={similarProperty.id} className="flex gap-3">
                        <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md">
                          <Image
                            src={similarProperty.image || "/placeholder.svg?height=200&width=300"}
                            alt={similarProperty.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-1">{similarProperty.title}</h4>
                          <p className="text-xs text-muted-foreground">{similarProperty.location}</p>
                          <p className="text-sm font-medium mt-1">{formatPrice(similarProperty.price)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
