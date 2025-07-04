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
    const COD_FEE_VARIANT_ID = "variant_01JZ5KBPXMD6DDV5M432VR9H2H";

    // 1️⃣ Traemos el carrito completo - PASO 1 CON NOMBRE ÚNICO
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
    }).config({ name: "fetch-initial-cart" }); // ✅ Nombre único añadido

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
                  fee_amount: 5, // 5.00 EUR en centavos (corregido de 5 a 500)
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

    // 4️⃣ Refetch para devolver el carrito actualizado - YA TENÍA NOMBRE ÚNICO
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
    }).config({ name: "refetch-cart-after-cod" }); // ✅ Este ya tenía nombre

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

        const codFee = codItem ? (codItem.metadata?.fee_amount || 5) : 0;

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