"use client"

import { cn } from "@/lib/utils"
import type React from "react"
import { Home, Calculator, FileText, ClipboardList, Phone, Check } from "lucide-react"

// Update the MortgageWizardProps interface to include favorites
interface MortgageWizardProps {
  currentStep?: number
  onStepChange?: (step: number) => void
  favorites?: number[] // Add this line to include favorites
}

interface Step {
  id: number
  name: string
  icon: React.ReactNode
}

// Update the function signature to include favorites with a default empty array
export function MortgageWizard({ currentStep = 1, onStepChange, favorites = [] }: MortgageWizardProps) {
  const steps: Step[] = [
    {
      id: 1,
      name: "Property Search",
      icon: <Home className="h-5 w-5" />,
    },
    {
      id: 2,
      name: "Financial Assessment",
      icon: <Calculator className="h-5 w-5" />,
    },
    {
      id: 3,
      name: "Mortgage Options",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 4,
      name: "Documents Preparation",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      id: 5,
      name: "Bank Contact",
      icon: <Phone className="h-5 w-5" />,
    },
  ]

  const handleStepClick = (stepId: number) => {
    // Prevent navigation to Financial Assessment if no properties are favorited
    if (stepId === 2 && favorites.length === 0) {
      return
    }

    // Only allow clicking on completed steps or the next available step
    if (stepId <= currentStep || stepId === currentStep + 1) {
      onStepChange?.(stepId)
    }
  }

  return (
    <div className="w-full bg-muted/40 py-4 border-b">
      <div className="container">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.id} className={cn("relative", stepIdx !== steps.length - 1 ? "flex-1" : "")}>
              {/* Connector line between steps */}
              {stepIdx !== steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 left-0 -right-4 h-0.5",
                    step.id < currentStep ? "bg-[#e30613]" : "bg-gray-300",
                  )}
                  style={{ left: "calc(50% + 1.5rem)", right: "calc(50% + 1.5rem)" }}
                />
              )}

              <div className="flex flex-col items-center">
                {/* Step circle */}
                <button
                  onClick={() => handleStepClick(step.id)}
                  disabled={step.id > currentStep + 1 || (step.id === 2 && favorites.length === 0)}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                    step.id < currentStep
                      ? "bg-[#e30613] text-white cursor-pointer"
                      : step.id === currentStep
                        ? "border-2 border-[#e30613] bg-white text-[#e30613]"
                        : step.id === currentStep + 1 && !(step.id === 2 && favorites.length === 0)
                          ? "border-2 border-gray-300 bg-white text-gray-400 cursor-pointer hover:border-gray-400"
                          : "border-2 border-gray-300 bg-white text-gray-400 cursor-not-allowed opacity-60",
                  )}
                >
                  {step.id < currentStep ? <Check className="h-5 w-5" /> : step.icon}
                </button>

                {/* Step name */}
                <span
                  className={cn(
                    "mt-2 text-sm font-medium",
                    step.id === currentStep
                      ? "text-[#e30613]"
                      : step.id < currentStep
                        ? "text-gray-900"
                        : "text-gray-500",
                  )}
                >
                  {step.name}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
