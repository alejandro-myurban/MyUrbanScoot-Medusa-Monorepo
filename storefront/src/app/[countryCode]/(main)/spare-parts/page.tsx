import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCategoriesList } from "@lib/data/categories"
import { getProductsList } from "@lib/data/products"
import { getCollectionsList } from "@lib/data/collections"
import SparePartsTemplate from "@modules/spare-parts/templates"

type Props = {
  params: { countryCode: string }
  searchParams: {
    category?: string
    collection?: string
    page?: string
  }
}

export const metadata: Metadata = {
  title: "Repuestos y Accesorios | Tu Tienda",
  description:
    "Encuentra los mejores repuestos y accesorios para tu patinete eléctrico. Ruedas, baterías, frenos y más.",
  keywords:
    "repuestos, patinete eléctrico, ruedas, baterías, accesorios, dualtron, smartgyro",
}

export default async function SparePartsPage({ params, searchParams }: Props) {
  const { countryCode } = params
  const { category, collection, page = "1" } = searchParams

  // Validar país
  if (!countryCode || countryCode.length !== 2) {
    notFound()
  }

  try {
    // 1) Obtener categorías y colecciones
    const [categoriesData, collectionsData] = await Promise.all([
      getCategoriesList(0, 100).catch(() => ({ product_categories: [] })),
      getCollectionsList(0, 100).catch(() => ({ collections: [] })),
    ])

    const categories = categoriesData.product_categories || []
    const collections = collectionsData.collections || []

    console.log("CATS", categories)
    // Filtrar solo categorías relacionadas con repuestos
    const sparePartsCategories = categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes("rueda") ||
        cat.name.toLowerCase().includes("baterías y cargadores") ||
        cat.name.toLowerCase().includes("frenos") ||
        cat.name.toLowerCase().includes("repuesto") ||
        cat.name.toLowerCase().includes("suspensión") ||
        cat.name.toLowerCase().includes("dirección") ||
        cat.name.toLowerCase().includes("chasis") ||
        cat.name.toLowerCase().includes("molduras") ||
        cat.name.toLowerCase().includes("tornillería") ||
        cat.name.toLowerCase().includes("seguridad") ||
        cat.name.toLowerCase().includes("kits") ||
        cat.name.toLowerCase().includes("motores") 
    )

    const defaultCategoryIds =
      sparePartsCategories.length > 0
        ? sparePartsCategories.map((c) => c.id)
        : []

    // 2) Obtener productos con filtros:
    // - Si el usuario seleccionó category, usar ese filtro
    // - Si no, aplicar filtro por las categorías de repuestos
    // - Si hay una colección, aplicar también
    const queryParams: Record<string, any> = { limit: 50 }
    if (category) {
      queryParams.category_id = [category]
    } else if (defaultCategoryIds.length > 0) {
      queryParams.category_id = defaultCategoryIds
    }
    if (collection) {
      queryParams.collection_id = [collection]
    }

    const productsData = await getProductsList({
      countryCode,
      pageParam: parseInt(page, 10),
      queryParams,
    }).catch(() => ({ response: { products: [], count: 0 } }))

    const products = productsData.response?.products || []

    return (
      <SparePartsTemplate
        products={products}
        collections={collections}
        categories={
          sparePartsCategories.length > 0 ? sparePartsCategories : categories
        }
        countryCode={countryCode}
      />
    )
  } catch (error) {
    console.error("Error loading spare parts page:", error)

    // Página de error amigable
    return (
      <div className="content-container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Error al cargar repuestos</h1>
        <p className="text-ui-fg-subtle mb-6">
          Ha ocurrido un error al cargar los productos. Por favor, inténtalo de
          nuevo.
        </p>
        <a
          href={`/${countryCode}`}
          className="bg-ui-bg-interactive text-ui-fg-on-color px-6 py-3 rounded hover:bg-ui-bg-interactive-hover transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    )
  }
}
