import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const value = Array.isArray(req.query.value) 
    ? req.query.value.map(String)
    : req.query.value?.toString()

  // Resuelve el servicio del módulo de productos
  const productModuleService = req.scope.resolve(Modules.PRODUCT)

  // Busca los tags filtrando por value
  const tags = await productModuleService.listProductTags({ value })

  // Si no hay tags, responde vacío
  if (!tags.length) {
    return res.json({ product_tags: [], products: [] })
  }

  // Obtén el id del primer tag encontrado
  const tagId = tags[0].id

  // Busca los productos que tienen ese tag
  const products = await productModuleService.listProducts({
    tags: { id: [tagId] }
  })

  res.json({ products })
}