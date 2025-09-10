// app/categories/[handle]/page.tsx
import { notFound } from "next/navigation"
import React, { Suspense } from "react"
import { HttpTypes } from "@medusajs/types"
import { getProductsListWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../src/components/ui/breadcrumb"
import PriceFilterWrapper from "@modules/products/components/price-filter-wrapper"
import { SubcategoryCardLight } from "../components/subcategory-card"
import JsonLd, { generateCategorySchema, generateBreadcrumbSchema } from "@/components/seo/json-ld"

import ScootersFiltersContainer from "../components/filters/scootets-filters-container"
import MobileFiltersButton from "../components/filters/mobile-filters-button" 

const applyScooterFilters = (
  products: HttpTypes.StoreProduct[],
  searchParams: { [key: string]: string | string[] | undefined }
) => {
  return products.filter((product) => {
    const m = product.metadata || {}

    // Parámetros de selección múltiple (checkboxes)
    const dgt = Array.isArray(searchParams.dgt) ? (searchParams.dgt as string[]) : (searchParams.dgt ? [searchParams.dgt as string] : []);
    const motorType = Array.isArray(searchParams.motorType) ? (searchParams.motorType as string[]) : (searchParams.motorType ? [searchParams.motorType as string] : []);
    const hydraulicBrakes = Array.isArray(searchParams.hydraulicBrakes) ? (searchParams.hydraulicBrakes as string[]) : (searchParams.hydraulicBrakes ? [searchParams.hydraulicBrakes as string] : []);
    const tireSizes = Array.isArray(searchParams.tireSizes) ? (searchParams.tireSizes as string[]) : (searchParams.tireSizes ? [searchParams.tireSizes as string] : []);
    const gripTypes = Array.isArray(searchParams.gripTypes) ? (searchParams.gripTypes as string[]) : (searchParams.gripTypes ? [searchParams.gripTypes as string] : []);
    const tireTypes = Array.isArray(searchParams.tireTypes) ? (searchParams.tireTypes as string[]) : (searchParams.tireTypes ? [searchParams.tireTypes as string] : []);


    // Parámetros de rango (ej. "min,max")
    const parseRangeParam = (param: string | string[] | undefined, defaultMin: number, defaultMax: number): [number, number] => {
      if (typeof param === 'string') {
        const parts = param.split(',').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return [parts[0], parts[1]];
        }
      }
      return [defaultMin, defaultMax];
    };

    // basado en `allCategoryProducts`.
    const autonomyRange = parseRangeParam(searchParams.autonomyRange, 0, 9999);
    const powerRange = parseRangeParam(searchParams.powerRange, 0, 99999);
    const voltageRange = parseRangeParam(searchParams.voltageRange, 0, 999);
    const weightRange = parseRangeParam(searchParams.weightRange, 0, 999);
    const speedRange = parseRangeParam(searchParams.speedRange, 0, 999);


    // Lógica de coincidencia para cada filtro
    const dgtMatch = !dgt.length || (m.dgt && dgt.includes(m.dgt as string));
    const motorTypeMatch = !motorType.length || (m.motor_type && motorType.includes(m.motor_type as string));
    const hydraulicBrakesMatch = !hydraulicBrakes.length || (m.hydraulic_brakes && hydraulicBrakes.includes(m.hydraulic_brakes as string));
    const tireSizesMatch = !tireSizes.length || (m.tire_size && tireSizes.includes(m.tire_size as string));
    const gripTypesMatch = !gripTypes.length || (m.tire_grip_type && gripTypes.includes(m.tire_grip_type as string));
    const tireTypesMatch = !tireTypes.length || (m.tire_type && tireTypes.includes(m.tire_type as string));


    const autonomyMatch =
      Number(m.autonomy_km) >= autonomyRange[0] &&
      Number(m.autonomy_km) <= autonomyRange[1];

    const powerMatch =
      Number(m.motor_power_w) >= powerRange[0] &&
      Number(m.motor_power_w) <= powerRange[1];

    const voltageMatch =
      Number(m.battery_voltage_v) >= voltageRange[0] &&
      Number(m.battery_voltage_v) <= voltageRange[1];

    const weightMatch =
      Number(m.weight_kg) >= weightRange[0] &&
      Number(m.weight_kg) <= weightRange[1];

    const speedMatch =
      Number(m.max_speed_kmh) >= speedRange[0] &&
      Number(m.max_speed_kmh) <= speedRange[1];

    return (
      dgtMatch &&
      motorTypeMatch &&
      hydraulicBrakesMatch &&
      tireSizesMatch &&
      gripTypesMatch &&
      tireTypesMatch &&
      autonomyMatch &&
      powerMatch &&
      voltageMatch &&
      weightMatch &&
      speedMatch
    );
  });
};

