"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Home, ImageIcon, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImageAnalyzer } from "./image-analyzer"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { mockProperties } from "@/lib/mock-properties"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  imageUrl?: string
  features?: {
    name: string
    confidence: number
    description?: string
  }[]
}

interface ChatInterfaceProps {
  onUpdateListings?: (properties: any[], searchType: string) => void
}

export function ChatInterface({ onUpdateListings }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your Raiffeisen Real Estate Assistant. How can I help you find your dream property today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Sample property preferences for demonstration
  const samplePreferences = [
    "I'm looking for a 3-bedroom apartment in Zurich",
    "Show me houses with a garden under 1M CHF",
    "Properties near public transport in Basel",
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSend = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Call the new LangChain endpoint
      const response = await fetch('http://localhost:8000/api/openapichat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from AI')
      }

      const data = await response.json()

      // Add AI response to chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Update listings based on text query if the callback exists
      if (onUpdateListings) {
        onUpdateListings(getMatchingProperties(input), "text")
      }
    } catch (error) {
      console.error('Error:', error)
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const getAssistantResponse = (userInput: string): string => {
    const userInputLower = userInput.toLowerCase()

    if (userInputLower.includes("apartment") || userInputLower.includes("flat")) {
      return "I've found several apartments that might interest you. You can see them in the listings panel. Would you like to filter by price or location?"
    } else if (userInputLower.includes("house")) {
      return "I've found some houses that match your criteria. You can view them in the listings panel. Would you like to specify any additional features like garden size or garage?"
    } else if (
      userInputLower.includes("budget") ||
      userInputLower.includes("price") ||
      userInputLower.includes("chf")
    ) {
      return "I can help you find properties within your budget. The listings have been updated based on your price range. Would you like to see properties with specific amenities?"
    } else if (
      userInputLower.includes("location") ||
      userInputLower.includes("area") ||
      userInputLower.includes("zurich") ||
      userInputLower.includes("basel")
    ) {
      return "I've updated the listings to show properties in your preferred location. Would you like to narrow down by property type or price range?"
    } else {
      return "Thank you for sharing your preferences. I've updated the property listings based on what you're looking for. Feel free to ask if you want to refine your search further."
    }
  }

  const getMatchingProperties = (userInput: string): any[] => {
    // This would be replaced with actual API calls in a real implementation
    // For demo purposes, we'll return filtered mock data
    const userInputLower = userInput.toLowerCase()

    if (userInputLower.includes("apartment")) {
      return mockProperties.filter((p) => p.type === "apartment").slice(0, 3)
    } else if (userInputLower.includes("house")) {
      return mockProperties.filter((p) => p.type === "house").slice(0, 3)
    } else if (userInputLower.includes("zurich")) {
      return mockProperties.filter((p) => p.location.toLowerCase().includes("zurich")).slice(0, 3)
    } else if (userInputLower.includes("basel")) {
      return mockProperties.filter((p) => p.location.toLowerCase().includes("basel")).slice(0, 3)
    } else {
      return mockProperties.slice(0, 3)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSampleClick = (sample: string) => {
    setInput(sample)
  }

  const handleImageUploadClick = () => {
    setShowImageUpload(true)
  }

  const handleImageAnalysisComplete = (results: any, imageUrl: string) => {
    setShowImageUpload(false)

    // Add user message with image
    const userMessage: Message = {
      id: Date.now().toString(),
      content: "I'm looking for properties similar to this:",
      role: "user",
      timestamp: new Date(),
      imageUrl: imageUrl,
    }

    // Add assistant message with analysis
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content:
        "I've analyzed your image and found these key features. Here are some similar properties that match what you're looking for:",
      role: "assistant",
      timestamp: new Date(),
      features: results.features,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])

    // Update listings based on image analysis
    if (onUpdateListings) {
      onUpdateListings(results.similarProperties, "image")
    }
  }

  return (
    <Card className="h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="flex items-center gap-2 pb-2">
          <Home className="h-5 w-5 text-[#e30613]" />
          Real Estate Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pb-0 pt-4">
        {showImageUpload ? (
          <ImageAnalyzer onAnalysisComplete={handleImageAnalysisComplete} onClose={() => setShowImageUpload(false)} />
        ) : (
          <div className="space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex items-start gap-3 text-sm", message.role === "user" ? "flex-row-reverse" : "")}
              >
                <Avatar
                  className={cn(
                    "h-8 w-8",
                    message.role === "user" ? "bg-primary" : "bg-[#e30613] ring-2 ring-[#e30613]/20",
                  )}
                >
                  {message.role === "user" ? (
                    <AvatarFallback>U</AvatarFallback>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                  )}
                </Avatar>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[80%]",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <div className="space-y-3">
                    {message.content}

                    {message.imageUrl && (
                      <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-md">
                        <Image
                          src={message.imageUrl || "/placeholder.svg"}
                          alt="Uploaded property"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {message.features && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Detected features:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature.name} ({Math.round(feature.confidence * 100)}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 text-sm">
                <Avatar className="h-8 w-8 bg-[#e30613] ring-2 ring-[#e30613]/20">
                  <div className="flex items-center justify-center h-full w-full">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                </Avatar>
                <div className="rounded-lg px-3 py-2 max-w-[80%] bg-muted">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-4 flex flex-col">
        {!showImageUpload && (
          <>
            <div className="w-full mb-auto">
              <p className="text-xs text-muted-foreground mb-2">Try asking about:</p>
              <div className="flex flex-wrap gap-2">
                {samplePreferences.map((sample, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1 px-2"
                    onClick={() => handleSampleClick(sample)}
                  >
                    {sample}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex w-full items-center gap-2 mt-4">
              <Button variant="outline" size="icon" className="shrink-0" onClick={handleImageUploadClick}>
                <ImageIcon className="h-4 w-4" />
                <span className="sr-only">Upload image</span>
              </Button>
              <Input
                placeholder="Describe your ideal property..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button
                size="icon"
                className="shrink-0 bg-black hover:bg-white hover:text-black hover:border hover:border-black text-white rounded-none transition-colors"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
