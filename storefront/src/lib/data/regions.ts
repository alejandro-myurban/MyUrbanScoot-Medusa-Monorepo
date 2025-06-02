import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { cache } from "react"
import { HttpTypes } from "@medusajs/types"

const DEFAULT_COUNTRY_CODE = "es"

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

export const getRegion = cache(async function (countryCode?: string) {
  const code = countryCode || DEFAULT_COUNTRY_CODE

  if (regionMap.has(code)) {
    return regionMap.get(code)!
  }

  const regions = await listRegions()
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
