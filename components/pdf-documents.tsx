"use client"

import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const documents = [
  {
    title: "Allmänna villkor",
    description: "Våra fullständiga villkor för flyttjänster och tilläggstjänster",
    path: "/pdfs/allmanna-villkor.pdf",
  },
  {
    title: "Flyttstädning – 40-punktslista",
    description: "Detaljerad checklista över vad som ingår i vår flyttstädning",
    path: "/pdfs/flyttstadning-checklista.pdf",
  },
  {
    title: "Tilläggstjänster & Priser",
    description: "Komplett översikt över våra tilläggstjänster och priser",
    path: "/pdfs/tillaggstjanster.pdf",
  },
]

export function PdfDocuments() {
  const handleOpenPdf = (path: string) => {
    window.open(path, "_blank")
  }

  const handleDownloadPdf = (path: string) => {
    const link = document.createElement("a")
    link.href = path
    link.download = path.split("/").pop() || "document.pdf"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {documents.map((doc, index) => (
        <Card 
          key={index}
          className="p-4 bg-white flex flex-col"
        >
          <div className="flex items-start mb-4">
            <div className="bg-blue-50 p-2 rounded-full mr-3">
              <FileText className="w-5 h-5 text-[#002A5C]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-[#002A5C] mb-1">
                {doc.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {doc.description}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-auto">
            <Button
              variant="outline"
              className="flex-1 border-[#002A5C] text-[#002A5C] hover:bg-blue-50"
              onClick={() => handleOpenPdf(doc.path)}
            >
              Läs PDF
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-[#002A5C] text-[#002A5C] hover:bg-blue-50"
              onClick={() => handleDownloadPdf(doc.path)}
            >
              Ladda ner
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
} 