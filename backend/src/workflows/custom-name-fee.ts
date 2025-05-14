import {
  createWorkflow,
  WorkflowResponse,
  transform,
  when,
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
    // IDs de los variants de tarifa según el tipo
    const NAME_FEE_VARIANT_ID = "variant_01JV4R20FJ07VWECNGVKSY76HM";
    const NUMBER_FEE_VARIANT_ID = "variant_01JV7720S8EAQ6VHJWRMWVHRFY";

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

    // 2️⃣ Calculamos qué fees faltan y qué variant_id usar para cada uno
    const missingFeeItems = transform(
      { carts, quantity },
      ({ carts, quantity }) => {
        const cart = carts[0];
        if (!cart) return [];

        // Todos los fees ya presentes para evitar duplicados
        const existingFees = cart.items.filter((i: any) => i.metadata?.is_fee);

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

          // custom_name ➡ fee de tipo "name"
          if (item.metadata?.custom_name && !hasFee(pid, "name")) {
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

          // custom_number ➡ fee de tipo "number"
          if (
            item.metadata?.custom_number !== undefined &&
            !hasFee(pid, "number")
          ) {
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

        return toAdd;
      }
    );

    // 3️⃣ Sólo si hay fees pendientes, lanzamos la adición en bloque
    const shouldAdd = transform(missingFeeItems, (items) => items.length > 0);

    when(shouldAdd, (add) => add).then(() => {
      addToCartWorkflow.runAsStep({
        input: {
          cart_id,
          items: missingFeeItems,
        },
      });
    });

    // 4️⃣ Refetch para devolver el carrito actualizado
    // @ts-ignore
    const { data: updatedCarts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "items.*", "items.metadata"],
    }).config({ name: "refetch-cart" });

    return new WorkflowResponse({ cart: updatedCarts[0] });
  }
);
