"use client"

import { FinancialChatAssistant } from "./financial-chat-assistant"
import { FinancialSummary } from "./financial-summary"

interface FinancialAssessmentProps {
  favorites: number[]
  onProceedToMortgageOptions?: () => void
}

export function FinancialAssessment({ favorites, onProceedToMortgageOptions }: FinancialAssessmentProps) {
  return (
    <div className="container mx-auto flex flex-1 flex-col md:flex-row gap-6 p-4 md:p-6">
      <div className="w-full md:w-1/2">
        <FinancialChatAssistant />
      </div>
      <div className="w-full md:w-1/2">
        <FinancialSummary favorites={favorites} onProceedToMortgageOptions={onProceedToMortgageOptions} />
      </div>
    </div>
  )
}
