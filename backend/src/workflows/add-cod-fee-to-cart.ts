import {
  createWorkflow,
  WorkflowResponse,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk";
import {
  useQueryGraphStep,
  addToCartWorkflow,
  deleteLineItemsWorkflow,
} from "@medusajs/medusa/core-flows";

type Input = {
  cart_id: string;
  payment_provider: string;
};

export const manageCODFeeWorkflow = createWorkflow(
  "manage-cod-fee-workflow",
  ({ cart_id, payment_provider }: Input) => {
    // ID del variant para el COD fee - ACTUALIZA ESTO CON TU VARIANT ID
    const COD_FEE_VARIANT_ID = "variant_01JZ5KBPXMD6DDV5M432VR9H2H"; // ← Pon aquí el variant_id de tu producto COD

    // 1️⃣ Traemos el carrito completo
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: [
        "id",
        "items.*",
        "items.metadata",
        "items.variant_id",
        "items.quantity",
      ],
    });

    console.log("🔍 COD Workflow - Fetching cart");

    // 2️⃣ Determinamos si necesitamos añadir o eliminar el COD fee
    const codFeeAction = transform(
      { carts, payment_provider },
      ({ carts, payment_provider }) => {
        const cart = carts[0];
        if (!cart) {
          return { action: "none", items: [] };
        }

        // Buscar si ya existe un item de COD fee
        const existingCodItem = cart.items.find(
          (item: any) => item.metadata?.is_cod_fee === true
        );

        // Si el payment provider es COD
        if (payment_provider === "pp_system_default") {
          // Si NO existe el item de COD, lo añadimos
          if (!existingCodItem) {
            return {
              action: "add",
              items: [{
                variant_id: COD_FEE_VARIANT_ID,
                quantity: 1,
                metadata: {
                  is_cod_fee: true,
                  fee_type: "cod",
                  fee_description: "Gastos contrareembolso",
                  fee_amount: 5, // 5.00 EUR en centavos
                },
              }],
            };
          }
          // Si ya existe, no hacemos nada
          return { action: "none", items: [] };
        } else {
          // Si el payment provider NO es COD pero existe el item, lo eliminamos
          if (existingCodItem) {
            return {
              action: "delete",
              items: [existingCodItem.id],
            };
          }
          // Si no existe, no hacemos nada
          return { action: "none", items: [] };
        }
      }
    );

    console.log("🔍 COD Workflow - Action determined");

    // 3️⃣ Ejecutar la acción correspondiente
    
    // Si hay que añadir el COD fee
    const shouldAdd = transform(
      codFeeAction, 
      (action) => action.action === "add"
    );

    when(shouldAdd, (add) => add).then(() => {
      const itemsToAdd = transform(
        codFeeAction,
        (action) => action.items
      );

      addToCartWorkflow.runAsStep({
        input: {
          cart_id,
          items: itemsToAdd,
        },
      });

      console.log("✅ COD fee added to cart");
    });

    // Si hay que eliminar el COD fee
    const shouldDelete = transform(
      codFeeAction,
      (action) => action.action === "delete"
    );

    when(shouldDelete, (del) => del).then(() => {
      const itemsToDelete = transform(
        codFeeAction,
        (action) => action.items
      );

      deleteLineItemsWorkflow.runAsStep({
        input: {
          cart_id,
          ids: itemsToDelete,
        },
      });

      console.log("✅ COD fee removed from cart");
    });

    // 4️⃣ Refetch para devolver el carrito actualizado
    const { data: updatedCarts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: [
        "id",
        "items.*",
        "items.metadata",
        "items.variant_id",
        "items.quantity",
        "total",
        "subtotal",
      ],
    }).config({ name: "refetch-cart-after-cod" });

    // 5️⃣ Calcular totales con COD si aplica
    const cartWithCodInfo = transform(
      { updatedCarts },
      ({ updatedCarts }) => {
        const cart = updatedCarts[0];
        if (!cart) return cart;

        // Buscar el item de COD en el carrito actualizado
        const codItem = cart.items.find(
          (item: any) => item.metadata?.is_cod_fee === true
        );

        const codFee = codItem ? (codItem.metadata?.fee_amount || 500) : 0;

        return {
          ...cart,
          cod_fee: codFee,
          cod_fee_formatted: codFee > 0 ? `${(codFee / 100).toFixed(2)} EUR` : null,
          has_cod_fee: !!codItem,
          total_with_cod: cart.total + codFee,
        };
      }
    );

    return new WorkflowResponse({ cart: cartWithCodInfo });
  }
);

// Alternativa: Workflow simplificado si prefieres manejarlo con metadata
export const manageCODFeeWithMetadataWorkflow = createWorkflow(
  "manage-cod-fee-metadata-workflow",
  ({ cart_id, payment_provider }: Input) => {
    // 1️⃣ Traemos el carrito
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "metadata", "total"],
    });

    // 2️⃣ Actualizamos la metadata según el payment provider
    const updatedMetadata = transform(
      { carts, payment_provider },
      ({ carts, payment_provider }) => {
        const cart = carts[0];
        if (!cart) return {};

        const currentMetadata = cart.metadata || {};

        if (payment_provider === "pp_system_default") {
          return {
            ...currentMetadata,
            cod_fee: 500, // 5.00 EUR en centavos
            cod_fee_description: "Gastos contrareembolso",
            payment_method_type: "cod",
            has_cod_fee: true,
          };
        } else {
          // Eliminar propiedades de COD
          const { cod_fee, cod_fee_description, payment_method_type, has_cod_fee, ...rest } = currentMetadata;
          return rest;
        }
      }
    );

    // 3️⃣ Actualizamos el carrito con la nueva metadata
    // Nota: Necesitarás implementar un step para actualizar metadata
    // o usar el updateCartWorkflow si está disponible

    return new WorkflowResponse({ 
      cart_id,
      metadata: updatedMetadata,
      message: "COD fee metadata updated"
    });
  }
);