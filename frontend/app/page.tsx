"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { ChatInterface } from "@/components/chat-interface"
import { PropertyListings } from "@/components/property-listings"
import { MortgageWizard } from "@/components/mortgage-wizard"
import { FinancialAssessment } from "@/components/financial-assessment"
import { MortgageOptions } from "@/components/mortgage-options"
import { DocumentPreparation } from "@/components/document-preparation"
import { BankContact } from "@/components/bank-contact"
import { mockProperties } from "@/lib/mock-properties"
import { useToast } from "@/components/ui/use-toast"

export default function Home() {
  const [properties, setProperties] = useState(mockProperties)
  const [searchType, setSearchType] = useState("default")
  const [currentStep, setCurrentStep] = useState(1)
  const [favorites, setFavorites] = useState<number[]>([])
  const { toast } = useToast()

  // Load favorites from localStorage on initial render
  useEffect(() => {
    const storedFavorites = localStorage.getItem("propertyFavorites")
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites))
    }
  }, [])

  const handleUpdateListings = (newProperties: any[], type: string) => {
    setProperties(newProperties)
    setSearchType(type)
  }

  const handleToggleFavorite = (propertyId: number) => {
    const isFavorite = favorites.includes(propertyId)
    let newFavorites: number[]

    if (isFavorite) {
      newFavorites = favorites.filter((id) => id !== propertyId)
    } else {
      newFavorites = [...favorites, propertyId]
    }

    setFavorites(newFavorites)
    localStorage.setItem("propertyFavorites", JSON.stringify(newFavorites))
  }

  const handleProceedToFinancial = () => {
    setCurrentStep(2)
  }

  const handleProceedToMortgageOptions = () => {
    setCurrentStep(3)
  }

  const handleProceedToDocuments = () => {
    setCurrentStep(4)
  }

  const handleProceedToBankContact = () => {
    setCurrentStep(5)
  }

  // Calculate average property value of favorites for mortgage options
  const calculateAveragePropertyValue = () => {
    if (favorites.length === 0) return 1000000 // Default value

    const favoriteProperties = mockProperties.filter((p) => favorites.includes(p.id))
    const totalValue = favoriteProperties.reduce((sum, property) => sum + property.price, 0)
    return totalValue / favoriteProperties.length
  }

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <MortgageWizard currentStep={currentStep} onStepChange={setCurrentStep} favorites={favorites} />

      {currentStep === 1 && (
        <div className="container mx-auto flex flex-1 flex-col md:flex-row gap-6 p-4 md:p-6">
          <div className="w-full md:w-1/2">
            <ChatInterface onUpdateListings={handleUpdateListings} />
          </div>
          <div className="w-full md:w-1/2">
            <PropertyListings
              initialProperties={properties}
              searchType={searchType}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onProceedToFinancial={handleProceedToFinancial}
            />
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <FinancialAssessment favorites={favorites} onProceedToMortgageOptions={handleProceedToMortgageOptions} />
      )}

      {currentStep === 3 && (
        <MortgageOptions
          propertyValue={calculateAveragePropertyValue()}
          downPaymentPercent={20}
          onProceedToNextStep={handleProceedToDocuments}
        />
      )}

      {currentStep === 4 && <DocumentPreparation onProceedToNextStep={handleProceedToBankContact} />}

      {currentStep === 5 && <BankContact favorites={favorites} />}
    </main>
  )
}
