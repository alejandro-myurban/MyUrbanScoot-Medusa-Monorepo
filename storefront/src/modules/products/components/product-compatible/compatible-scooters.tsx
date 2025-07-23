import { Heading } from "@medusajs/ui"
import { sdk } from "@lib/config"
import type { HttpTypes } from "@medusajs/types"
import { Suspense } from "react"
import CompatibleScootersClient from "./compatible-scootets-client"
import CompatibleScootersFallback from "./compatible-scooters-fallback"

interface CompatibleScootersProps {
  regionId?: string
}

export default async function CompatibleScooters({ regionId }: CompatibleScootersProps) {
  let products: HttpTypes.StoreProduct[] = []

  const categoryId = "pcat_01JXAM4TK7WAFY33A6JQS25VJS" 

  console.log(`[CompatibleScooters] 🔎 Buscando productos para category_id: "${categoryId}"`)

  if (!sdk?.store?.product) {
    console.error("[CompatibleScooters] ❌ sdk.store.products no está definido.")
    return (
      <div className="container mx-auto px-4 py-8">
        <Heading level="h2" className="text-2xl font-bold text-gray-800 mb-6">
          Modelos Compatibles de Patinetes
        </Heading>
        <p className="text-red-600">Error al cargar productos. Verifica la configuración del SDK.</p>
      </div>
    )
  }

  try {
    const { products: fetchedProducts } = await sdk.store.product.list({
      category_id: [categoryId],
      limit: 4,
    })

    products = fetchedProducts || []

    console.log(`[CompatibleScooters] ✅ Productos encontrados: ${products.length}`)
    if (products.length > 0) {
      console.log(`[CompatibleScooters] 🛴 Primer producto: ${products[0].title}`)
    }
  } catch (error) {
    console.error("[CompatibleScooters] ❌ Error al obtener productos:", error)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<CompatibleScootersFallback />}>
        <CompatibleScootersClient products={products} />
      </Suspense>
    </div>
  )
}
