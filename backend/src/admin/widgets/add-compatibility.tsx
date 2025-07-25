"use client"

import React, { useEffect, useState, useMemo } from "react"
import {
  DetailWidgetProps,
  AdminProduct,
  AdminProductCategory,
} from "@medusajs/framework/types"
import { sdk } from "../lib/sdk"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Button,
  toast,
  Select,
  Heading,
  Label,
  Toaster,
} from "@medusajs/ui"
import { useQuery, useMutation } from "@tanstack/react-query"

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(h)
  }, [value, delay])
  return debounced
}

const CATEGORY_ID = "pcat_01JXAM4TK7WAFY33A6JQS25VJS" // categoría de patinetes

const COLLECTION_IDS_SPARE_PARTS = [
  "pcol_01JWG66MGBN9TAHXDTNHH3234T", // ruedas
  "pcol_01JWG66TAYWBD57XQXCVFNJQR0", // frenos
  "pcol_01JWG67E6AMBXAC3BTTXQGYT7J", // suspensiones
]

const COMPATIBLE_KEYS = {
  vinyl: "compatible_scooter_ids",
  spare: "compatible_sparepart_ids",
}

const VinylCompatibilityWidget: React.FC<DetailWidgetProps<AdminProduct>> = ({ data }) => {
  const productId = data.id
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 500)

  const isVinyl = useMemo(() =>
    data.categories?.some((c: AdminProductCategory) => c.handle === "vinilos"),
    [data.categories]
  )

  const isSparePart = useMemo(() =>
    data.collection_id && COLLECTION_IDS_SPARE_PARTS.includes(data.collection_id),
    [data.collection_id]
  )

  const metadataKey = isVinyl
    ? COMPATIBLE_KEYS.vinyl
    : isSparePart
    ? COMPATIBLE_KEYS.spare
    : null

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (!metadataKey) return []
    const raw = data.metadata?.[metadataKey]
    if (!raw || typeof raw !== "string") return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : [String(parsed)]
    } catch {
      return [String(raw)]
    }
  })

  const { data: scootersData, isLoading } = useQuery({
    queryKey: ["scooters", debouncedSearch],
    queryFn: async () => {
      const { products } = await sdk.admin.product.list({
        q: debouncedSearch,
        category_id: [CATEGORY_ID],
        limit: 50,
      })
      return { products }
    },
    enabled: !!metadataKey,
    placeholderData: (prev) => prev,
  })

  const options = useMemo(() =>
    (scootersData?.products || [])
      .filter(p => p.id !== productId)
      .map(p => ({ value: p.id, label: p.title })),
    [scootersData, productId]
  )

  const mutation = useMutation({
    mutationFn: () => {
      const metadata = { ...data.metadata }
      if (metadataKey) {
        if (selectedIds.length > 0) {
          metadata[metadataKey] = JSON.stringify(selectedIds)
        } else {
          delete metadata[metadataKey]
        }
      }
      return sdk.admin.product.update(productId, { metadata })
    },
    onSuccess: () => toast.success("Compatibilidad guardada correctamente"),
    onError: (err) => toast.error("Error al guardar", { description: err.message }),
  })

  const handleChange = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
    setSearch("")
  }

  const handleRemove = (id: string) => setSelectedIds((prev) => prev.filter(x => x !== id))

  const handleSave = () => mutation.mutate()

  if (!metadataKey) return null

  const title =
    metadataKey === COMPATIBLE_KEYS.vinyl
      ? "Compatibilidad con Patinetes"
      : "Compatibilidad de repuesto con Patinetes"

  return (
    <Container className="p-4 bg-ui-bg-base rounded-lg shadow-sm">
      <Toaster />
      <Heading level="h2" className="mb-4 text-lg">{title}</Heading>

      <div className="mb-4">
        <Label htmlFor="search" className="text-xs mb-1">Buscar patinetes:</Label>
        <input
          id="search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar patinete..."
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div className="mb-4">
        <Label className="text-xs">Añadir patinete compatible:</Label>
        <Select value={""} onValueChange={handleChange}>
          <Select.Trigger className="h-9">
            <Select.Value placeholder={isLoading ? "Cargando..." : "Seleccionar patinete..."} />
          </Select.Trigger>
          <Select.Content>
            {isLoading && <Select.Item value="_" disabled>Cargando…</Select.Item>}
            {!isLoading && options.length === 0 && (
              <Select.Item value="_" disabled>
                {search ? "Sin resultados" : "No hay patinetes eléctricos"}
              </Select.Item>
            )}
            {!isLoading && options.map(opt => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                disabled={selectedIds.includes(opt.value)}
              >
                {opt.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 bg-ui-bg-subtle rounded-md border">
          <Label className="text-xs mb-2">Patinetes compatibles seleccionados:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedIds.map(id => {
              const label = options.find(opt => opt.value === id)?.label || id
              return (
                <div
                  key={id}
                  className="flex items-center px-3 py-1 rounded-full bg-gray-300 text-sm text-black"
                >
                  <span>{label}</span>
                  <button
                    onClick={() => handleRemove(id)}
                    className="ml-2 text-lg leading-none"
                    title="Quitar"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Button onClick={handleSave} disabled={mutation.isPending} className="w-full h-9">
        {mutation.isPending ? "Guardando..." : "Guardar Compatibilidad"}
      </Button>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default VinylCompatibilityWidget
