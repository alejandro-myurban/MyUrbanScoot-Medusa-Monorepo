import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { cache } from "react"
import { HttpTypes } from "@medusajs/types"

const DEFAULT_COUNTRY_CODE = "es"

// Función para ordenar regiones con España primero
const sortRegionsWithSpainFirst = (regions: HttpTypes.StoreRegion[]) => {
  const PRIORITY_COUNTRIES = ["es"] // Puedes añadir más países aquí si necesitas
  
  return regions.sort((a, b) => {
    // Ver si cada región tiene algún país prioritario
    const aPriority = a.countries?.some(country => 
      PRIORITY_COUNTRIES.includes(country.iso_2 ?? "")
    )
    const bPriority = b.countries?.some(country => 
      PRIORITY_COUNTRIES.includes(country.iso_2 ?? "")
    )
    
    // Si A es prioritario y B no, A va primero
    if (aPriority && !bPriority) return -1
    // Si B es prioritario y A no, B va primero  
    if (!aPriority && bPriority) return 1
    // Si ambos son prioritarios o ninguno lo es, mantener orden alfabético
    return 0
  })
}

export const listRegions = cache(async function () {
  return sdk.store.region
    .list({}, { next: { tags: ["regions"] } })
    .then(({ regions }) => sortRegionsWithSpainFirst(regions))
    .catch(medusaError)
})

export const retrieveRegion = cache(async function (id: string) {
  return sdk.store.region
    .retrieve(id, {}, { next: { tags: ["regions"] } })
    .then(({ region }) => region)
    .catch(medusaError)
})

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = cache(async function (countryCode?: string) {
  const code = countryCode || DEFAULT_COUNTRY_CODE
  
  if (regionMap.has(code)) {
    return regionMap.get(code)!
  }
  
  const regions = await listRegions() // Ya viene ordenado con España primero
  console.log(regions[0].countries)
  if (!regions) return null
  
  regions.forEach((region) => {
    region.countries?.forEach((c) => {
      regionMap.set(c?.iso_2 ?? "", region)
    })
  })
  
  // vuelve a verificar después de llenar el map
  if (regionMap.has(code)) {
    return regionMap.get(code)!
  }
  
  return regions[0] || null
})