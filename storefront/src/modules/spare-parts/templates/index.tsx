"use client"

import { useState, useEffect } from "react"
import { HttpTypes, StoreProduct } from "@medusajs/types"
import { Checkbox } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { addToCart } from "@lib/data/cart"

interface SparePartsTemplateProps {
  products: HttpTypes.StoreProduct[]
  collections: HttpTypes.StoreCollection[]
  categories: HttpTypes.StoreProductCategory[]
  countryCode: string
}

export default function SparePartsTemplate({
  products,
  collections,
  categories,
  countryCode,
}: SparePartsTemplateProps) {
  const [filteredProducts, setFilteredProducts] =
    useState<HttpTypes.StoreProduct[]>(products)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()

  console.log("PRODUCTOS ", products)

  // Filtrar productos cuando cambien los filtros
  useEffect(() => {
    filterProducts()
  }, [selectedCategory, selectedBrands, products])

  const getFirstAvailableVariant = (
    product: HttpTypes.StoreProduct
  ): string | null => {
    if (!product.variants || product.variants.length === 0) {
      return null
    }

    const availableVariant = product.variants.find(
      (variant) =>
        variant.manage_inventory === false ||
        (variant.inventory_quantity && variant.inventory_quantity > 0)
    )

    return availableVariant?.id || product.variants[0]?.id || null
  }

  const handleAddToCart = async (product: HttpTypes.StoreProduct) => {
    const variantId = getFirstAvailableVariant(product)

    if (!variantId) {
      console.error("No variant available for product:", product.title)
      return
    }

    try {
      await addToCart({
        variantId,
        quantity: 1,
        countryCode,
      })
      console.log("Product added to cart successfully")
    } catch (e) {
      console.error("Error adding to cart in Spare Parts", e)
    }
  }

  const onCategoryChange = (categoryId: string) => {
    const next = new URLSearchParams(params.toString())
    if (categoryId) next.set("category", categoryId)
    else next.delete("category")

    // Usar replace con scroll: false para evitar scroll automático
    router.replace(`/${countryCode}/spare-parts?${next.toString()}`, {
      scroll: false,
    })
  }

  const getProductPrice = (product: HttpTypes.StoreProduct): number | null => {
    // Verificar que existan variants
    if (!product.variants || product.variants.length === 0) {
      return null
    }

    const variant = product.variants[0]

    // Verificar que exista calculated_price y calculated_amount
    if (!variant.calculated_price?.calculated_amount) {
      return null
    }

    // Verificar que calculated_amount sea un número
    const amount = variant.calculated_price.calculated_amount
    if (typeof amount !== "number") {
      return null
    }

    return amount
  }

  const filterProducts = () => {
    let filtered = products

    // ——— Filtro por categoría ———
    if (selectedCategory) {
      filtered = filtered.filter((product) =>
        product.categories?.some((cat) => cat.id === selectedCategory)
      )
    }

    // ——— Filtro por marcas/colecciones ———
    if (selectedBrands.length > 0) {
      filtered = filtered.filter((product) => {
        // 1) Si es universal, siempre lo incluimos
        if (product.metadata?.is_universal) {
          return true
        }

        // 2) Si pertenece directamente a la colección
        const inCollection = selectedBrands.includes(
          product.collection_id || ""
        )

        // 3) Si es compatible según metadata.compatible_brands
        // Primero aseguramos que compatible_brands sea un array:
        let compatArr: string[] = []
        const raw = product.metadata?.compatible_brands
        if (Array.isArray(raw)) {
          compatArr = raw
        } else if (typeof raw === "string") {
          try {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
              compatArr = parsed
            }
          } catch {
            // si falló JSON.parse, podrías splitear raw.split(",")
            compatArr = raw
              .replace(/[\[\]\s"]/g, "")
              .split(",")
              .filter(Boolean)
          }
        }

        // Como compatArr contiene handles (p.ej. "dualtron"), mapeamos
        // selectedBrands (que son IDs) a sus handles vía collections:
        const selectedHandles = selectedBrands
          .map((id) => {
            const col = collections.find((c) => c.id === id)
            return col?.handle
          })
          .filter((h): h is string => Boolean(h))

        const isCompatible = selectedHandles.some((h) => compatArr.includes(h))

        return inCollection || isCompatible
      })
    }

    setFilteredProducts(filtered)
  }

  const handleBrandChange = (brandId: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands((prev) => [...prev, brandId])
    } else {
      setSelectedBrands((prev) => prev.filter((id) => id !== brandId))
    }
  }

  const resetFilters = () => {
    setSelectedCategory("")
    setSelectedBrands([])
  }

  return (
    <div className="content-container py-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-ui-fg-base mb-4">
          Repuestos y Accesorios
        </h1>
        <p className="text-ui-fg-subtle max-w-2xl mx-auto">
          Encuentra los mejores repuestos para tu patinete eléctrico. Filtra por
          categoría y marca para encontrar exactamente lo que necesitas.
        </p>
      </div>
      {/* Filtro por categoría */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Categoría</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Opción "Todas" */}
          <label
            className={`
          cursor-pointer bg-white border rounded-lg p-4 flex flex-col items-center transition-shadow
          ${
            !params.get("category")
              ? "shadow-lg ring-2 ring-mysGreen-100 border-transparent"
              : "hover:shadow-md border-gray-200"
          }
        `}
            htmlFor="cat_all"
          >
            <input
              id="cat_all"
              type="radio"
              name="category"
              value=""
              className="sr-only peer"
              checked={!params.get("category")}
              onChange={() => onCategoryChange("")}
            />

            <img
              className="w-full h-40 object-cover mb-2"
              src="https://myurbanscoot.com/wp-content/uploads/2021/11/KIT-AMORTIGUADOR-MONORIM-PINZA-DE-FRENO-XTECH-KIT-DE-1022-400x400.jpg"
            />
            <span className="text-sm">Todas</span>
          </label>

          {categories.map((cat) => {
            const isSelected = params.get("category") === cat.id
            return (
              <label
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`
              cursor-pointer bg-white border rounded-lg p-4 flex flex-col items-center transition-shadow
              ${
                isSelected
                  ? "shadow-lg ring-2 ring-mysGreen-100 border-transparent"
                  : "hover:shadow-md border-gray-200"
              }
            `}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.id}
                  className="sr-only"
                  checked={isSelected}
                  onChange={() => {}}
                />
                <img
                  src={cat.metadata?.image as string}
                  alt={cat.name}
                  className="w-full h-40 object-cover mb-2"
                />
                <span className="text-sm text-center">{cat.name}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de filtros */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-6 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filtros</h3>
              <button
                onClick={resetFilters}
                className="text-sm text-ui-fg-interactive hover:underline"
              >
                Limpiar
              </button>
            </div>

            {/* Filtro por marcas */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Marcas</h4>
              <div className="space-y-2">
                {collections.map((collection) => (
                  <label
                    key={collection.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedBrands.includes(collection.id)}
                      onCheckedChange={(checked) =>
                        handleBrandChange(collection.id, !!checked)
                      }
                    />
                    <span className="text-sm">{collection.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mostrar filtros activos */}
            {(selectedCategory || selectedBrands.length > 0) && (
              <div className="pt-4 border-t">
                <h5 className="text-sm font-medium mb-2">Filtros activos:</h5>
                <div className="space-y-1 text-xs text-ui-fg-subtle">
                  {selectedCategory && (
                    <div>
                      Categoría:{" "}
                      {categories.find((c) => c.id === selectedCategory)?.name}
                    </div>
                  )}
                  {selectedBrands.length > 0 && (
                    <div>Marcas: {selectedBrands.length}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-ui-fg-subtle">
              {loading && "Cargando..."}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-ui-fg-subtle mb-4">
                No se encontraron productos con los filtros seleccionados
              </p>
              <button
                onClick={resetFilters}
                className="text-ui-fg-interactive hover:underline"
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Imagen del producto */}
                  <div className="aspect-square p-4">
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ui-fg-subtle">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="p-4">
                    <h3 className="font-medium mb-2 line-clamp-2">
                      {product.title}
                    </h3>

                    {/* Precio con manejo seguro */}

                    {/* @ts-ignore */}
                    {(() => {
                      const price = getProductPrice(product)
                      if (price !== null) {
                        return (
                          <div className="text-lg font-semibold text-ui-fg-base mb-2">
                            {price}€
                          </div>
                        )
                      }
                      return null
                    })()}

                    {/* Metadata de compatibilidad */}
                    {product.metadata?.compatible_brands && (
                      <div className="text-xs text-ui-fg-subtle mb-3">
                        Compatible:{" "}
                        {(() => {
                          const raw = product.metadata.compatible_brands
                          let brands: string[] = []

                          if (Array.isArray(raw)) {
                            brands = raw
                          } else if (typeof raw === "string") {
                            try {
                              // parseamos JSON
                              const parsed = JSON.parse(raw)
                              if (Array.isArray(parsed)) {
                                brands = parsed
                              } else {
                                // si no es array tras parsear, lo separamos por comas
                                brands = parsed
                                  .toString()
                                  .split(",")
                                  .map((s: any) => s.trim())
                              }
                            } catch {
                              // fallback: separa por comas
                              brands = raw
                                .split(",")
                                .map((s) => s.replace(/[\[\]\s"]/g, "").trim())
                                .filter(Boolean)
                            }
                          } else {
                            // otro tipo (número, objeto…), convertimos a string
                            brands = String(raw)
                              .split(",")
                              .map((s) => s.trim())
                          }

                          return brands.join(", ")
                        })()}
                      </div>
                    )}

                    {/* Categoría y colección */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.categories?.map((cat) => (
                        <span
                          key={cat.id}
                          className="text-xs bg-ui-bg-base rounded px-2 py-1"
                        >
                          {cat.name}
                        </span>
                      ))}
                      {product.collection && (
                        <span className="text-xs bg-ui-tag-blue-bg text-ui-tag-blue-text rounded px-2 py-1">
                          {product.collection.title}
                        </span>
                      )}
                    </div>

                    {/* Botón de acción */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-ui-bg-interactive text-ui-fg-on-color py-2 rounded hover:bg-ui-bg-interactive-hover transition-colors"
                      >
                        Add to Cart
                      </button>
                      <LocalizedClientLink href={`/producto/${product.handle}`}>
                        <button className="w-full bg-ui-bg-interactive text-ui-fg-on-color py-2 rounded hover:bg-ui-bg-interactive-hover transition-colors">
                          Ver detalles
                        </button>
                      </LocalizedClientLink>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
