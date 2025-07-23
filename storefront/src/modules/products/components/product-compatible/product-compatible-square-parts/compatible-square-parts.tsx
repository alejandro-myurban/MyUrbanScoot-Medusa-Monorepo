import { Heading } from "@medusajs/ui"
import { sdk } from "@lib/config"
import type { HttpTypes } from "@medusajs/types"
import { Suspense } from "react"

interface CompatibleScootersProps {
  regionId?: string
}

export default async function CompatibleSquareParts({ regionId }: CompatibleScootersProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <span> Aguante el balatro </span>
    </div>
  )
}
