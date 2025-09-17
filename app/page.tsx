"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Download, FileText, ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react"

// PDF.js types
declare global {
  interface Window {
    pdfjsLib: any
  }
}

interface ConvertedImage {
  dataUrl: string
  pageNumber: number
  filename: string
}

export default function PDFToImageConverter() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load PDF.js library
  const loadPDFJS = useCallback(async () => {
    if (window.pdfjsLib) return window.pdfjsLib

    return new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
        resolve(window.pdfjsLib)
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }, [])

  // Convert PDF to images
  const convertPDFToImages = useCallback(
    async (file: File) => {
      try {
        setIsProcessing(true)
        setProgress(0)
        setError(null)
        setConvertedImages([])
        setFileName(file.name.replace(".pdf", ""))

        const pdfjsLib = await loadPDFJS()
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const numPages = pdf.numPages
        const images: ConvertedImage[] = []

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          const scale = 2.0 // Higher scale for better quality
          const viewport = page.getViewport({ scale })

          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d")
          canvas.height = viewport.height
          canvas.width = viewport.width

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          }

          await page.render(renderContext).promise

          const dataUrl = canvas.toDataURL("image/png", 0.95)
          const filename = `${fileName}_page_${pageNum}.png`

          images.push({
            dataUrl,
            pageNumber: pageNum,
            filename,
          })

          setProgress((pageNum / numPages) * 100)
        }

        setConvertedImages(images)
      } catch (err) {
        setError("Failed to convert PDF. Please ensure the file is a valid PDF.")
        console.error("PDF conversion error:", err)
      } finally {
        setIsProcessing(false)
      }
    },
    [fileName, loadPDFJS],
  )

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf") {
        setError("Please select a valid PDF file.")
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        setError("File size must be less than 50MB.")
        return
      }

      convertPDFToImages(file)
    },
    [convertPDFToImages],
  )

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect],
  )

  // File input handler
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect],
  )

  // Download single image
  const downloadImage = useCallback((image: ConvertedImage) => {
    const link = document.createElement("a")
    link.href = image.dataUrl
    link.download = image.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  // Download all images as ZIP (simplified - downloads individually)
  const downloadAllImages = useCallback(() => {
    convertedImages.forEach((image, index) => {
      setTimeout(() => {
        downloadImage(image)
      }, index * 100) // Stagger downloads
    })
  }, [convertedImages, downloadImage])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">PDF to Image Converter</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Convert your PDF files to high-quality images instantly. All processing happens in your browser - your files
            never leave your device.
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
                isDragOver
                  ? "border-accent bg-accent/5 scale-[1.02]"
                  : "border-border hover:border-accent/50 hover:bg-accent/5"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className={`p-4 rounded-full ${isDragOver ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {isDragOver ? "Drop your PDF here" : "Drag & drop your PDF here"}
                  </h3>
                  <p className="text-muted-foreground mb-4">or click to browse files</p>
                  <Button variant="outline" className="pointer-events-none bg-transparent">
                    <FileText className="w-4 h-4 mr-2" />
                    Select PDF File
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Supports PDF files up to 50MB</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Processing State */}
        {isProcessing && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                <span className="text-foreground font-medium">Converting your PDF to images...</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}% complete</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {convertedImages.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="text-xl font-semibold text-foreground">Conversion Complete</h3>
                </div>
                <Button onClick={downloadAllImages} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download All ({convertedImages.length})
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {convertedImages.map((image) => (
                  <div
                    key={image.pageNumber}
                    className="group relative bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-[3/4] bg-muted flex items-center justify-center">
                      <img
                        src={image.dataUrl || "/placeholder.svg"}
                        alt={`Page ${image.pageNumber}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-card-foreground">Page {image.pageNumber}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => downloadImage(image)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Your files are processed locally in your browser. No data is sent to any server.</p>
        </div>
      </div>
    </div>
  )
}
