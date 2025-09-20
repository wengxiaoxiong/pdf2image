"use client"

import React, { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react"
import Tesseract from 'tesseract.js'

interface OCRTextExtractorProps {
  imageDataUrl: string
  pageNumber: number
  onTextExtracted?: (text: string) => void
}

export default function OCRTextExtractor({ 
  imageDataUrl, 
  pageNumber, 
  onTextExtracted 
}: OCRTextExtractorProps) {
  const t = useTranslations()
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedText, setExtractedText] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [showText, setShowText] = useState(false)
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState(0)

  const extractText = useCallback(async () => {
    if (!imageDataUrl) return

    try {
      setIsExtracting(true)
      setError(null)
      setProgress(0)

      // 使用 Tesseract.js 进行 OCR 识别
      // 支持中英文混合识别
      const result = await Tesseract.recognize(
        imageDataUrl,
        'chi_sim+eng', // 中文简体 + 英文
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
          }
        }
      )

      const text = result.data.text.trim()
      setExtractedText(text)
      setShowText(true)
      
      if (onTextExtracted) {
        onTextExtracted(text)
      }
    } catch (err) {
      console.error('OCR extraction error:', err)
      setError(t('errors.ocrFailed'))
    } finally {
      setIsExtracting(false)
      setProgress(0)
    }
  }, [imageDataUrl, onTextExtracted])

  const copyToClipboard = useCallback(async () => {
    if (!extractedText) return

    try {
      await navigator.clipboard.writeText(extractedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
      // 降级方案：使用传统的复制方法
      const textArea = document.createElement('textarea')
      textArea.value = extractedText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [extractedText])

  const clearText = useCallback(() => {
    setExtractedText('')
    setShowText(false)
    setError(null)
  }, [])

  return (
    <div className="space-y-3">
      {/* 提取按钮 */}
      <Button
        onClick={extractText}
        disabled={isExtracting}
        size="sm"
        variant="outline"
        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white border-0 hover:from-green-600 hover:to-green-700 disabled:opacity-50"
      >
        {isExtracting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t('ocr.extracting')} {progress}%
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 mr-2" />
            {t('ocr.extractText')}
          </>
        )}
      </Button>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 提取的文字内容 */}
      {extractedText && (
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-green-700 dark:text-green-300">
                {t('ocr.extractedText', { number: pageNumber })}
              </h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowText(!showText)}
                  className="h-8 w-8 p-0"
                  title={showText ? t('ocr.hideText') : t('ocr.showText')}
                >
                  {showText ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyToClipboard}
                  className="h-8 w-8 p-0"
                  title={t('ocr.copy')}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {showText && (
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                    {extractedText}
                  </pre>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span>{t('ocr.characterCount', { count: extractedText.length })}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearText}
                    className="h-6 px-2 text-xs"
                  >
                    {t('ocr.clear')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}