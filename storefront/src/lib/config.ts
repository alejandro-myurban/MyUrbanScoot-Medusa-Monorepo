import { MedusaPluginsSDK } from "@lambdacurry/medusa-plugins-sdk"
import algoliasearch from 'algoliasearch/lite'
import type { SearchClient } from 'algoliasearch/lite'

// Defaults to standard port for Medusa server
let MEDUSA_BACKEND_URL = "http://localhost:9000"

if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}

export const baseMedusaConfig = {
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
}

export const sdk = new MedusaPluginsSDK({
  ...baseMedusaConfig,
})

export const searchClient: SearchClient = {
  ...algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
    process.env.NEXT_PUBLIC_ALGOLIA_API_KEY || "",
    
  ),
  search: async (params: any) => {
    const request = Array.isArray(params) ? params[0] : params
    const query =
      "params" in request
        ? request.params?.query
        : "query" in request
        ? request.query
        : ""

    if (!query) {
      return {
        results: [
          {
            hits: [],
            nbHits: 0,
            nbPages: 0,
            page: 0,
            hitsPerPage: 0,
            processingTimeMS: 0,
            query: "",
            params: "",
            exhaustiveNbHits: true,
          },
        ],
      }
    }

    return await sdk.client.fetch(`/store/products/search`, {
      method: "POST",
      body: {
        query,
      },
    })
  },
}