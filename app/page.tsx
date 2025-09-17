"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Download, FileText, ImageIcon, AlertCircle, CheckCircle2, Link, Settings } from "lucide-react"
// HeroUI components temporarily disabled due to import issues
// import { 
//   Button as HeroButton, 
//   Card as HeroCard, 
//   CardBody, 
//   CardHeader,
//   Progress as HeroProgress,
//   Modal,
//   ModalContent,
//   ModalHeader,
//   ModalBody,
//   ModalFooter,
//   useDisclosure,
//   Input
// } from "@heroui/react"

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
  const [downloadPath, setDownloadPath] = useState<string>("")
  const [showSettings, setShowSettings] = useState(false)
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
    link.download = downloadPath ? `${downloadPath}/${image.filename}` : image.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [downloadPath])

  // Download all images as ZIP (simplified - downloads individually)
  const downloadAllImages = useCallback(() => {
    convertedImages.forEach((image, index) => {
      setTimeout(() => {
        downloadImage(image)
      }, index * 100) // Stagger downloads
    })
  }, [convertedImages, downloadImage])

  // Save download path to localStorage
  const saveDownloadPath = useCallback((path: string) => {
    setDownloadPath(path)
    localStorage.setItem('pdfConverter_downloadPath', path)
  }, [])

  // Load download path from localStorage on component mount
  useEffect(() => {
    const savedPath = localStorage.getItem('pdfConverter_downloadPath')
    if (savedPath) {
      setDownloadPath(savedPath)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <FileText className="w-4 h-4" />
            PDF Converter Tool
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6 text-balance">
            PDF to Image Converter
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 text-pretty max-w-3xl mx-auto leading-relaxed">
            Convert your PDF files to high-quality images instantly. All processing happens in your browser - your files
            never leave your device. Fast, secure, and completely free.
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
            >
              <Settings className="w-4 h-4 mr-2" />
              Download Settings
            </Button>
            {downloadPath && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Save to: {downloadPath}
              </div>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-12">
            <div
              className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 cursor-pointer ${
                isDragOver
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02] shadow-lg"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-6">
                <div
                  className={`p-6 rounded-full transition-all duration-300 ${
                    isDragOver 
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-110" 
                      : "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <Upload className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                    {isDragOver ? "Drop your PDF here" : "Drag & drop your PDF here"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">or click to browse files</p>
                  <Button
                    variant="outline"
                    size="lg"
                    className="pointer-events-none bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Select PDF File
                  </Button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full">
                  Supports PDF files up to 50MB
                </p>
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
          <Card className="mb-8 shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent"></div>
                <span className="text-xl font-semibold text-gray-800 dark:text-gray-200">Converting your PDF to images...</span>
              </div>
              <Progress 
                value={progress} 
                className="w-full mb-4 h-3"
              />
              <p className="text-lg text-gray-600 dark:text-gray-400 text-center font-medium">
                {Math.round(progress)}% complete
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {convertedImages.length > 0 && (
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Conversion Complete</h3>
                </div>
                <Button 
                  size="lg"
                  onClick={downloadAllImages} 
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 hover:from-green-600 hover:to-green-700"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download All ({convertedImages.length})
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {convertedImages.map((image) => (
                  <div
                    key={image.pageNumber}
                    className="group relative bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                      <img
                        src={image.dataUrl || "/placeholder.svg"}
                        alt={`Page ${image.pageNumber}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Page {image.pageNumber}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(image)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Friendship Links */}
        <Card className="mt-12 shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">友情链接 / Friendship Links</h3>
            </div>
            <div className="flex justify-center gap-8">
              <a 
                href="https://wengxiaoxiong.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-300 hover:scale-105"
              >
                <Link className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  wengxiaoxiong.com
                </span>
              </a>
              <a 
                href="https://bear-agent.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 hover:from-green-100 hover:to-blue-100 dark:hover:from-green-900/30 dark:hover:to-blue-900/30 transition-all duration-300 hover:scale-105"
              >
                <Link className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  bear-agent.com
                </span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-600 dark:text-gray-400">
          <p>Your files are processed locally in your browser. No data is sent to any server.</p>
        </div>
      </div>

      {/* Download Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Download Settings</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure your download preferences
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Download Path (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter folder name for downloads"
                    value={downloadPath}
                    onChange={(e) => setDownloadPath(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This will be used as a prefix for downloaded file names
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Due to browser security restrictions, we cannot directly set the download location. 
                    The path you specify will be used as a prefix for the filename. 
                    You can change your browser's default download location in your browser settings.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    saveDownloadPath(downloadPath)
                    setShowSettings(false)
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
