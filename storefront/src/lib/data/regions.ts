import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { cache } from "react"
import { HttpTypes } from "@medusajs/types"

const DEFAULT_COUNTRY_CODE = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "es"

export const listRegions = cache(async function () {
  return sdk.store.region
    .list({}, { next: { tags: ["regions"] } })
    .then(({ regions }) => regions)
    .catch(medusaError)
    
})

export const retrieveRegion = cache(async function (id: string) {
  return sdk.store.region
    .retrieve(id, {}, { next: { tags: ["regions"] } })
    .then(({ region }) => region)
    .catch(medusaError)
})

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = cache(async function (countryCode: string) {
  try {
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode)!
    }

    const regions = await listRegions()
    if (!regions) {
      return null
    }

    // Rellenamos el map
    regions.forEach(region => {
      region.countries?.forEach(c => {
        regionMap.set(c?.iso_2 ?? "", region)
      })
    })

    // 1) Si viene un countryCode y existe, lo retornamos
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode)!
    }

    // 2) Sino, intentamos con tu DEFAULT_COUNTRY_CODE
    if (regionMap.has(DEFAULT_COUNTRY_CODE)) {
      return regionMap.get(DEFAULT_COUNTRY_CODE)!
    }

    // 3) Pasa al último recurso: el primer region del array (o null)
    return regions[0] || null
  } catch {
    return null
  }
})
