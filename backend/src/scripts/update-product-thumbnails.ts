// src/scripts/update-product-thumbnails.ts
import { ExecArgs, IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function updateProductThumbnails({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT) as IProductModuleService

  console.log("🚀 Iniciando actualización de thumbnails...")

  // Obtener todos los productos con imágenes
  const products = await productService.listProducts({}, {
    relations: ["images"]
  })

  console.log(`📦 Encontrados ${products.length} productos`)

  let updatedCount = 0
  let skippedCount = 0

  for (const product of products) {
    try {
      if (product.thumbnail) {
        console.log(`⏩ Producto "${product.title}" ya tiene thumbnail, saltando...`)
        skippedCount++
        continue
      }

      if (!product.images || product.images.length === 0) {
        console.log(`⚠️  Producto "${product.title}" no tiene imágenes`)
        skippedCount++
        continue
      }

      const firstImageUrl = product.images[0].url

      await productService.updateProducts(product.id, {
        thumbnail: firstImageUrl
      })

      console.log(`✅ Actualizado thumbnail para "${product.title}": ${firstImageUrl}`)
      updatedCount++

    } catch (error) {
      console.error(`❌ Error actualizando producto "${product.title}":`, error)
    }
  }

  console.log("\n📊 Resumen:")
  console.log(`✅ Productos actualizados: ${updatedCount}`)
  console.log(`⏩ Productos saltados: ${skippedCount}`)
  console.log(`📦 Total procesados: ${products.length}`)
}