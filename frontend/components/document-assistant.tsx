"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, FileText, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export function DocumentAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your Document Assistant. I can help you understand what documents you need for your mortgage application and how to prepare them. What would you like to know?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Sample document questions for demonstration
  const sampleQuestions = [
    "What file formats are accepted?",
    "How long is the verification process?",
    "What if I don't have all documents?",
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSend = () => {
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

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getAssistantResponse(input),
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const getAssistantResponse = (userInput: string): string => {
    const userInputLower = userInput.toLowerCase()

    if (userInputLower.includes("format") || userInputLower.includes("file") || userInputLower.includes("pdf")) {
      return "We accept PDF, JPG, and PNG file formats. Each file should be no larger than 10MB. For best results, we recommend using PDF format for multi-page documents and ensuring all text is clearly legible."
    } else if (
      userInputLower.includes("verification") ||
      userInputLower.includes("review") ||
      userInputLower.includes("check")
    ) {
      return "After you upload your documents, our team will verify them within 1-2 business days. You'll receive a notification when the verification is complete. If there are any issues with your documents, we'll let you know what needs to be corrected."
    } else if (
      userInputLower.includes("missing") ||
      userInputLower.includes("don't have") ||
      userInputLower.includes("all documents")
    ) {
      return "If you're missing some required documents, you can still proceed with uploading what you have. However, your application can only move forward once all required documents are submitted. For specific document issues, please contact our support team who can advise on alternatives or extensions."
    } else if (
      userInputLower.includes("quality") ||
      userInputLower.includes("scan") ||
      userInputLower.includes("dpi")
    ) {
      return "All documents must be clearly legible. Scanned documents should be at least 300 DPI. Make sure all text, especially numbers and dates, is sharp and readable. Poor quality documents may be rejected during verification, which could delay your application."
    } else if (userInputLower.includes("translate") || userInputLower.includes("language")) {
      return "Documents that are not in German, French, Italian, or English must be professionally translated. Both the original document and the certified translation should be uploaded together as a single PDF file."
    } else if (
      userInputLower.includes("expired") ||
      userInputLower.includes("old") ||
      userInputLower.includes("date")
    ) {
      return "Most financial documents should be recent (less than 3 months old). ID documents must be valid and not expired. Tax returns should be from the most recent tax year. If you're unsure about a specific document's validity period, please ask and I can provide more details."
    } else if (
      userInputLower.includes("checklist") ||
      userInputLower.includes("list") ||
      userInputLower.includes("all required")
    ) {
      return "The essential documents for a Swiss mortgage application include: ID/Passport, Salary statements (last 3 months), Tax return, Wealth statement showing down payment funds, Pension fund statement, Debt registry extract, Purchase contract, and Land registry extract. Additional documents may be required based on your specific situation."
    } else if (
      userInputLower.includes("help") ||
      userInputLower.includes("support") ||
      userInputLower.includes("contact")
    ) {
      return "If you need additional help, you can contact our support team at support@raiffeisen.ch or call +41 44 123 45 67 during business hours (Mon-Fri, 8:00-18:00). You can also download our comprehensive document checklist from the document preparation page."
    } else {
      return "Thank you for your question about mortgage documentation. The key to a smooth application process is providing complete and accurate documents. Required documents typically fall into three categories: personal identification, financial records, and property information. Is there a specific category or document you'd like to know more about?"
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#e30613]" />
          Document Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pb-0">
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

        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Try asking about:</p>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((sample, index) => (
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
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex w-full items-center gap-2">
          <Input
            placeholder="Ask about document requirements..."
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
