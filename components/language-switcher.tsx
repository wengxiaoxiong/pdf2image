"use client"

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLanguage = (newLocale: string) => {
    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    // Navigate to the new locale
    router.push(`/${newLocale}${pathWithoutLocale}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      <Button
        variant={locale === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchLanguage('en')}
        className={locale === 'en' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0' : ''}
      >
        EN
      </Button>
      <Button
        variant={locale === 'zh' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchLanguage('zh')}
        className={locale === 'zh' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0' : ''}
      >
        中文
      </Button>
    </div>
  )
}