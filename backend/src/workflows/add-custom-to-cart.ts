import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { addToCartWorkflow } from "@medusajs/medusa/core-flows";

type AddCustomToCartWorkflowInput = {
  cart_id: string;
  items: Array<{
    variant_id: string;
    quantity: number;
    unit_price: number; // Precio rebajado calculado en tu widget
    metadata?: Record<string, unknown>;
  }>;
};

export const addCustomToCartWorkflow = createWorkflow(
  "add-custom-to-cart",
  ({ cart_id, items }: AddCustomToCartWorkflowInput) => {
    // Primer uso: no necesita nombre extra
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "currency_code"],
    });

    const itemsToAdd = transform({ items }, (data) => {
      return Array.isArray(data.items)
        ? data.items.map((item) => ({
            ...item,
            unit_price: item.unit_price,
          }))
        : [];
    });

    addToCartWorkflow.runAsStep({
      input: {
        items: itemsToAdd,
        cart_id,
      },
    });

    // Segundo uso: asigna un nombre único
    const { data: updatedCarts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "items.*"],
    }).config({ name: "refetch-cart" });

    return new WorkflowResponse({ cart: updatedCarts[0] });
  }
);
