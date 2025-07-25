"use client"

import { Suspense, useEffect, useState } from "react"
import { Heading, Text } from "@medusajs/ui"
import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import CompatibleScootersFallback from "./compatible-scooters-fallback"
import CompatibleScootersClient from "./compatible-scootets-client"

interface CompatibleScootersProps {
  product: HttpTypes.StoreProduct
}

const CompatibleScooters = ({ product }: CompatibleScootersProps) => {
  const [state, setState] = useState({
    loading: false,
    products: [] as HttpTypes.StoreProduct[],
    error: null as string | null
  })

  useEffect(() => {
    const fetchCompatibleProducts = async () => {
      try {
        console.log('[DEBUG] Checking metadata for product:', product.id)
        console.log('[DEBUG] Full product metadata:', product.metadata)

        let rawIds: unknown;

        // Check for compatible_scooter_ids first
        if (product?.metadata?.compatible_scooter_ids) {
          rawIds = product.metadata.compatible_scooter_ids;
          console.log('[DEBUG] Found compatible_scooter_ids.');
        } 
        // If not found, check for compatible_sparepart_ids
        else if (product?.metadata?.compatible_sparepart_ids) {
          rawIds = product.metadata.compatible_sparepart_ids;
          console.log('[DEBUG] Found compatible_sparepart_ids.');
        } 
        // If neither is found, no compatible products to fetch
        else {
          console.warn('[DEBUG] No compatible_scooter_ids or compatible_sparepart_ids found in metadata');
          return setState(prev => ({ ...prev, error: null }));
        }

        let compatibleIds: string[] = []

        // Parse the IDs based on their format
        if (typeof rawIds === 'string') {
          try {
            compatibleIds = JSON.parse(rawIds)
            console.log('[DEBUG] Parsed IDs from string:', compatibleIds)
          } catch (e) {
            console.error('[DEBUG] Failed to parse JSON string:', e)
            return setState({
              loading: false,
              products: [],
              error: "Formato de IDs incompatible"
            })
          }
        } else if (Array.isArray(rawIds)) {
          compatibleIds = rawIds
          console.log('[DEBUG] Using IDs directly from array:', compatibleIds)
        }

        if (!compatibleIds.length) {
          console.log('[DEBUG] No valid compatible IDs found')
          return setState(prev => ({ ...prev, error: null }))
        }

        // Get compatible products
        console.log('[DEBUG] Fetching compatible products with IDs:', compatibleIds)
        const results = await Promise.all(
          compatibleIds.map(id => 
            sdk.store.product.retrieve(id)
              .then(r => r.product)
              .catch(e => {
                console.error(`[DEBUG] Failed to fetch product ${id}:`, e)
                return null
              })
          )
        )

        const validProducts = results.filter(Boolean) as HttpTypes.StoreProduct[]
        console.log('[DEBUG] Successfully fetched products:', validProducts)

        setState({
          loading: false,
          products: validProducts,
          error: null
        })

      } catch (err) {
        console.error('[DEBUG] Unexpected error:', err)
        setState({
          loading: false,
          products: [],
          error: err instanceof Error ? err.message : "Error desconocido"
        })
      }
    }

    fetchCompatibleProducts()
  }, [product]) // Effect dependency is the product

  return (
    <div className="pt-4">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<CompatibleScootersFallback />}>
          <CompatibleScootersClient products={state.products} />
        </Suspense>
      </div>
    </div>
  )
}

export default CompatibleScooters