"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DocumentAssistant } from "./document-assistant"

interface DocumentRequirement {
  id: string
  name: string
  description: string
  required: boolean
  status: "pending" | "uploaded" | "verified" | "rejected"
  category: "personal" | "financial" | "property"
}

interface DocumentPreparationProps {
  onProceedToNextStep?: () => void
}

export function DocumentPreparation({ onProceedToNextStep }: DocumentPreparationProps) {
  // Document requirements for Swiss mortgage applications - all set as optional now
  const [documents, setDocuments] = useState<DocumentRequirement[]>([
    // Personal documents
    {
      id: "id-passport",
      name: "ID Card or Passport",
      description: "Valid identification document for all applicants",
      required: false, // Changed to optional
      status: "pending",
      category: "personal",
    },
    {
      id: "residence-permit",
      name: "Residence Permit",
      description: "For non-Swiss citizens (B, C, or L permit)",
      required: false, // Changed to optional
      status: "pending",
      category: "personal",
    },
    {
      id: "marriage-certificate",
      name: "Marriage Certificate",
      description: "If applicable",
      required: false,
      status: "pending",
      category: "personal",
    },

    // Financial documents
    {
      id: "salary-statements",
      name: "Salary Statements",
      description: "Last 3 months of salary statements for all applicants",
      required: false, // Changed to optional
      status: "pending",
      category: "financial",
    },
    {
      id: "tax-return",
      name: "Tax Return",
      description: "Most recent tax return and assessment",
      required: false, // Changed to optional
      status: "pending",
      category: "financial",
    },
    {
      id: "wealth-statement",
      name: "Wealth Statement",
      description: "Bank statements showing available funds for down payment",
      required: false, // Changed to optional
      status: "pending",
      category: "financial",
    },
    {
      id: "pension-statement",
      name: "Pension Fund Statement",
      description: "Current pension fund statement (2nd pillar)",
      required: false, // Changed to optional
      status: "pending",
      category: "financial",
    },
    {
      id: "debt-registry",
      name: "Debt Registry Extract",
      description: "Extract from the debt collection registry (less than 3 months old)",
      required: false, // Changed to optional
      status: "pending",
      category: "financial",
    },
    {
      id: "other-loans",
      name: "Other Loans Documentation",
      description: "Documentation of any other loans or financial obligations",
      required: false,
      status: "pending",
      category: "financial",
    },

    // Property documents
    {
      id: "purchase-contract",
      name: "Purchase Contract",
      description: "Signed purchase contract or draft for the property",
      required: false, // Changed to optional
      status: "pending",
      category: "property",
    },
    {
      id: "land-registry",
      name: "Land Registry Extract",
      description: "Recent extract from the land registry",
      required: false, // Changed to optional
      status: "pending",
      category: "property",
    },
    {
      id: "floor-plans",
      name: "Floor Plans",
      description: "Detailed floor plans of the property",
      required: false, // Changed to optional
      status: "pending",
      category: "property",
    },
    {
      id: "building-permits",
      name: "Building Permits",
      description: "For new constructions or planned renovations",
      required: false,
      status: "pending",
      category: "property",
    },
    {
      id: "energy-certificate",
      name: "Energy Certificate",
      description: "Energy efficiency certificate for the property",
      required: false,
      status: "pending",
      category: "property",
    },
  ])

  // Handle file upload
  const handleFileUpload = (documentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // In a real application, you would upload the file to a server here
      // For this demo, we'll just update the status
      setDocuments(
        documents.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                status: "uploaded",
              }
            : doc,
        ),
      )
    }
  }

  // Calculate progress - now based on all documents, not just required ones
  const totalDocuments = documents.length
  const uploadedDocuments = documents.filter((doc) => doc.status === "uploaded" || doc.status === "verified")
  const progress = Math.round((uploadedDocuments.length / totalDocuments) * 100)

  // Check if at least one document is uploaded to enable the proceed button
  const canProceed = uploadedDocuments.length > 0

  // Get document counts by category
  const personalDocs = documents.filter((doc) => doc.category === "personal")
  const financialDocs = documents.filter((doc) => doc.category === "financial")
  const propertyDocs = documents.filter((doc) => doc.category === "property")

  return (
    <div className="container mx-auto flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - document upload area */}
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-8rem)] flex flex-col">
            <CardHeader>
              <CardTitle>Document Preparation</CardTitle>
              <CardDescription>Upload your documents for your mortgage application</CardDescription>
            </CardHeader>

            <Tabs defaultValue="personal" className="flex-1 flex flex-col">
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="property">Property</TabsTrigger>
                </TabsList>
              </div>

              <CardContent className="flex-1 overflow-y-auto pt-4">
                <TabsContent value="personal" className="mt-0 space-y-4">
                  {personalDocs.map((doc) => (
                    <DocumentUploadItem key={doc.id} document={doc} onFileUpload={handleFileUpload} />
                  ))}
                </TabsContent>

                <TabsContent value="financial" className="mt-0 space-y-4">
                  {financialDocs.map((doc) => (
                    <DocumentUploadItem key={doc.id} document={doc} onFileUpload={handleFileUpload} />
                  ))}
                </TabsContent>

                <TabsContent value="property" className="mt-0 space-y-4">
                  {propertyDocs.map((doc) => (
                    <DocumentUploadItem key={doc.id} document={doc} onFileUpload={handleFileUpload} />
                  ))}
                </TabsContent>
              </CardContent>
            </Tabs>

            <CardFooter className="border-t p-4">
              <Button
                onClick={onProceedToNextStep}
                className="w-full bg-black hover:bg-white hover:text-black hover:border hover:border-black text-white rounded-none transition-colors flex items-center justify-center gap-2"
                disabled={!canProceed}
              >
                {!canProceed ? "Please Upload At Least One Document" : "Proceed to Bank Contact"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar - progress and Document Assistant */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Progress</CardTitle>
              <CardDescription>
                {uploadedDocuments.length} of {totalDocuments} documents uploaded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-2" />
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <div className="font-medium">
                    {personalDocs.filter((d) => d.status !== "pending").length}/{personalDocs.length}
                  </div>
                  <div className="text-muted-foreground">Personal</div>
                </div>
                <div>
                  <div className="font-medium">
                    {financialDocs.filter((d) => d.status !== "pending").length}/{financialDocs.length}
                  </div>
                  <div className="text-muted-foreground">Financial</div>
                </div>
                <div>
                  <div className="font-medium">
                    {propertyDocs.filter((d) => d.status !== "pending").length}/{propertyDocs.length}
                  </div>
                  <div className="text-muted-foreground">Property</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Assistant chatbot */}
          <div className="h-[calc(100vh-20rem)]">
            <DocumentAssistant />
          </div>
        </div>
      </div>
    </div>
  )
}

