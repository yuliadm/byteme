"use client"

import { MortgageOptionsAssistant } from "./mortgage-options-assistant"
import { MortgageComparison } from "./mortgage-comparison"

interface MortgageOptionsProps {
  propertyValue?: number
  downPaymentPercent?: number
  onProceedToNextStep?: () => void
}

export function MortgageOptions({
  propertyValue = 1000000,
  downPaymentPercent = 20,
  onProceedToNextStep,
}: MortgageOptionsProps) {
  return (
    <div className="container mx-auto flex flex-1 flex-col md:flex-row gap-6 p-4 md:p-6">
      <div className="w-full md:w-1/2">
        <MortgageOptionsAssistant />
      </div>
      <div className="w-full md:w-1/2">
        <MortgageComparison
          propertyValue={propertyValue}
          downPaymentPercent={downPaymentPercent}
          onProceedToNextStep={onProceedToNextStep}
        />
      </div>
    </div>
  )
}
