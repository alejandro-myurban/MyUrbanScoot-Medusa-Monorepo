import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import {
  useQueryGraphStep,
  deleteLineItemsWorkflow,
} from "@medusajs/medusa/core-flows";

export const deleteRelatedLineItemsWorkflow = createWorkflow(
  "delete-related-line-items",
  ({ cart_id, line_item_id }: { cart_id: string; line_item_id: string }) => {
    // 1. Recupera el carrito y sus line items
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: [
        "id",
        "items.id",
        "items.variant_id",
        "items.variant.product_id",
        "items.metadata",
      ],
    });

    // 2. Identifica los items relacionados a eliminar
    const itemsToRemove = transform({ carts, line_item_id }, (data) => {
      const cart = data.carts[0];
      if (!cart) return [data.line_item_id]; // Al menos eliminar el item solicitado

      const itemToDelete = cart.items.find(
        (item: any) => item.id === data.line_item_id
      );
      if (!itemToDelete) return [data.line_item_id]; // Al menos eliminar el item solicitado

      const idsToRemove = [data.line_item_id]; // Siempre incluimos el item original

      // Caso 1: Si el item a eliminar es un producto normal, buscar tarifas asociadas
      if (!itemToDelete.metadata?.is_fee) {
        const productId = itemToDelete.variant?.product_id;
        if (productId) {
          // Buscar todos los items que referencian a este productId como "original_product_id"
          cart.items.forEach((item: any) => {
            if (
              item.metadata?.is_fee &&
              item.metadata?.original_product_id === productId
            ) {
              idsToRemove.push(item.id);
            }
          });
        }
      }

      // Caso 2: Si el item a eliminar es una tarifa, buscar el producto original
      else if (itemToDelete.metadata?.is_fee) {
        const originalProductId = itemToDelete.metadata?.original_product_id;
        if (originalProductId) {
          // Buscar todos los productos que tienen este product_id
          cart.items.forEach((item: any) => {
            if (
              item.variant?.product_id === originalProductId &&
              !item.metadata?.is_fee
            ) {
              idsToRemove.push(item.id);
            }
          });
        }
      }

      return idsToRemove;
    });

    // 3. Verificar que hay items para eliminar
    const hasItemsToRemove = transform(itemsToRemove, (ids) => ids.length > 0);

    // 4. Solo ejecutar si hay items para eliminar
    if (hasItemsToRemove) {
      deleteLineItemsWorkflow.runAsStep({
        input: {
          cart_id,
          ids: itemsToRemove,
        },
      });
    }

    // 5. Recupera el carrito actualizado para devolver
    const { data: updatedCarts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "items.*", "items.metadata"],
    }).config({ name: "refetch-cart" });

    return new WorkflowResponse({ cart: updatedCarts[0] });
  }
);
