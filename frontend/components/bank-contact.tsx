"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Download,
  Calendar,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  FileText,
  Building,
  User,
  Users,
  CalendarClock,
  ChevronRight,
  Printer,
  Share2,
} from "lucide-react"
import { mockProperties } from "@/lib/mock-properties"
import { useToast } from "@/components/ui/use-toast"

interface BankContactProps {
  favorites?: number[]
}

export function BankContact({ favorites = [] }: BankContactProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [preferredContact, setPreferredContact] = useState("phone")
  const [preferredTime, setPreferredTime] = useState("morning")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Generate a random application number
  const applicationNumber = `RM-${Math.floor(100000 + Math.random() * 900000)}`

  // Get favorite properties
  const favoriteProperties = mockProperties.filter((property) => favorites.includes(property.id))

  // Calculate total property value
  const totalPropertyValue = favoriteProperties.reduce((sum, property) => sum + property.price, 0)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(amount)
  }

  // Handle callback scheduling
  const handleScheduleCallback = () => {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Callback scheduled",
        description: "A Raiffeisen advisor will contact you at your preferred time.",
      })
    }, 1500)
  }

  // Handle document download
  const handleDownloadSummary = () => {
    toast({
      title: "Generating summary",
      description: "Your mortgage profile summary is being prepared for download.",
    })

    // In a real application, this would generate and download a PDF
  }

  return (
    <div className="container mx-auto flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Application Submitted</CardTitle>
                  <CardDescription>Thank you for your mortgage application</CardDescription>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Application Request Number
                  </h3>
                  <p className="text-2xl font-bold mt-1">{applicationNumber}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Please reference this number in all communications regarding your application.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Next Steps</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-5 w-5 rounded-full bg-[#e30613] text-white flex items-center justify-center text-xs font-medium">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Document Review</p>
                        <p className="text-sm text-muted-foreground">
                          Our team will review your submitted documents within 1-2 business days.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-5 w-5 rounded-full bg-[#e30613] text-white flex items-center justify-center text-xs font-medium">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Initial Assessment</p>
                        <p className="text-sm text-muted-foreground">
                          A mortgage specialist will assess your application and prepare financing options.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-5 w-5 rounded-full bg-[#e30613] text-white flex items-center justify-center text-xs font-medium">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Consultation</p>
                        <p className="text-sm text-muted-foreground">
                          We'll contact you to discuss your mortgage options and answer any questions.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Your Mortgage Profile</CardTitle>
              <CardDescription>Summary of your property and financing preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="financing">Financing</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building className="h-4 w-4 text-[#e30613]" />
                          Property
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Selected Properties:</span>
                            <span className="font-medium">{favoriteProperties.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Value:</span>
                            <span className="font-medium">{formatCurrency(totalPropertyValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Primary Location:</span>
                            <span className="font-medium">
                              {favoriteProperties.length > 0 ? favoriteProperties[0].location.split(",")[0] : "N/A"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#e30613]" />
                          Financing
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Down Payment:</span>
                            <span className="font-medium">20%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mortgage Amount:</span>
                            <span className="font-medium">{formatCurrency(totalPropertyValue * 0.8)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Preferred Rate Type:</span>
                            <span className="font-medium">Fixed Rate</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#e30613]" />
                        Application Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Application Date:</span>
                          <span className="font-medium">{new Date().toLocaleDateString("de-CH")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Documents Submitted:</span>
                          <span className="font-medium">1</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimated Response Time:</span>
                          <span className="font-medium">2-3 Business Days</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between gap-4">
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center gap-2"
                      onClick={handleDownloadSummary}
                    >
                      <Download className="h-4 w-4" />
                      Download Summary
                    </Button>
                    <Button variant="outline" className="flex-1 flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                    <Button variant="outline" className="flex-1 flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="properties" className="pt-4 space-y-4">
                  {favoriteProperties.length > 0 ? (
                    favoriteProperties.map((property) => (
                      <Card key={property.id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0 relative overflow-hidden">
                              <img
                                src={property.image || "/placeholder.svg"}
                                alt={property.title}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{property.title}</h3>
                              <p className="text-sm text-muted-foreground">{property.location}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge>{formatCurrency(property.price)}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {property.bedrooms} bed • {property.bathrooms} bath • {property.area} m²
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No properties selected</div>
                  )}
                </TabsContent>

                <TabsContent value="financing" className="pt-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Mortgage Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Property Value</p>
                            <p className="font-medium">{formatCurrency(totalPropertyValue)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Down Payment (20%)</p>
                            <p className="font-medium">{formatCurrency(totalPropertyValue * 0.2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Mortgage Amount</p>
                            <p className="font-medium">{formatCurrency(totalPropertyValue * 0.8)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Estimated Monthly Payment</p>
                            <p className="font-medium">{formatCurrency((totalPropertyValue * 0.8 * 0.015) / 12)}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <p className="font-medium mb-2">Selected Mortgage Options</p>
                          <div className="space-y-2">
                            <div className="p-3 border rounded-md">
                              <div className="flex justify-between items-center">
                                <div>
                                  <Badge className="bg-blue-600">Fixed Rate</Badge>
                                  <p className="font-medium mt-1">1.65% for 5 years</p>
                                </div>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule a Callback</CardTitle>
              <CardDescription>Speak with a mortgage specialist about your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preferred-contact">Preferred Contact Method</Label>
                <RadioGroup
                  value={preferredContact}
                  onValueChange={setPreferredContact}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="phone" />
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="video" id="video" />
                    <Label htmlFor="video" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Video Call
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred-time">Preferred Time</Label>
                <Select value={preferredTime} onValueChange={setPreferredTime}>
                  <SelectTrigger id="preferred-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (9:00 - 12:00)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (13:00 - 17:00)</SelectItem>
                    <SelectItem value="evening">Evening (17:00 - 19:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific questions or concerns you'd like to discuss"
                  className="resize-none"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-black hover:bg-white hover:text-black hover:border hover:border-black text-white rounded-none transition-colors"
                onClick={handleScheduleCallback}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Schedule Callback
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connect with Advisors</CardTitle>
              <CardDescription>Speak with our mortgage specialists</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-3 border rounded-md">
                <div className="h-10 w-10 rounded-full bg-[#e30613]/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-[#e30613]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Personal Advisor</p>
                  <p className="text-sm text-muted-foreground">One-on-one consultation</p>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4 p-3 border rounded-md">
                <div className="h-10 w-10 rounded-full bg-[#e30613]/10 flex items-center justify-center">
                  <Building className="h-5 w-5 text-[#e30613]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Visit a Branch</p>
                  <p className="text-sm text-muted-foreground">Find your nearest location</p>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4 p-3 border rounded-md">
                <div className="h-10 w-10 rounded-full bg-[#e30613]/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-[#e30613]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Mortgage Events</p>
                  <p className="text-sm text-muted-foreground">Upcoming seminars and webinars</p>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
