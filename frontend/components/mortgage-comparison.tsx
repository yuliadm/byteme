"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Plus, Trash2, ArrowRight, BarChart3, Percent, Calendar } from "lucide-react"

interface MortgageOption {
  id: string
  type: "Fixed" | "SARON" | "Variable"
  interestRate: number
  term: number
  amortization: "Direct" | "Indirect" | "None"
  monthlyPayment: number
  totalInterest: number
  earlyRepaymentFee: string
  flexibility: number
  selected: boolean
}

interface MortgageComparisonProps {
  propertyValue?: number
  downPaymentPercent?: number
  onProceedToNextStep?: () => void
}

export function MortgageComparison({
  propertyValue = 1000000,
  downPaymentPercent = 20,
  onProceedToNextStep,
}: MortgageComparisonProps) {
  // Calculate mortgage amount
  const mortgageAmount = propertyValue * (1 - downPaymentPercent / 100)

  // Default mortgage options
  const defaultMortgageOptions: MortgageOption[] = [
    {
      id: "fixed-5",
      type: "Fixed",
      interestRate: 1.65,
      term: 5,
      amortization: "Direct",
      monthlyPayment: calculateMonthlyPayment(mortgageAmount, 1.65, 5, "Direct"),
      totalInterest: calculateTotalInterest(mortgageAmount, 1.65, 5),
      earlyRepaymentFee: "Up to 3% of remaining balance",
      flexibility: 1,
      selected: true,
    },
    {
      id: "saron-3m",
      type: "SARON",
      interestRate: 1.35,
      term: 3,
      amortization: "Indirect",
      monthlyPayment: calculateMonthlyPayment(mortgageAmount, 1.35, 3, "Indirect"),
      totalInterest: calculateTotalInterest(mortgageAmount, 1.35, 3),
      earlyRepaymentFee: "Up to 1% of remaining balance",
      flexibility: 4,
      selected: false,
    },
    {
      id: "variable",
      type: "Variable",
      interestRate: 1.75,
      term: 0, // No fixed term
      amortization: "Direct",
      monthlyPayment: calculateMonthlyPayment(mortgageAmount, 1.75, 0, "Direct"),
      totalInterest: calculateTotalInterest(mortgageAmount, 1.75, 5), // Assuming 5 years for comparison
      earlyRepaymentFee: "None",
      flexibility: 5,
      selected: false,
    },
  ]

  const [mortgageOptions, setMortgageOptions] = useState<MortgageOption[]>(defaultMortgageOptions)
  const [customAmount, setCustomAmount] = useState(mortgageAmount)
  const [customTerm, setCustomTerm] = useState(10)
  const [customRate, setCustomRate] = useState(1.8)
  const [customAmortization, setCustomAmortization] = useState<"Direct" | "Indirect" | "None">("Direct")
  const [activeTab, setActiveTab] = useState<"compare" | "customize">("compare")

  // Helper function to calculate monthly payment
  function calculateMonthlyPayment(
    amount: number,
    rate: number,
    term: number,
    amortizationType: "Direct" | "Indirect" | "None",
  ): number {
    const monthlyRate = rate / 100 / 12
    const effectiveTerm = term === 0 ? 10 : term // Use 10 years for variable rate for calculation purposes
    const numPayments = effectiveTerm * 12

    // For direct amortization, include principal repayment
    if (amortizationType === "Direct") {
      // Calculate amortization to reach 65% LTV over 15 years (or term if shorter)
      const amortizationAmount = amount * 0.35 // 35% of the mortgage amount needs to be amortized
      const amortizationTerm = Math.min(15, effectiveTerm) * 12 // 15 years or term, whichever is shorter
      const monthlyAmortization = amortizationAmount / amortizationTerm

      // Calculate interest payment
      const interestPayment = amount * monthlyRate

      return interestPayment + monthlyAmortization
    } else {
      // For indirect or no amortization, only include interest
      return amount * monthlyRate
    }
  }

  // Helper function to calculate total interest over the term
  function calculateTotalInterest(amount: number, rate: number, term: number): number {
    const effectiveTerm = term === 0 ? 5 : term // Use 5 years for variable rate for comparison
    return amount * (rate / 100) * effectiveTerm
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(amount)
  }

  // Toggle mortgage option selection
  const toggleMortgageSelection = (id: string) => {
    setMortgageOptions(
      mortgageOptions.map((option) => ({
        ...option,
        selected: option.id === id ? !option.selected : option.selected,
      })),
    )
  }

  // Add custom mortgage option
  const addCustomMortgage = () => {
    const newOption: MortgageOption = {
      id: `custom-${Date.now()}`,
      type: "Fixed",
      interestRate: customRate,
      term: customTerm,
      amortization: customAmortization,
      monthlyPayment: calculateMonthlyPayment(customAmount, customRate, customTerm, customAmortization),
      totalInterest: calculateTotalInterest(customAmount, customRate, customTerm),
      earlyRepaymentFee: customTerm > 0 ? "Varies based on remaining term" : "None",
      flexibility: customTerm === 0 ? 5 : customTerm <= 3 ? 4 : customTerm <= 7 ? 3 : 2,
      selected: true,
    }

    setMortgageOptions([...mortgageOptions, newOption])
    setActiveTab("compare")
  }

  // Remove mortgage option
  const removeMortgageOption = (id: string) => {
    setMortgageOptions(mortgageOptions.filter((option) => option.id !== id))
  }

  // Get selected mortgage options
  const selectedOptions = mortgageOptions.filter((option) => option.selected)

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-none">
        <CardTitle>Mortgage Options</CardTitle>
        <CardDescription>Compare different mortgage types and find the best fit for your needs</CardDescription>
      </CardHeader>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "compare" | "customize")}
        className="flex-1 flex flex-col"
      >
        <div className="px-6 flex-none">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Compare Options
            </TabsTrigger>
            <TabsTrigger value="customize" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Custom
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="pt-4 pb-12 flex-1">
          <TabsContent value="compare" className="space-y-4 mt-0 h-full">
            {mortgageOptions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No mortgage options to compare. Create a custom option.</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab("customize")}>
                  Create Custom Option
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {mortgageOptions.map((option) => (
                    <Card
                      key={option.id}
                      className={`overflow-hidden ${option.selected ? "border-[#e30613] ring-1 ring-[#e30613]" : ""}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge
                              className={`${
                                option.type === "Fixed"
                                  ? "bg-blue-600"
                                  : option.type === "SARON"
                                    ? "bg-green-600"
                                    : "bg-amber-600"
                              }`}
                            >
                              {option.type} Rate
                            </Badge>
                            <CardTitle className="text-lg mt-2">
                              {option.interestRate}% {option.type === "Fixed" && `for ${option.term} years`}
                            </CardTitle>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleMortgageSelection(option.id)}
                            >
                              {option.selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeMortgageOption(option.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Monthly Payment:</span>
                            <span className="font-medium">{formatCurrency(option.monthlyPayment)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Term:</span>
                            <span className="font-medium">
                              {option.term > 0 ? `${option.term} years` : "No fixed term"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Amortization:</span>
                            <span className="font-medium">{option.amortization}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Early Repayment Fee:</span>
                            <span className="font-medium">{option.earlyRepaymentFee}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Flexibility:</span>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full mx-0.5 ${
                                    i < option.flexibility ? "bg-[#e30613]" : "bg-gray-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedOptions.length > 0 && (
                  <div className="mt-6 space-y-4 mb-8">
                    <h3 className="font-medium">Selected Options Comparison</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Option</th>
                            <th className="text-right py-2">Interest Rate</th>
                            <th className="text-right py-2">Monthly Payment</th>
                            <th className="text-right py-2">Total Interest (Term)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOptions.map((option) => (
                            <tr key={option.id} className="border-b">
                              <td className="py-2">
                                {option.type} {option.type === "Fixed" && `(${option.term} years)`}
                              </td>
                              <td className="text-right py-2">{option.interestRate}%</td>
                              <td className="text-right py-2">{formatCurrency(option.monthlyPayment)}</td>
                              <td className="text-right py-2">{formatCurrency(option.totalInterest)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="customize" className="space-y-6 mt-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="mortgage-amount">Mortgage Amount</Label>
                  <span className="text-sm font-medium">{formatCurrency(customAmount)}</span>
                </div>
                <Slider
                  id="mortgage-amount"
                  min={100000}
                  max={2000000}
                  step={10000}
                  value={[customAmount]}
                  onValueChange={(value) => setCustomAmount(value[0])}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mortgage-type">Mortgage Type</Label>
                  <Select defaultValue="Fixed">
                    <SelectTrigger id="mortgage-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed">Fixed Rate</SelectItem>
                      <SelectItem value="SARON">SARON</SelectItem>
                      <SelectItem value="Variable">Variable Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amortization-type">Amortization Type</Label>
                  <Select
                    value={customAmortization}
                    onValueChange={(value) => setCustomAmortization(value as "Direct" | "Indirect" | "None")}
                  >
                    <SelectTrigger id="amortization-type">
                      <SelectValue placeholder="Select amortization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Direct">Direct Amortization</SelectItem>
                      <SelectItem value="Indirect">Indirect Amortization</SelectItem>
                      <SelectItem value="None">No Amortization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                  <span className="text-sm font-medium">{customRate}%</span>
                </div>
                <Slider
                  id="interest-rate"
                  min={0.5}
                  max={5.0}
                  step={0.05}
                  value={[customRate]}
                  onValueChange={(value) => setCustomRate(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="term-length">Term Length (Years)</Label>
                  <span className="text-sm font-medium">
                    {customTerm === 0 ? "No fixed term" : `${customTerm} years`}
                  </span>
                </div>
                <Slider
                  id="term-length"
                  min={0}
                  max={15}
                  step={1}
                  value={[customTerm]}
                  onValueChange={(value) => setCustomTerm(value[0])}
                />
              </div>

              <div className="pt-4">
                <h3 className="font-medium mb-3">Estimated Payments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Monthly Payment</span>
                    </div>
                    <p className="text-lg font-bold">
                      {formatCurrency(
                        calculateMonthlyPayment(customAmount, customRate, customTerm, customAmortization),
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Total Interest</span>
                    </div>
                    <p className="text-lg font-bold">
                      {formatCurrency(calculateTotalInterest(customAmount, customRate, customTerm))}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={addCustomMortgage}
                className="w-full bg-black hover:bg-white hover:text-black hover:border hover:border-black text-white rounded-none transition-colors"
              >
                Add to Comparison
              </Button>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>

      <div className="p-4 mt-auto border-t">
        <Button
          onClick={onProceedToNextStep}
          className="w-full bg-black hover:bg-white hover:text-black hover:border hover:border-black text-white rounded-none transition-colors flex items-center justify-center gap-2"
        >
          Proceed to Document Preparation
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
