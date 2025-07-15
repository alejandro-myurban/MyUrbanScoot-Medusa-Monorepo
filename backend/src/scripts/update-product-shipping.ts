import { ExecArgs, IProductModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function updateVinilosShippingMetadata({ container }: ExecArgs) {
  const productService = container.resolve(
    Modules.PRODUCT
  ) as IProductModuleService;

  console.log(
    "🚀 Iniciando actualización de metadata de shipping y producción para productos Vinilos..."
  );

  // Obtener todos los productos con su type
  const products = await productService.listProducts(
    {},
    {
      relations: ["type"],
    }
  );

  console.log(`📦 Encontrados ${products.length} productos`);

  let updatedCount = 0;
  let skippedCount = 0;
  let vinilosFoundCount = 0;

  for (const product of products) {
    try {
      // Verificar si el producto es de tipo "Vinilos"
      if (!product.type || product.type.value !== "Vinilos") {
        skippedCount++;
        continue;
      }

      vinilosFoundCount++;

      // Verificar si ya tiene los metadata necesarios
      const hasShippingTime = product.metadata?.shipping_time === "2";
      const hasProductionTime = product.metadata?.estimated_production_time === "2";

      if (hasShippingTime && hasProductionTime) {
        console.log(
          `⏩ Producto "${product.title}" ya tiene shipping_time y estimated_production_time configurados, saltando...`
        );
        skippedCount++;
        continue;
      }

      // Preservar metadata existente y añadir los nuevos campos
      const currentMetadata = product.metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        shipping_time: "2",
        estimated_production_time: "2",
      };

      await productService.updateProducts(product.id, {
        metadata: updatedMetadata,
      });

      console.log(
        `✅ Actualizado metadata para "${product.title}": shipping_time = 2, estimated_production_time = 2`
      );
      updatedCount++;
    } catch (error) {
      console.error(
        `❌ Error actualizando producto "${product.title}":`,
        error
      );
    }
  }

  console.log("\n📊 Resumen:");
  console.log(`🎨 Productos tipo "Vinilos" encontrados: ${vinilosFoundCount}`);
  console.log(`✅ Productos actualizados: ${updatedCount}`);
  console.log(`⏩ Productos saltados: ${skippedCount}`);
  console.log(`📦 Total procesados: ${products.length}`);
}