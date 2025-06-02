import { notFound } from "next/navigation"
import { Suspense } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

// Importar componentes de breadcrumb de shadcn
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../src/components/ui/breadcrumb"

export default function CategoryTemplate({
  categories,
  sortBy,
  page,
  countryCode,
}: {
  categories: HttpTypes.StoreProductCategory[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  const category = categories[categories.length - 1]

  // Construir la jerarquía completa usando parent_category
  const buildHierarchy = (cat: any): any[] => {
    const hierarchy: any[] = []
    let current = cat.parent_category

    // Recorrer hacia arriba hasta encontrar todas las categorías padre
    while (current) {
      hierarchy.unshift(current)
      current = current.parent_category
    }

    return hierarchy
  }

  const parents = buildHierarchy(category)

  if (!category || !countryCode) notFound()

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <div className="w-full">
        {/* Breadcrumb */}
        <div className="mb-6">
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
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem key={parent.id}>
                    <BreadcrumbLink asChild>
                      <LocalizedClientLink
                        href={`/categories/${parent.handle}`}
                        className="hover:text-black"
                      >
                        {parent.name}
                      </LocalizedClientLink>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              ))}

              {/* Categoría actual */}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{category.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-col mb-8 text-2xl-semi gap-4">
          <h1 data-testid="category-page-title">{category.name}</h1>
          <RefinementList sortBy={sort} data-testid="sort-by-container" />
        </div>

        {category.description && (
          <div className="mb-8 text-base-regular">
            <p>{category.description}</p>
          </div>
        )}

        {category.category_children && (
          <div className="mb-8 text-base-large">
            <ul className="grid grid-cols-1 gap-2">
              {category.category_children?.map((c) => (
                <li key={c.id}>
                  <InteractiveLink href={`/categories/${c.handle}`}>
                    {c.name}
                  </InteractiveLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            categoryId={category.id}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}
