"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Calculator, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export function FinancialChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your Raiffeisen Financial Assistant. I can help you understand your mortgage options and financial situation. What would you like to know?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Replace the handleSend function with this implementation that connects to the FastAPI backend
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
      // Call the FastAPI backend
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()

      // Add assistant message with the response from the API
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error calling chat API:", error)

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble connecting to the server. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Remove the getAssistantResponse function as we're now getting responses from the API
  // Delete this function:
  // const getAssistantResponse = (userInput: string): string => {
  //   ...
  // }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSampleClick = (sample: string) => {
    setInput(sample)
  }

  return (
    <Card className="h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="flex items-center gap-2 pb-2">
          <Calculator className="h-5 w-5 text-[#e30613]" />
          Financial Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pb-0 pt-4">
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
                <div className="space-y-3">{message.content}</div>
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

         
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex w-full items-center gap-2">
          <Input
            placeholder="Ask about your financial options..."
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
      </CardFooter>
    </Card>
  )
}
