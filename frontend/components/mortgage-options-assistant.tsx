"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, MessageSquare, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export function MortgageOptionsAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your Raiffeisen Mortgage Advisor. I can help you understand different mortgage options and find the best one for your needs. What would you like to know?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Sample mortgage questions for demonstration
  const sampleQuestions = [
    "What's the difference between fixed and variable rates?",
    "How long should my mortgage term be?",
    "What is a SARON mortgage?",
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

    if (userInputLower.includes("fixed") && userInputLower.includes("variable")) {
      return "Fixed-rate mortgages offer stability with the same interest rate throughout the term, protecting you from rate increases but potentially missing out on decreases. Variable-rate mortgages fluctuate with market rates, potentially saving money when rates drop but risking higher payments when rates rise. Fixed rates are currently around 1.5-2.5% while variable rates start around 1.2-1.8% but can change."
    } else if (userInputLower.includes("fixed")) {
      return "Fixed-rate mortgages provide stability with a guaranteed interest rate for the entire term (typically 2-15 years). This protects you from interest rate increases but means you won't benefit if rates decrease. Currently, our fixed rates range from 1.5% for 2-year terms to 2.5% for 10-year terms. They're ideal if you prefer predictable payments and want protection from market fluctuations."
    } else if (userInputLower.includes("variable")) {
      return "Variable-rate mortgages have interest rates that fluctuate with market conditions, typically based on the Swiss National Bank's policy rate. The initial rates are often lower than fixed rates (currently starting around 1.2-1.8%), but they can increase or decrease over time. They're suitable if you can tolerate some payment uncertainty and want to potentially benefit from falling interest rates."
    } else if (userInputLower.includes("saron")) {
      return "SARON (Swiss Average Rate Overnight) mortgages are based on the Swiss money market reference rate. The interest rate is typically reset every 3 months based on the 3-month compounded SARON rate plus a margin. This offers more flexibility than fixed-rate mortgages but with less volatility than traditional variable rates. Current SARON-based mortgage rates are around 1.3-1.7%, but this can change with market conditions."
    } else if (userInputLower.includes("term") || userInputLower.includes("length")) {
      return "Mortgage terms in Switzerland typically range from 2 to 15 years for fixed-rate mortgages. Shorter terms (2-5 years) generally offer lower interest rates but require more frequent refinancing, exposing you to potential rate increases. Longer terms (7-15 years) provide more stability but usually at higher interest rates. The optimal term depends on your risk tolerance, how long you plan to stay in the property, and your view on future interest rate trends."
    } else if (userInputLower.includes("amortization")) {
      return "In Switzerland, mortgages typically need to be amortized (paid down) to 65% of the property's purchase value within 15 years. There are two main amortization models: Direct amortization involves regular payments directly reducing your mortgage principal. Indirect amortization involves making payments into a 3rd pillar pension account while maintaining the mortgage balance, offering potential tax advantages. The best choice depends on your financial situation and tax considerations."
    } else if (userInputLower.includes("compare")) {
      return "You can compare different mortgage options using our comparison tool on the right. Consider factors beyond just the interest rate, such as term length, flexibility for early repayment, amortization options, and how the payment structure fits your financial situation. Would you like me to explain any specific aspect of the comparison in more detail?"
    } else {
      return "Thank you for your question about mortgages. To find the best mortgage option, consider factors like your financial situation, risk tolerance, and how long you plan to stay in the property. Our current offerings include fixed-rate mortgages (1.5-2.5%), SARON mortgages (1.3-1.7%), and variable-rate mortgages (1.2-1.8%). You can compare these options using the tool on the right. Is there a specific aspect of mortgages you'd like to know more about?"
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
    <Card className="h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="flex items-center gap-2 pb-2">
          <FileText className="h-5 w-5 text-[#e30613]" />
          Mortgage Advisor
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
            placeholder="Ask about mortgage options..."
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
