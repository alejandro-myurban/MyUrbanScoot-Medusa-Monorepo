"use client"

import { useState, useEffect } from "react"
import { HttpTypes, StoreProduct } from "@medusajs/types"
import { Checkbox } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { addToCart } from "@lib/data/cart"
import { PriceRangeFilter } from "../components/price-filter"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/components/ui/breadcrumb"
import { ChevronRight, Home } from "lucide-react"

interface SparePartsTemplateProps {
  products: HttpTypes.StoreProduct[]
  sparePartsTypes: HttpTypes.StoreCollection[] // Tipos de repuestos (ruedas, frenos, etc.)
  brands: HttpTypes.StoreProductCategory[] // Marcas (hijos de "Modelos Recambios")
  countryCode: string
  parentCategory?: HttpTypes.StoreProductCategory // La categoría padre "Modelos Recambios"
  currentTireSize?: string
  currentTireGripType?: string
  currentTireType?: string
}

export default function SparePartsTemplate({
  products,
  sparePartsTypes,
  brands,
  countryCode,
  parentCategory,
  currentTireSize,
  currentTireGripType,
  currentTireType,
}: SparePartsTemplateProps) {
  const [filteredProducts, setFilteredProducts] =
    useState<HttpTypes.StoreProduct[]>(products)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [selectedInches, setSelectedInches] = useState<string[]>([]) // NUEVO: filtro de pulgadas
  const [expandedBrands, setExpandedBrands] = useState<string[]>([])
  const [selectedTireSizes, setSelectedTireSizes] = useState<string[]>([]) // Filtro por tamaño
  const [selectedGripTypes, setSelectedGripTypes] = useState<string[]>([]) // Filtro por agarre
  const [selectedTireTypes, setSelectedTireTypes] = useState<string[]>([]) // Filtro por tipo de neumatico

  const [loading, setLoading] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 500])
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    if (currentTireSize) {
      setSelectedInches([currentTireSize])
      console.log(currentTireSize)
    } else {
      setSelectedInches([])
    }

    if (currentTireGripType) {
      setSelectedGripTypes([currentTireGripType])
    } else {
      setSelectedGripTypes([])
    }

    if (currentTireType) {
      setSelectedTireTypes([currentTireType])
    } else {
      setSelectedTireTypes([])
    }
  }, [currentTireSize, currentTireGripType, currentTireType])


  console.log("PRODUCTOS ", products)
  console.log("TIPOS DE REPUESTOS (collections)", sparePartsTypes)
  console.log("MARCAS (hijos de Modelos Recambios)", brands)
  console.log("CATEGORIA PADRE", parentCategory)

  // Obtener la colección seleccionada para el breadcrumb
  const selectedCollectionId = params.get("collection")
  const selectedCollection = sparePartsTypes.find(
    (col) => col.id === selectedCollectionId
  )

  // NUEVO: Función para extraer pulgadas del título del producto
  const extractInchesFromTitle = (title: string): string[] => {
    // Sólo números (con coma o punto) justo antes de ''  ″ o "
    const inchRegex = /(\d+(?:[.,]\d+)?)(?=\s*(?:''|″|"))/g

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
        console.log("METADATA", product)
      }
    })

    return Array.from(inches).sort((a, b) => parseFloat(a) - parseFloat(b))
  }

  const getAvailableTireOptions = () => {
    const sizes = new Set<string>()
    const grips = new Set<string>()
    const types = new Set<string>()

    products.forEach((product) => {
      const meta = product.metadata || {}
      console.log(meta.tire_grip_type)
      if (typeof meta.tire_size === "string") sizes.add(meta.tire_size)
      if (typeof meta.tire_grip_type === "string") grips.add(meta.tire_grip_type)
      if (typeof meta.tire_type === "string") types.add(meta.tire_type)
    })

    return {
      sizes: Array.from(sizes).sort(),
      grips: Array.from(grips),
      types: Array.from(types),
    }
  }

  const { sizes, grips, types } = getAvailableTireOptions()

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
  }, [selectedBrands, selectedModels, selectedInches, products, priceRange, selectedTireSizes, selectedGripTypes, selectedTireTypes]) // ACTUALIZADO: añadir todos los filtros

  // Filtrar productos cuando cambien los filtros
  useEffect(() => {
    filterProducts()
  }, [selectedBrands, selectedModels, selectedInches, products, selectedTireSizes, selectedGripTypes, selectedTireTypes]) // ACTUALIZADO: añadir todos los filtros

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
    // Limpiar filtros de neumáticos al cambiar tipo de repuesto
    next.delete("tireSize")
    next.delete("tireGripType")
    next.delete("tireType")


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

  // ACTUALIZADO: función de filtrado con pulgadas y nuevos filtros de neumáticos
  const filterProducts = () => { // <-- ESTA ES LA FUNCIÓN QUE FALTABA CERRAR
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

    // Filtro por tamaño de neumático (metadata.tire_size)
    if (selectedTireSizes.length > 0) {
      filtered = filtered.filter((product) =>
        typeof product.metadata?.tire_size === "string" &&
        selectedTireSizes.includes(product.metadata.tire_size)
      )
    }

    // Filtro por tipo de agarre (metadata.tire_grip_type)
    if (selectedGripTypes.length > 0) {
      filtered = filtered.filter((product) =>
        typeof product.metadata?.tire_grip_type === "string" &&
        selectedGripTypes.includes(product.metadata.tire_grip_type)
      )
    }

    // Filtro por tipo de neumático (metadata.tire_type)
    if (selectedTireTypes.length > 0) {
      filtered = filtered.filter((product) =>
        typeof product.metadata?.tire_type === "string" &&
        selectedTireTypes.includes(product.metadata.tire_type)
      )
    }

    setFilteredProducts(filtered)
  } // <-- ¡AQUÍ FALTABA LA LLAVE DE CIERRE DE filterProducts!

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
    // --- Neumaticos ---
    setSelectedTireSizes([])
    setSelectedGripTypes([])
    setSelectedTireTypes([])

  }

  // NUEVO: Obtener pulgadas disponibles
  const availableInches = getAvailableInches()

  return (
    <div className="content-container py-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/${countryCode}`}
                className="flex items-center gap-1"
              >
                Inicio
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {selectedCollection ? (
                <BreadcrumbLink href={`/${countryCode}/spare-parts`}>
                  Recambios
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="font-bold">Recambios</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {selectedCollection && (
              <>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-bold">{selectedCollection.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-8 text-left">
        <h1 className="text-[30px] font-bold pb-4  text-ui-fg-base font-archivoBlack mb-4 uppercase">
          Repuestos y Accesorios
        </h1>
        <p className="text-ui-fg-subtle font-archivo max-w-2xl">
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
          <div className="bg-white rounded-lg py-6 pr-4 sticky top-4">
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
            {/* Filtro Neumaticos */}
            
            {/* Filtro Tamaño de Neumatico */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-3">Tamaño neumático</h4>
                {sizes.map((size) => (
                  <label key={size} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={selectedTireSizes.includes(size)}
                      onCheckedChange={(checked) =>
                        setSelectedTireSizes((prev) =>
                          checked ? [...prev, size] : prev.filter((s) => s !== size)
                        )
                      }
                    />
                    <span className="text-sm">{size}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Filtro tipo de agarre */}

            {grips.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-3">Tipo de agarre</h4>
                {grips.map((grip) => (
                  <label key={grip} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={selectedGripTypes.includes(grip)}
                      onCheckedChange={(checked) =>
                        setSelectedGripTypes((prev) =>
                          checked ? [...prev, grip] : prev.filter((g) => g !== grip)
                        )
                      }
                    />
                    <span className="text-sm capitalize">
                      {grip === "offroad"
                        ? "Offroad (taco)"
                        : grip === "smooth"
                        ? "Liso"
                        : grip === "mixed"
                        ? "Mixto"
                        : grip}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Filtro tipo de neumaticos */}
            
            {types.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-3">Tipo de neumático</h4>
                {types.map((type) => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={selectedTireTypes.includes(type)}
                      onCheckedChange={(checked) =>
                        setSelectedTireTypes((prev) =>
                          checked ? [...prev, type] : prev.filter((t) => t !== type)
                        )
                      }
                    />
                    <span className="text-sm capitalize">
                      {{
                        tubeless: "Tubeless",
                        tube: "Con cámara",
                        solid: "Macizo",
                      }[type] || type}
                    </span>
                  </label>
                ))}
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
              selectedInches.length > 0 ||
              selectedTireSizes.length > 0 ||
              selectedGripTypes.length > 0 ||
              selectedTireTypes.length > 0) && ( // Añadidos los nuevos filtros
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
                  {selectedTireSizes.length > 0 && (
                    <div>Tamaño neumático: {selectedTireSizes.join(", ")}</div>
                  )}
                  {selectedGripTypes.length > 0 && (
                    <div>Tipo de agarre: {selectedGripTypes.join(", ")}</div>
                  )}
                  {selectedTireTypes.length > 0 && (
                    <div>Tipo de neumático: {selectedTireTypes.join(", ")}</div>
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
                  onClick={() => router.push(`/${countryCode}/producto/${product.handle}`)}
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
                          <div className=" font-archivoBlack font-bold sm:text-2xl text-ui-fg-base mb-2">
                            {`${price.toFixed(2)} €`}
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

                    {/* Botón de acción */}
                    <div className="flex flex-col gap-2">
                      {/* <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full border-2 text-black border-mysGreen-100 py-2 rounded-lg hover:bg-ui-bg-interactive-hover transition-colors"
                      >
                        Añadir al carrito
                      </button> */}
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