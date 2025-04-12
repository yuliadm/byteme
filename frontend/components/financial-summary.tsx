"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Home, Wallet, PiggyBank, TrendingUp, CheckCircle, AlertCircle } from "lucide-react"
import { mockProperties } from "@/lib/mock-properties"

interface FinancialSummaryProps {
  favorites: number[]
  onProceedToMortgageOptions?: () => void
}

export function FinancialSummary({ favorites, onProceedToMortgageOptions }: FinancialSummaryProps) {
  const [annualIncome, setAnnualIncome] = useState(120000)
  const [savings, setSavings] = useState(200000)
  const [downPayment, setDownPayment] = useState(20)

  // Get favorite properties
  const favoriteProperties = mockProperties.filter((property) => favorites.includes(property.id))

  // Calculate total value of favorite properties
  const totalPropertyValue = favoriteProperties.reduce((sum, property) => sum + property.price, 0)

  // Calculate down payment amount
  const downPaymentAmount = (totalPropertyValue * downPayment) / 100

  // Calculate mortgage amount
  const mortgageAmount = totalPropertyValue - downPaymentAmount

  // Calculate monthly payment (simplified)
  const interestRate = 1.5 // 1.5% interest rate
  const monthlyPayment = (mortgageAmount * (interestRate / 100)) / 12 + mortgageAmount / (25 * 12)

  // Calculate affordability
  const affordabilityRatio = ((monthlyPayment * 12) / annualIncome) * 100
  const isAffordable = affordabilityRatio <= 33 // 33% rule of thumb

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(amount)
  }

  return (
    <Card className="h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader>
        <CardTitle>Financial Assessment</CardTitle>
        <CardDescription>Analyze your financial situation and property affordability</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-8">
          {/* Financial Inputs */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Your Financial Information</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="annual-income">Annual Income</Label>
                  <span className="text-sm font-medium">{formatCurrency(annualIncome)}</span>
                </div>
                <Slider
                  id="annual-income"
                  min={50000}
                  max={500000}
                  step={10000}
                  value={[annualIncome]}
                  onValueChange={(value) => setAnnualIncome(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="savings">Available Savings</Label>
                  <span className="text-sm font-medium">{formatCurrency(savings)}</span>
                </div>
                <Slider
                  id="savings"
                  min={50000}
                  max={1000000}
                  step={10000}
                  value={[savings]}
                  onValueChange={(value) => setSavings(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="down-payment">Down Payment Percentage</Label>
                  <span className="text-sm font-medium">{downPayment}%</span>
                </div>
                <Slider
                  id="down-payment"
                  min={20}
                  max={50}
                  step={5}
                  value={[downPayment]}
                  onValueChange={(value) => setDownPayment(value[0])}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 20% required in Switzerland (at least 10% from own funds)
                </p>
              </div>
            </div>
          </div>

          {/* Property Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Selected Properties Summary</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Home className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Property Value</p>
                    <p className="text-lg font-bold">{formatCurrency(totalPropertyValue)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <PiggyBank className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Down Payment ({downPayment}%)</p>
                    <p className="text-lg font-bold">{formatCurrency(downPaymentAmount)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mortgage Amount</p>
                    <p className="text-lg font-bold">{formatCurrency(mortgageAmount)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="text-lg font-bold">{formatCurrency(monthlyPayment)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Affordability Assessment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Affordability Assessment</h3>

            <Card className={isAffordable ? "border-green-500" : "border-red-500"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  {isAffordable ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      <span className="font-medium text-green-700">Your selection appears affordable</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-6 w-6 text-red-500" />
                      <span className="font-medium text-red-700">Your selection may exceed recommended limits</span>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Housing cost to income ratio:</span>
                    <Badge className={isAffordable ? "bg-green-500" : "bg-red-500"}>
                      {affordabilityRatio.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommendation: Housing costs should not exceed 33% of gross income
                  </p>

                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className={`h-2.5 rounded-full ${isAffordable ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(affordabilityRatio, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Properties List */}
            <div className="space-y-3">
              <h4 className="font-medium">Selected Properties ({favoriteProperties.length})</h4>
              {favoriteProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-md flex-shrink-0 relative overflow-hidden">
                        <img
                          src={property.image || "/placeholder.svg"}
                          alt={property.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{property.title}</p>
                        <p className="text-xs text-muted-foreground">{property.location}</p>
                      </div>
                      <Badge>{formatCurrency(property.price)}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      <div className="p-4 mt-auto border-t">
        <Button
          onClick={onProceedToMortgageOptions}
          className="w-full bg-black hover:bg-white hover:text-black hover:border hover:border-black text-white rounded-none transition-colors flex items-center justify-center gap-2"
        >
          Proceed to Mortgage Options
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
