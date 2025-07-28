import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { StoreProductCategory, StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

// ISR: Revalida cada 8 horas (las categorías cambian ocasionalmente)
export const revalidate = 28800

type Props = {
  params: { category: string[]; countryCode: string }
  searchParams: {
    sortBy?: SortOptions
    page?: string
    // Agregar los nuevos parámetros de filtro de precio
    minPrice?: string
    maxPrice?: string
    [key: string]: string | string[] | undefined
  }
}

export async function generateStaticParams() {
  try {
    // Solo genera páginas para tus mercados principales
    const mainCountries = ['es', 'fr', 'de', 'it', 'pt'] // Ajusta según tus mercados
    
    const product_categories = await listCategories()

    if (!product_categories) {
      return []
    }

    // Limita a las categorías principales (primeras 10)
    const topCategories = product_categories.slice(0, 10)
    
    // Genera combinaciones solo para categorías principales y países principales
    const staticParams = mainCountries.map((countryCode: string) =>
      topCategories.map((category: any) => ({
        countryCode,
        category: [category.handle],
      }))
    ).flat()

    console.log(`Generando ${staticParams.length} páginas de categorías estáticas en build time`)
    return staticParams

  } catch (error) {
    console.error('Error generando static params para categorías:', error)
    return [] // Si falla, no genera ninguna página en build time
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { product_categories } = await getCategoryByHandle(
      params.category
    )

    const title = product_categories
      .map((category: StoreProductCategory) => category.name)
      .join(" | ")

    const description =
      product_categories[product_categories.length - 1].description ??
      `${title} category.`

    return {
      title: `${title} | MyUrbanScoot`,
      description,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { sortBy, page } = searchParams

  const { product_categories } = await getCategoryByHandle(
    params.category
  )



  if (!product_categories) {
    notFound()
  }

  return (
    <CategoryTemplate
      categories={product_categories}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      searchParams={searchParams}
    />
  )
}