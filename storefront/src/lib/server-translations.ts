// src/lib/server-translations.ts
import { readFileSync } from 'fs'
import path from 'path'

type Translations = Record<string, any>

export async function getServerTranslations(locale: string, namespace = 'common'): Promise<Translations> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'locales', locale, `${namespace}.json`)
    const fileContent = readFileSync(filePath, 'utf8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error(`Error loading translations for ${locale}:`, error)
    return {}
  }
}

export function createTranslationFunction(translations: Translations) {
  return (key: string, fallback?: string): string => {
    const keys = key.split('.')
    let value = translations
    
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) break
    }
    
    return typeof value === 'string' ? value : fallback || key
  }
}