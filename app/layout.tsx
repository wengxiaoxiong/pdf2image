import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
// import { HeroUIProvider } from '@heroui/react'
import './globals.css'

export const metadata: Metadata = {
  title: 'PDF to Image Converter - Convert PDF to High Quality Images',
  description: 'Convert your PDF files to high-quality images instantly. All processing happens in your browser - your files never leave your device.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
