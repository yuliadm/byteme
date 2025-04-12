import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This would be replaced with actual AI processing in a real implementation
export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    // Get the last user message
    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop()

    if (!lastUserMessage) {
      return NextResponse.json({ error: "No user message found" }, { status: 400 })
    }

    const userInput = lastUserMessage.content.toLowerCase()
    let response = ""

    // Simple pattern matching for demo purposes
    if (userInput.includes("apartment") || userInput.includes("flat")) {
      response =
        "I've found several apartments that might interest you. You can see them in the listings panel. Would you like to filter by price or location?"
    } else if (userInput.includes("house")) {
      response =
        "I've found some houses that match your criteria. You can view them in the listings panel. Would you like to specify any additional features like garden size or garage?"
    } else if (userInput.includes("budget") || userInput.includes("price") || userInput.includes("chf")) {
      response =
        "I can help you find properties within your budget. The listings have been updated based on your price range. Would you like to see properties with specific amenities?"
    } else if (
      userInput.includes("location") ||
      userInput.includes("area") ||
      userInput.includes("zurich") ||
      userInput.includes("basel")
    ) {
      response =
        "I've updated the listings to show properties in your preferred location. Would you like to narrow down by property type or price range?"
    } else {
      response =
        "Thank you for sharing your preferences. I've updated the property listings based on what you're looking for. Feel free to ask if you want to refine your search further."
    }

    return NextResponse.json({
      role: "assistant",
      content: response,
    })
  } catch (error) {
    console.error("Error processing chat:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
