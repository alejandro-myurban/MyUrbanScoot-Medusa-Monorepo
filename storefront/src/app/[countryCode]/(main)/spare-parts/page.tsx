import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCategoriesList } from "@lib/data/categories"
import { getProductsList } from "@lib/data/products"
import { getCollectionsList } from "@lib/data/collections"
import SparePartsTemplate from "@modules/spare-parts/templates"

type Props = {
  params: { countryCode: string }
  searchParams: {
    collection?: string // Ahora collection es tipo de repuesto (ruedas, frenos, etc.)
    brand?: string // Nueva: marca (categoria)
    model?: string // Nueva: modelo (subcategoria)
    page?: string
    tireSize?: string // Nuevo: tamaño de neumáticos
    tireGripType?: string // Nuevo : agarre de neumatico
    tireType?: string // Nuevo: tipo de neumatico
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
  const { 
    collection, 
    brand, 
    model, 
    page = "1", 
    tireSize, 
    tireGripType, // Desestructurar
    tireType // Desestructurar
  } = searchParams

  // Validar país
  if (!countryCode || countryCode.length !== 2) {
    notFound()
  }

  try {
    // 1) Obtener categorías (marcas) y colecciones (tipos de repuestos)
    const [categoriesData, collectionsData] = await Promise.all([
      getCategoriesList(0, 100).catch(() => ({ product_categories: [] })),
      getCollectionsList(0, 100).catch(() => ({ collections: [] })),
    ])

    const categories = categoriesData.product_categories || [] // Ahora son marcas
    const collections = collectionsData.collections || [] // Ahora son tipos de repuestos

    console.log("BRANDS (categories)", categories)
    console.log("SPARE TYPES (collections)", collections)

    // Filtrar solo colecciones relacionadas con repuestos
    const sparePartsCollections = collections.filter(
      (col) =>
        col.title.toLowerCase().includes("rueda") ||
        col.title.toLowerCase().includes("baterías") ||
        col.title.toLowerCase().includes("batería") ||
        col.title.toLowerCase().includes("cargador") ||
        col.title.toLowerCase().includes("freno") ||
        col.title.toLowerCase().includes("repuesto") ||
        col.title.toLowerCase().includes("suspensiones") ||
        col.title.toLowerCase().includes("dirección") ||
        col.title.toLowerCase().includes("chasis") ||
        col.title.toLowerCase().includes("moldura") ||
        col.title.toLowerCase().includes("tornillería") ||
        col.title.toLowerCase().includes("seguridad") ||
        col.title.toLowerCase().includes("kit") ||
        col.title.toLowerCase().includes("motor") ||
        col.title.toLowerCase().includes("neumático") ||
        col.title.toLowerCase().includes("manillar") ||
        col.title.toLowerCase().includes("luz") ||
        col.title.toLowerCase().includes("timbre")
    )

    // Encontrar la categoría "Modelos Recambios" y obtener sus hijos
    const modelosRecambiosCategory = categories.find(
      (cat) => cat.handle === "modelos" || cat.name === "Modelos Recambios"
    )

    console.log("MODELOS RECAMBIOS CATEGORY", modelosRecambiosCategory)

    // Obtener las marcas (hijos de "Modelos Recambios")
    const brandCategories = modelosRecambiosCategory?.category_children || []

    const defaultCollectionIds =
      sparePartsCollections.length > 0
        ? sparePartsCollections.map((c) => c.id)
        : []

    // 2) Obtener productos con filtros:
    const queryParams: Record<string, any> = { limit: 50 }

    // Filtro por tipo de repuesto (colección)
    if (collection) {
      queryParams.collection_id = [collection]
    } else if (defaultCollectionIds.length > 0) {
      queryParams.collection_id = defaultCollectionIds
    }

    // Filtro por marca (categoría)
    if (brand) {
      queryParams.category_id = [brand]
    }

    // Filtro por modelo (subcategoría) - necesitarás ajustar según tu API
    if (model) {
      // Esto depende de cómo manejes subcategorías en tu API
      // Podría ser algo como:
      queryParams.subcategory_id = [model]
      // O si usas metadata:
      // queryParams.metadata = { compatible_model: model }
    }

    if (tireSize){
      queryParams.tireSize = tireSize // Se pasara a getProductsList
    }
    // Añadir nuevos filtros a queryParams
    if (tireGripType) {
      queryParams.tireGripType = tireGripType;
    }
    if (tireType) {
      queryParams.tireType = tireType;
    }

    console.log("=== PAGE DEBUG ===")
    console.log(
      "All categories from API:",
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        handle: c.handle,
        parent_id: c.parent_category_id,
        children_count: c.category_children?.length || 0,
      }))
    )

    console.log(
      "Parent category (Modelos Recambios):",
      modelosRecambiosCategory
    )
    
    console.log(
      "Brand categories (children):",
      brandCategories.map((b) => ({
        id: b.id,
        name: b.name,
        handle: b.handle,
      }))
    )

    const productsData = await getProductsList({
      countryCode,
      pageParam: parseInt(page, 10),
      queryParams,
    }).catch(() => ({ response: { products: [], count: 0 } }))

    const products = productsData.response?.products || []

    return (
      <SparePartsTemplate
        products={products}
        // Ahora pasamos colecciones como tipos de repuestos
        sparePartsTypes={
          sparePartsCollections.length > 0 ? sparePartsCollections : collections
        }
        // Y categorías como marcas (hijos de "Modelos Recambios")
        brands={brandCategories}
        countryCode={countryCode}
        parentCategory={modelosRecambiosCategory}
        currentTireSize={tireSize}
        currentTireGripType={tireGripType} // Pasar la prop
        currentTireType={tireType} // Pasar la prop
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