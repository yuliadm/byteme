"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"

interface ImageAnalysisResult {
  features: {
    name: string
    confidence: number
    description?: string
  }[]
  similarProperties: any[]
}

interface ImageAnalyzerProps {
  onAnalysisComplete: (results: ImageAnalysisResult, imageUrl: string) => void
  onClose: () => void
}

export function ImageAnalyzer({ onAnalysisComplete, onClose }: ImageAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Check file type
      if (!file.type.startsWith("image/")) {
        setUploadError("Please upload an image file")
        return
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Image size should be less than 5MB")
        return
      }

      setImageFile(file)
      const imageUrl = URL.createObjectURL(file)
      setSelectedImage(imageUrl)
    }
  }

  const analyzeImage = async () => {
    if (!imageFile) return

    setIsAnalyzing(true)

    try {
      // Create form data to send the image
      const formData = new FormData()
      formData.append("image", imageFile)

      // In a real implementation, we would send the image to the server
      // For demo purposes, we'll simulate a response after a delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock analysis results
      const mockResults: ImageAnalysisResult = {
        features: [
          { name: "Waterfront", confidence: 0.95, description: "Property with water views" },
          { name: "Modern Architecture", confidence: 0.87, description: "Contemporary design" },
          { name: "Cliff/Elevated", confidence: 0.92, description: "Property on elevated terrain" },
          { name: "Luxury", confidence: 0.78, description: "High-end finishes" },
          { name: "Outdoor Space", confidence: 0.85, description: "Terrace or balcony" },
        ],
        similarProperties: [
          {
            id: 101,
            title: "Luxury Cliff House with Ocean View",
            location: "Lugano, Switzerland",
            price: 3200000,
            image:
              "https://media2.homegate.ch/f_auto/t_web_dp_small/listings/v2/g014/4002077433/image/af646d4e45539379f6dd2ab6a5479f91.jpg",
            similarityScore: 0.94,
          },
          {
            id: 102,
            title: "Modern Lake House with Panoramic Views",
            location: "Montreux, Switzerland",
            price: 2850000,
            image:
              "https://media2.homegate.ch/f_auto/t_web_dp_small/listings/v2/linkauf/4002062006/image/939c46949edb880e4ce3ccbdb35488f8.jpg",
            similarityScore: 0.89,
          },
          {
            id: 103,
            title: "Contemporary Mountain Retreat",
            location: "Zermatt, Switzerland",
            price: 3500000,
            image:
              "https://media2.homegate.ch/f_auto/t_web_dp_small/listings/v2/hgonif/4002049539/image/1ee92fd13982f99bbd64bbc8b07a2779.jpg",
            similarityScore: 0.82,
          },
          {
            id: 104,
            title: "Exclusive Waterfront Villa",
            location: "Ascona, Switzerland",
            price: 4200000,
            image:
              "https://media2.homegate.ch/f_auto/t_web_dp_small/listings/v2/hgonif/4002025621/image/4e716f8419f4cbdc6f311497897d8229.jpg",
            similarityScore: 0.78,
          },
        ],
      }

      onAnalysisComplete(mockResults, selectedImage!)
    } catch (error) {
      console.error("Error analyzing image:", error)
      setUploadError("Failed to analyze image. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="relative">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        <CardTitle>Visual Property Search</CardTitle>
        <CardDescription>Upload an image of a property you like to find similar options</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedImage ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <Image src={selectedImage || "/placeholder.svg"} alt="Selected property" fill className="object-cover" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-12">
            <p className="text-sm text-muted-foreground mb-4">Upload an image of a property you like</p>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
            <label htmlFor="image-upload">
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>Choose Image</span>
              </Button>
            </label>
          </div>
        )}

        {uploadError && <p className="text-sm text-destructive mt-2">{uploadError}</p>}
      </CardContent>
      <CardFooter className="flex justify-between">
        {selectedImage && (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedImage(null)
                setImageFile(null)
              }}
            >
              Change Image
            </Button>
            <Button
              onClick={analyzeImage}
              disabled={isAnalyzing}
              className="bg-black hover:bg-white hover:text-black hover:border hover:border-black text-white rounded-none transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Find Similar Properties"
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
