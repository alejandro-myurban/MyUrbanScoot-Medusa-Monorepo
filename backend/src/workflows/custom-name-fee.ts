import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import {
  useQueryGraphStep,
  addToCartWorkflow,
} from "@medusajs/medusa/core-flows";

type Input = {
  cart_id: string;
  quantity?: number;
};

export const addCustomLineItemIfCustomNameWorkflow = createWorkflow(
  "add-custom-line-item-if-custom-name-or-number",
  ({ cart_id, quantity = 1 }: Input) => {
    const NAME_FEE_VARIANT_ID = "variant_01JV4R20FJ07VWECNGVKSY76HM";
    const NUMBER_FEE_VARIANT_ID = "variant_01JV7720S8EAQ6VHJWRMWVHRFY";

    console.log("🔍 Iniciando workflow para cart_id:", cart_id);

    // 1️⃣ Traemos el carrito completo
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: [
        "id",
        "items.*",
        "items.metadata",
        "items.variant_id",
        "items.variant.product_id",
      ],
    });

    // 2️⃣ Calculamos qué fees faltan
    const missingFeeItems = transform(
      { carts, quantity },
      ({ carts, quantity }) => {
        const cart = carts[0];
        if (!cart) {
          console.log("❌ No se encontró el carrito");
          return [];
        }

        console.log("🔍 Analizando items del carrito:", cart.items.length);

        const existingFees = cart.items.filter((i: any) => i.metadata?.is_fee);
        console.log("💰 Fees existentes:", existingFees.length);

        const hasFee = (productId: string, feeType: string) =>
          existingFees.some(
            (f: any) =>
              f.metadata.original_product_id === productId &&
              f.metadata.fee_type === feeType
          );

        const toAdd: Array<{
          variant_id: string;
          quantity: number;
          metadata: Record<string, any>;
        }> = [];

        for (const item of cart.items) {
          const pid = item.variant.product_id;
          console.log("📋 Procesando item:", {
            product_id: pid,
            custom_name: item.metadata?.custom_name,
            custom_number: item.metadata?.custom_number,
          });

          if (item.metadata?.custom_name && !hasFee(pid, "name")) {
            console.log("➕ Agregando fee de nombre para producto:", pid);
            toAdd.push({
              variant_id: NAME_FEE_VARIANT_ID,
              quantity,
              metadata: {
                original_product_id: pid,
                is_fee: true,
                fee_type: "name",
              },
            });
          }

          if (
            item.metadata?.custom_number !== undefined &&
            !hasFee(pid, "number")
          ) {
            console.log("➕ Agregando fee de número para producto:", pid);
            toAdd.push({
              variant_id: NUMBER_FEE_VARIANT_ID,
              quantity,
              metadata: {
                original_product_id: pid,
                is_fee: true,
                fee_type: "number",
              },
            });
          }
        }

        console.log("📝 Items a agregar:", toAdd.length, toAdd);
        return toAdd;
      }
    );

    // 3️⃣ SIEMPRE ejecutar addToCart - será un no-op si no hay items
    console.log("🚀 Ejecutando addToCartWorkflow (siempre)");
    const addToCartResult = addToCartWorkflow.runAsStep({
      input: {
        cart_id,
        items: missingFeeItems,
      },
    });

    // 4️⃣ Refetch del carrito DESPUÉS de addToCart
    const { data: updatedCarts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "items.*", "items.metadata", "items.variant_id"],
    }).config({ name: "refetch-cart" });

    // 5️⃣ Resultado final
    const finalResult = transform(
      { 
        updatedCarts, 
        addToCartResult,
        missingFeeItems
      },
      ({ updatedCarts, addToCartResult, missingFeeItems }) => {
        const cart = updatedCarts[0];
        
        console.log("✅ Workflow completado:");
        console.log("  - Items finales en carrito:", cart?.items?.length);
        console.log("  - Items que se debían agregar:", missingFeeItems.length);
        console.log("  - AddToCart ejecutado: SÍ (siempre se ejecuta)");
        console.log("  - AddToCart resultado:", addToCartResult ? "SUCCESS" : "ERROR");
        
        // Verificar si realmente se agregaron los items
        const feeItems = cart?.items?.filter((item: any) => item.metadata?.is_fee) || [];
        console.log("  - Fee items encontrados en carrito final:", feeItems.length);
        
        return {
          cart,
          itemsAdded: missingFeeItems,
          wasExecuted: true,
          addToCartResult,
          feeItemsInCart: feeItems.length
        };
      }
    );

    return new WorkflowResponse(finalResult);
  }
);