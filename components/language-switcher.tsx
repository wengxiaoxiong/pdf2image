"use client"

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  
  // Extract current locale from pathname
  const currentLocale = pathname.split('/')[1] || 'en'

  const switchLanguage = (newLocale: string) => {
    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/'
    // Navigate to the new locale
    router.push(`/${newLocale}${pathWithoutLocale}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      <Button
        variant={currentLocale === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchLanguage('en')}
        className={currentLocale === 'en' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0' : ''}
      >
        EN
      </Button>
      <Button
        variant={currentLocale === 'zh' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchLanguage('zh')}
        className={currentLocale === 'zh' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0' : ''}
      >
        中文
      </Button>
    </div>
  )
}