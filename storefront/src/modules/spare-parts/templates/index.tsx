"use client"

import { useState, useEffect } from "react"
import { HttpTypes, StoreProduct } from "@medusajs/types"
import { Checkbox } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { addToCart } from "@lib/data/cart"
import { PriceRangeFilter } from "../components/price-filter"

interface SparePartsTemplateProps {
  products: HttpTypes.StoreProduct[]
  sparePartsTypes: HttpTypes.StoreCollection[] // Tipos de repuestos (ruedas, frenos, etc.)
  brands: HttpTypes.StoreProductCategory[] // Marcas (hijos de "Modelos Recambios")
  countryCode: string
  parentCategory?: HttpTypes.StoreProductCategory // La categoría padre "Modelos Recambios"
}

export default function SparePartsTemplate({
  products,
  sparePartsTypes,
  brands,
  countryCode,
  parentCategory,
}: SparePartsTemplateProps) {
  const [filteredProducts, setFilteredProducts] =
    useState<HttpTypes.StoreProduct[]>(products)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [selectedInches, setSelectedInches] = useState<string[]>([]) // NUEVO: filtro de pulgadas
  const [expandedBrands, setExpandedBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 500])
  const router = useRouter()
  const params = useSearchParams()

  console.log("PRODUCTOS ", products)
  console.log("TIPOS DE REPUESTOS (collections)", sparePartsTypes)
  console.log("MARCAS (hijos de Modelos Recambios)", brands)
  console.log("CATEGORIA PADRE", parentCategory)

  // NUEVO: Función para extraer pulgadas del título del producto
  const extractInchesFromTitle = (title: string): string[] => {
    // Sólo números (con coma o punto) justo antes de ''  ″ o ”
    const inchRegex = /(\d+(?:[.,]\d+)?)(?=\s*(?:''|″|”))/g

    const matches = Array.from(title.matchAll(inchRegex), (m) =>
      // Normalizar coma decimal y quedarnos sólo con el número
      m[1].replace(",", ".")
    )

    // Filtrar rango lógico y eliminar duplicados
    return Array.from(
      new Set(
        matches
          .map((n) => parseFloat(n))
          .filter((n) => n >= 4 && n <= 20)
          .map((n) => n.toString())
      )
    )
  }

  // NUEVO: Obtener todas las pulgadas disponibles en productos de ruedas
  const getAvailableInches = (): string[] => {
    const currentCollection = params.get("collection")
    const wheelCollection = sparePartsTypes.find(
      (col) =>
        col.title.toLowerCase().includes("rueda") ||
        col.title.toLowerCase().includes("wheel") ||
        col.handle?.toLowerCase().includes("rueda")
    )

    if (!wheelCollection || currentCollection !== wheelCollection.id) {
      return []
    }

    const inches = new Set<string>()

    products.forEach((product) => {
      // Solo productos que pertenezcan a la colección de ruedas
      if (
        product.collection_id === wheelCollection.id ||
        product.collection?.id === wheelCollection.id
      ) {
        const productInches = extractInchesFromTitle(product.title || "")
        productInches.forEach((inch) => inches.add(inch))
      }
    })

    return Array.from(inches).sort((a, b) => parseFloat(a) - parseFloat(b))
  }

  // NUEVO: Verificar si se debe mostrar el filtro de pulgadas
  const shouldShowInchesFilter = (): boolean => {
    const currentCollection = params.get("collection")
    const wheelCollection = sparePartsTypes.find(
      (col) =>
        col.title.toLowerCase().includes("rueda") ||
        col.title.toLowerCase().includes("wheel") ||
        col.handle?.toLowerCase().includes("rueda")
    )

    return !!(wheelCollection && currentCollection === wheelCollection.id)
  }

  // Obtener modelos por marca (subcategorías de cada marca)
  const getModelsByBrand = (brandId: string) => {
    // Buscar la marca en el array de brands y obtener sus hijos
    const brand = brands.find((b) => b.id === brandId)
    return brand?.category_children || []
  }

  useEffect(() => {
    filterProducts()
  }, [selectedBrands, selectedModels, selectedInches, products, priceRange]) // ACTUALIZADO: añadir selectedInches

  // Filtrar productos cuando cambien los filtros
  useEffect(() => {
    filterProducts()
  }, [selectedBrands, selectedModels, selectedInches, products]) // ACTUALIZADO: añadir selectedInches

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

  const handlePriceChange = (newRange: any) => {
    setPriceRange(newRange)
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

  const onCollectionChange = (collectionId: string) => {
    const next = new URLSearchParams(params.toString())
    if (collectionId) next.set("collection", collectionId)
    else next.delete("collection")

    // Limpiar filtros de marca y modelo al cambiar tipo de repuesto
    next.delete("brand")
    next.delete("model")

    router.replace(`/${countryCode}/spare-parts?${next.toString()}`, {
      scroll: false,
    })
  }

  const getProductPrice = (product: HttpTypes.StoreProduct): number | null => {
    if (!product.variants || product.variants.length === 0) {
      return null
    }

    const variant = product.variants[0]

    if (!variant.calculated_price?.calculated_amount) {
      return null
    }

    const amount = variant.calculated_price.calculated_amount
    if (typeof amount !== "number") {
      return null
    }

    return amount
  }

  // ACTUALIZADO: función de filtrado con pulgadas
  const filterProducts = () => {
    let filtered = products

    filtered = filtered.filter((product) => {
      const price = getProductPrice(product)
      if (price === null) return true
      return price >= priceRange[0] && price <= priceRange[1]
    })

    // Si hay marcas o modelos seleccionados, filtramos:
    if (selectedBrands.length > 0 || selectedModels.length > 0) {
      filtered = filtered.filter((product) => {
        const catIds = product.categories?.map((c) => c.id) || []

        // 1) Sólo productos **directamente** en la categoría padre
        const matchesBrand = selectedBrands.some((brandId) =>
          catIds.includes(brandId)
        )

        // 2) Sólo productos **directamente** en la categoría hijo
        const matchesModel = selectedModels.some((modelId) =>
          catIds.includes(modelId)
        )

        // Devolvemos sólo los que cumplan alguna de las dos
        return matchesBrand || matchesModel
      })
    }

    // NUEVO: Filtrar por pulgadas si hay alguna seleccionada
    if (selectedInches.length > 0) {
      filtered = filtered.filter((product) => {
        const productInches = extractInchesFromTitle(product.title || "")
        return selectedInches.some((inch) => productInches.includes(inch))
      })
    }

    setFilteredProducts(filtered)
  }

  const handleBrandChange = (brandId: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands((prev) => [...prev, brandId])
      setExpandedBrands((prev) => [...prev, brandId])
    } else {
      setSelectedBrands((prev) => prev.filter((id) => id !== brandId))
      // deselect todos los modelos de esa marca
      const childIds = getModelsByBrand(brandId).map((m) => m.id)
      setSelectedModels((prev) => prev.filter((id) => !childIds.includes(id)))
      setExpandedBrands((prev) => prev.filter((id) => id !== brandId))
    }
  }

  const handleModelChange = (modelId: string, checked: boolean) => {
    if (checked) {
      setSelectedModels((prev) => [...prev, modelId])
    } else {
      setSelectedModels((prev) => prev.filter((id) => id !== modelId))
    }
  }

  // NUEVO: Manejar cambios en el filtro de pulgadas
  const handleInchChange = (inch: string, checked: boolean) => {
    if (checked) {
      setSelectedInches((prev) => [...prev, inch])
    } else {
      setSelectedInches((prev) => prev.filter((i) => i !== inch))
    }
  }

  const toggleBrandExpansion = (brandId: string) => {
    setExpandedBrands((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    )
  }

  const resetFilters = () => {
    setSelectedBrands([])
    setSelectedModels([])
    setSelectedInches([]) // NUEVO: limpiar filtro de pulgadas
    setExpandedBrands([])
  }

  // NUEVO: Obtener pulgadas disponibles
  const availableInches = getAvailableInches()

  return (
    <div className="content-container py-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-ui-fg-base mb-4">
          Repuestos y Accesorios
        </h1>
        <p className="text-ui-fg-subtle max-w-2xl mx-auto">
          Encuentra los mejores repuestos para tu patinete eléctrico. Filtra por
          tipo de repuesto, marca y modelo para encontrar exactamente lo que
          necesitas.
        </p>
      </div>

      {/* Filtro por tipo de repuesto (collections) */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Tipo de Recambio</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Opción "Todas" */}
          <label
            className={`
          cursor-pointer bg-white border rounded-lg p-4 flex flex-col items-center transition-shadow
          ${
            !params.get("collection")
              ? "shadow-lg ring-2 ring-mysGreen-100 border-transparent"
              : "hover:shadow-md border-gray-200"
          }
        `}
            htmlFor="col_all"
          >
            <input
              id="col_all"
              type="radio"
              name="collection"
              value=""
              className="sr-only peer"
              checked={!params.get("collection")}
              onChange={() => onCollectionChange("")}
            />

            <img
              className="w-full h-40 object-cover mb-2"
              src="https://myurbanscoot.com/wp-content/uploads/2021/11/KIT-AMORTIGUADOR-MONORIM-PINZA-DE-FRENO-XTECH-KIT-DE-1022-400x400.jpg"
            />
            <span className="text-sm">Todas</span>
          </label>

          {sparePartsTypes.map((collection) => {
            const isSelected = params.get("collection") === collection.id
            return (
              <label
                key={collection.id}
                onClick={() => onCollectionChange(collection.id)}
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
                  name="collection"
                  value={collection.id}
                  className="sr-only"
                  checked={isSelected}
                  onChange={() => {}}
                />
                <img
                  src={collection.metadata?.image as string}
                  alt={collection.title}
                  className="w-full h-40 object-cover mb-2"
                />
                <span className="text-sm text-center">{collection.title}</span>
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

            {/* Filtro de precio */}
            <div className="mb-6">
              <PriceRangeFilter
                products={products}
                onPriceChange={handlePriceChange}
              />
            </div>

            {/* NUEVO: Filtro por pulgadas (solo si es colección de ruedas) */}
            {shouldShowInchesFilter() && availableInches.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-3">Tamaño (Pulgadas)</h4>
                <div className="space-y-2">
                  {availableInches.map((inch) => (
                    <label
                      key={inch}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedInches.includes(inch)}
                        onCheckedChange={(checked) =>
                          handleInchChange(inch, !!checked)
                        }
                      />
                      <span className="text-sm">{inch}"</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro por marcas y modelos */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Modelos compatibles</h4>
              <div className="space-y-2">
                {brands.map((brand) => {
                  const models = getModelsByBrand(brand.id)
                  const isExpanded = expandedBrands.includes(brand.id)

                  return (
                    <div key={brand.id} className="space-y-1">
                      {/* Marca principal */}
                      <div className="flex items-center justify-between">
                        {/* Botón expandir/contraer si hay modelos */}
                        {models.length > 0 && (
                          <>
                            <label
                              onClick={() => toggleBrandExpansion(brand.id)}
                              className="flex items-center space-x-2 cursor-pointer flex-1"
                            >
                              <span className="text-sm font-medium">
                                {brand.name}
                              </span>
                            </label>
                            <button
                              onClick={() => toggleBrandExpansion(brand.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>

                      {/* Modelos (subcategorías) */}
                      {isExpanded && models.length > 0 && (
                        <div className="ml-6 space-y-1">
                          {models.map((model) => (
                            <label
                              key={model.id}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedModels.includes(model.id)}
                                onCheckedChange={(checked) =>
                                  handleModelChange(model.id, !!checked)
                                }
                              />
                              <span className="text-xs text-ui-fg-subtle">
                                {model.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mostrar filtros activos */}
            {(selectedBrands.length > 0 ||
              selectedModels.length > 0 ||
              selectedInches.length > 0) && (
              <div className="pt-4 border-t">
                <h5 className="text-sm font-medium mb-2">Filtros activos:</h5>
                <div className="space-y-1 text-xs text-ui-fg-subtle">
                  {selectedBrands.length > 0 && (
                    <div>Marcas: {selectedBrands.length}</div>
                  )}
                  {selectedModels.length > 0 && (
                    <div>Modelos: {selectedModels.length}</div>
                  )}
                  {selectedInches.length > 0 && (
                    <div>Pulgadas: {selectedInches.join(", ")}"</div>
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

                    {(() => {
                      const price = getProductPrice(product)
                      if (price !== null) {
                        return (
                          <div className="text-lg font-semibold text-ui-fg-base mb-2">
                            {`${price.toFixed(2)}€`}
                          </div>
                        )
                      }
                      return null
                    })()}

                    {/* Metadata de compatibilidad */}
                    {typeof product.metadata?.compatible_models !==
                      "undefined" && (
                      <div className="text-xs text-ui-fg-subtle mb-3">
                        Compatible con:{" "}
                        {Array.isArray(product.metadata.compatible_models)
                          ? (
                              product.metadata.compatible_models as string[]
                            ).join(", ")
                          : String(product.metadata.compatible_models)}
                      </div>
                    )}

                    {/* Marca y tipo de repuesto */}
                    {/* <div className="flex flex-wrap gap-1 mb-3">
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
                    </div> */}

                    {/* Botón de acción */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full border-2 text-black border-mysGreen-100 py-2 rounded-lg hover:bg-ui-bg-interactive-hover transition-colors"
                      >
                        Añadir al carrito
                      </button>
                      <LocalizedClientLink href={`/producto/${product.handle}`}>
                        <button className="w-full py-2 rounded-lg border-2 text-black border-mysGreen-100 hover:bg-ui-bg-interactive-hover transition-colors">
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
