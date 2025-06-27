import { ExecArgs, IProductModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function updateVinilosMetadata({ container }: ExecArgs) {
  const productService = container.resolve(
    Modules.PRODUCT
  ) as IProductModuleService;

  console.log(
    "🚀 Iniciando actualización de metadata para productos Vinilos..."
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

      // Verificar si ya tiene el metadata custom_name
      if (product.metadata && product.metadata.custom_name === "true") {
        console.log(
          `⏩ Producto "${product.title}" ya tiene custom_name: true, saltando...`
        );
        skippedCount++;
        continue;
      }

      // Preservar metadata existente y añadir custom_name
      const currentMetadata = product.metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        custom_name: "true",
      };

      await productService.updateProducts(product.id, {
        metadata: updatedMetadata,
      });

      console.log(
        `✅ Actualizado metadata para "${product.title}": custom_name = true`
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