// --- Componente principal de la plantilla de categoría (Server Component) ---
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

  const ALL_PRODUCTS_LIMIT = 1000 
  const queryParamsForFilter = {
    limit: ALL_PRODUCTS_LIMIT,
    category_id: [category.id],
  }

  const region = await getRegion(countryCode)
  if (!region) {
    notFound()
  }

  const {
    response: { products: allCategoryProducts },
  } = await getProductsListWithSort({
    page: 1,
    queryParams: queryParamsForFilter,
    sortBy: sort,
    countryCode,
  })

  // Aplica los filtros de scooter si la categoría es "patinetes-electricos"
  const filteredProductsToDisplay = category.handle === "patinetes-electricos"
    ? applyScooterFilters(allCategoryProducts, searchParams || {})
    : allCategoryProducts;

  const sortSubcategories = (
    subcategories: HttpTypes.StoreProductCategory[]
  ) => {
    const priorityOrder = ["kugoo-kirin", "smartgyro", "dualtron", "xiaomi"]
    const priorityCategories: HttpTypes.StoreProductCategory[] = []
    const otherCategories: HttpTypes.StoreProductCategory[] = []

    subcategories.forEach((cat) => {
      const priorityIndex = priorityOrder.indexOf(cat.handle)
      if (priorityIndex !== -1) {
        priorityCategories[priorityIndex] = cat
      } else {
        otherCategories.push(cat)
      }
    })

    const sortedPriority = priorityCategories.filter(Boolean)
    const sortedOthers = otherCategories.sort((a, b) => {
      if (a.rank !== undefined && b.rank !== undefined) {
        return a.rank! - b.rank!
      }
      return a.name.localeCompare(b.name)
    })
    return [...sortedPriority, ...sortedOthers]
  }

  const shouldShowSubcategoryCards =
    category.handle === "vinilos" &&
    category.category_children &&
    category.category_children.length > 0

  const sortedSubcategories =
    shouldShowSubcategoryCards && category.category_children
      ? sortSubcategories(category.category_children)
      : category.category_children

  // Generate structured data for category
  const categorySchema = generateCategorySchema(category, allCategoryProducts)
  
  // Generate breadcrumb data
  const breadcrumbs = [
    { name: "Inicio", url: "https://myurbanscoot.com" },
    ...parents.map(parent => ({
      name: parent.name,
      url: `https://myurbanscoot.com/categories/${parent.handle}`
    })),
    { name: category.name, url: `https://myurbanscoot.com/categories/${category.handle}` }
  ]
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs)

  return (
    <>
      <JsonLd data={categorySchema} />
      <JsonLd data={breadcrumbSchema} />
      <div
        className="flex gap-4 flex-col small:items-start py-6 content-container"
        data-testid="category-container"
      >
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <LocalizedClientLink href="/">Inicio</LocalizedClientLink>
            </BreadcrumbLink>
          </BreadcrumbItem>

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
          <h1 className="text-2xl-semi pb-4 font-archivoBlack uppercase" data-testid="category-page-title">
            {category.name}
          </h1>

          {category.description && (
            <p className="text-base-regular text-gray-600 max-w-3xl">
              {category.description}
            </p>
          )}
        </div>

        {shouldShowSubcategoryCards ? (
          <div className="grid grid-cols-1 xsmall:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedSubcategories.map((subcategory) => (
              <SubcategoryCardLight
                key={subcategory.id}
                category={subcategory}
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-6 flex-col lg:flex-row">
            <aside className="w-full lg:w-[280px] lg:flex-shrink-0">
              <div className="sticky top-4 space-y-4 lg:space-y-6">
                {/* Filtros Header - Responsive Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-0">
                  {/* Ordenación Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-6">
                    <RefinementList sortBy={sort} data-testid="sort-by-container" />
                  </div>
                  
                  {/* Precio Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-6">
                    <h3 className="font-bold font-archivoBlack text-lg text-gray-900 mb-4 uppercase tracking-wide lg:text-lg">
                      Precio
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-3 lg:p-4">
                      <PriceFilterWrapper products={allCategoryProducts} />
                    </div>
                  </div>
                </div>

                {/* Scooter Filters */}
                {category.handle === "patinetes-electricos" && (
                  <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold font-archivoBlack text-lg text-gray-900 mb-4 uppercase tracking-wide">
                      Especificaciones
                    </h3>
                    <ScootersFiltersContainer
                      allProducts={allCategoryProducts} 
                      initialSearchParams={searchParams || {}} 
                    />
                  </div>
                )}

                {/* Subcategorías */}
                {category.category_children &&
                  category.category_children.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                      <h3 className="font-bold font-archivoBlack text-lg text-gray-900 mb-4 uppercase tracking-wide">
                        Subcategorías
                      </h3>
                      <ul className="space-y-3">
                        {category.category_children.map((c) => (
                          <li key={c.id}>
                            <LocalizedClientLink 
                              href={`/categories/${c.handle}`}
                              className="flex items-center px-3 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                            >
                              <span className="w-2 h-2 bg-gray-300 rounded-full mr-3 transition-colors duration-200 group-hover:bg-red-500"></span>
                              {c.name}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </aside>

            {/* Mobile Floating Button para Scooters */}
            {category.handle === "patinetes-electricos" && (
              <MobileFiltersButton
                allProducts={allCategoryProducts} 
                initialSearchParams={searchParams || {}} 
              />
            )}

            <div className="flex-1">
              <Suspense fallback={<SkeletonProductGrid />}>
                <PaginatedProducts
                  sortBy={sort}
                  page={pageNumber}
                  categoryId={category.id}
                  countryCode={countryCode}
                  searchParams={searchParams ?? {}}
                  allProducts={filteredProductsToDisplay}
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}