// Document upload item component
interface DocumentUploadItemProps {
  document: DocumentRequirement
  onFileUpload: (documentId: string, e: React.ChangeEvent<HTMLInputElement>) => void
}

function DocumentUploadItem({ document, onFileUpload }: DocumentUploadItemProps) {
  // Generate a unique ID for the file input
  const inputId = `file-upload-${document.id}`

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{document.name}</span>
          {document.required && (
            <Badge variant="outline" className="text-xs">
              Required
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{document.description}</p>
      </div>

      <div className="flex items-center gap-2">
        <DocumentStatus status={document.status} />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <label htmlFor={inputId} className="cursor-pointer">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm ${
                    document.status === "uploaded" || document.status === "verified"
                      ? "bg-muted text-muted-foreground hover:bg-gray-300"
                      : "bg-black hover:bg-white hover:text-black hover:border hover:border-black text-white rounded-none transition-colors"
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  {document.status === "uploaded" || document.status === "verified" ? "Replace" : "Upload"}
                </div>
              </label>
            </TooltipTrigger>
            <TooltipContent>
              {document.status === "uploaded" || document.status === "verified"
                ? "Replace uploaded document"
                : "Upload document"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <input
          type="file"
          id={inputId}
          className="hidden"
          onChange={(e) => onFileUpload(document.id, e)}
          accept=".pdf,.jpg,.jpeg,.png"
        />
      </div>
    </div>
  )
}

// Document status component
function DocumentStatus({ status }: { status: DocumentRequirement["status"] }) {
  switch (status) {
    case "uploaded":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <Upload className="h-3 w-3 mr-1" />
          Uploaded
        </Badge>
      )
    case "verified":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Pending
        </Badge>
      )
  }
}
