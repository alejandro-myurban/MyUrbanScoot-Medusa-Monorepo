import { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getCollectionByHandle,
  getCollectionsList,
} from "@lib/data/collections"
import { listRegions } from "@lib/data/regions"
import { StoreCollection, StoreRegion } from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

// ISR: Revalida cada 12 horas (las colecciones cambian menos frecuentemente)
export const revalidate = 43200

type Props = {
  params: { handle: string; countryCode: string }
  searchParams: {
    page?: string
    sortBy?: SortOptions
  }
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  try {
    // Solo genera páginas para tus mercados principales
    const mainCountries = ['es', 'fr', 'de', 'it', 'pt'] // Ajusta según tus mercados
    
    const { collections } = await getCollectionsList()

    if (!collections) {
      return []
    }

    // Limita a las colecciones más importantes (primeras 8)
    const topCollections = collections.slice(0, 8)
    
    // Genera combinaciones solo para colecciones principales y países principales
    const staticParams = mainCountries.map((countryCode: string) =>
      topCollections.map((collection: StoreCollection) => ({
        countryCode,
        handle: collection.handle,
      }))
    ).flat()

    console.log(`Generando ${staticParams.length} páginas de colecciones estáticas en build time`)
    return staticParams

  } catch (error) {
    console.error('Error generando static params para colecciones:', error)
    return [] // Si falla, no genera ninguna página en build time
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  const metadata = {
    title: `${collection.title} | Medusa Store`,
    description: `${collection.title} collection`,
  } as Metadata

  return metadata
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { sortBy, page } = searchParams

  const collection = await getCollectionByHandle(params.handle).then(
    (collection: StoreCollection) => collection
  )

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
    />
  )
}
