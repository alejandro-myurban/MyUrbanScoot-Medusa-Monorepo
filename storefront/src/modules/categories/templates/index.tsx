// app/categories/[handle]/page.tsx
import { notFound } from "next/navigation"
import React, { Suspense } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { getProductsListWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../src/components/ui/breadcrumb"
import PriceFilterWrapper from "@modules/products/components/price-filter-wrapper"
import {
  SubcategoryCard,
  SubcategoryCardLight,
} from "../components/subcategory-card"

// Componente para las cards de subcategorías

export default async function CategoryTemplate({
  categories,
  sortBy,
  page,
  countryCode,
  searchParams,
}: {
  categories: HttpTypes.StoreProductCategory[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const category = categories[categories.length - 1]

  if (!category || !countryCode) {
    notFound()
  }

  // Construir la jerarquía de breadcrumbs
  const buildHierarchy = (cat: any): any[] => {
    const hierarchy: any[] = []
    let current = cat.parent_category
    while (current) {
      hierarchy.unshift(current)
      current = current.parent_category
    }
    return hierarchy
  }
  const parents = buildHierarchy(category)

  // Obtener TODOS los productos de esta categoría para el filtro
  const ALL_PRODUCTS_LIMIT = 1000
  const queryParamsForFilter = {
    limit: ALL_PRODUCTS_LIMIT,
    category_id: [category.id],
  }

  const region = await getRegion(countryCode)
  if (!region) {
    notFound()
  }

  // Petición para todos los productos (para el filtro de precios)
  const {
    response: { products: allProducts },
  } = await getProductsListWithSort({
    page: 1,
    queryParams: queryParamsForFilter,
    sortBy: sort,
    countryCode,
  })

  const sortSubcategories = (
    subcategories: HttpTypes.StoreProductCategory[]
  ) => {
    // Define el orden prioritario
    const priorityOrder = ["kugoo-kirin", "smartgyro", "dualtron", "xiaomi"]

    // Separar las categorías prioritarias de las demás
    const priorityCategories: HttpTypes.StoreProductCategory[] = []
    const otherCategories: HttpTypes.StoreProductCategory[] = []

    subcategories.forEach((cat) => {
      const priorityIndex = priorityOrder.indexOf(cat.handle)
      if (priorityIndex !== -1) {
        // Si está en la lista prioritaria, guardar con su índice
        priorityCategories[priorityIndex] = cat
      } else {
        // Si no está en la lista prioritaria
        otherCategories.push(cat)
      }
    })

    // Filtrar undefined (por si alguna categoría prioritaria no existe)
    const sortedPriority = priorityCategories.filter(Boolean)

    // Ordenar las otras categorías por rank o alfabéticamente
    const sortedOthers = otherCategories.sort((a, b) => {
      // Primero por rank si existe
      if (a.rank !== undefined && b.rank !== undefined) {
        return a.rank! - b.rank!
      }
      // Luego alfabéticamente por nombre
      return a.name.localeCompare(b.name)
    })

    // Combinar arrays: primero las prioritarias, luego las demás
    return [...sortedPriority, ...sortedOthers]
  }

  // Detectar si es la categoría de Vinilos y tiene subcategorías
  const shouldShowSubcategoryCards =
    category.handle === "vinilos" &&
    category.category_children &&
    category.category_children.length > 0

  const sortedSubcategories =
    shouldShowSubcategoryCards && category.category_children
      ? sortSubcategories(category.category_children)
      : category.category_children

  return (
    <div
      className="flex gap-4 flex-col small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <Breadcrumb>
        <BreadcrumbList>
          {/* Home link */}
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <LocalizedClientLink href="/">Inicio</LocalizedClientLink>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {/* Categorías padre */}
          {parents.map((parent) => (
            <React.Fragment key={parent.id}>
              <BreadcrumbSeparator className="flex-none text-black [&>svg]:w-4 [&>svg]:h-4" />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <LocalizedClientLink
                    href={`/categories/${parent.handle}`}
                    className="hover:text-black"
                  >
                    {parent.name}
                  </LocalizedClientLink>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          ))}

          {/* Categoría actual */}
          <BreadcrumbSeparator className="flex-none text-black [&>svg]:w-4 [&>svg]:h-4" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold">
              {category.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="w-full">
        <div className="">
          <h1 className="text-2xl-semi" data-testid="category-page-title">
            {category.name}
          </h1>

          {category.description && (
            <p className="text-base-regular text-gray-600 max-w-3xl">
              {category.description}
            </p>
          )}
        </div>

        {shouldShowSubcategoryCards ? (
          // Mostrar cards de subcategorías para Vinilos
          <div className="grid grid-cols-1 xsmall:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedSubcategories.map((subcategory) => (
              <SubcategoryCardLight
                key={subcategory.id}
                category={subcategory}
              />
            ))}
          </div>
        ) : (
          // Mostrar el layout normal con productos
          <div className="flex gap-8 flex-col lg:flex-row">
            <div className="flex flex-col gap-4 w-full sm:min-w-[250px]">
              <RefinementList sortBy={sort} data-testid="sort-by-container" />
              <PriceFilterWrapper products={allProducts} />

              {/* Mostrar subcategorías como lista si existen */}
              {category.category_children &&
                category.category_children.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-base-semi mb-4">Subcategorías</h3>
                    <ul className="space-y-2">
                      {category.category_children.map((c) => (
                        <li key={c.id}>
                          <InteractiveLink href={`/categories/${c.handle}`}>
                            {c.name}
                          </InteractiveLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            {/* Productos paginados */}
            <div className="flex-1">
              <Suspense fallback={<SkeletonProductGrid />}>
                <PaginatedProducts
                  sortBy={sort}
                  page={pageNumber}
                  categoryId={category.id}
                  countryCode={countryCode}
                  searchParams={searchParams ?? {}}
                  allProducts={allProducts}
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
