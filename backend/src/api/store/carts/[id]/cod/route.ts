// src/api/store/carts/[id]/cod/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { MedusaError } from "@medusajs/framework/utils";

interface CODRequestBody {
  payment_provider: string;
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const cart_id = req.params.id;

    console.log("🔍 COD Endpoint Debug:");
    const { payment_provider } = req.body as CODRequestBody;
    console.log("  - Body:", req.body);
    console.log("  - Body type:", typeof req.body);

    if (!payment_provider) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "payment_provider es requerido"
      );
    }

    console.log("🔍 Payment provider:", payment_provider);

    // Resolver el servicio del módulo Cart
    const cartModuleService = req.scope.resolve(Modules.CART);

    // Obtener el carrito actual
    const cart = await cartModuleService.retrieveCart(cart_id, {
      relations: ["items"],
    });

    if (!cart) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Carrito no encontrado"
      );
    }

    const COD_FEE_AMOUNT = 5;
    const COD_ITEM_TITLE = "Gastos contrareembolso";
    const COD_ITEM_METADATA = { is_cod_fee: true };
    const COD_VARIANT_TITLE = "Impuesto adicional";

    // Buscar si ya existe un item de COD en el carrito
    const existingCodItem = cart.items?.find(
      (item) => item.metadata?.is_cod_fee === true
    );

    console.log(
      "🔍 Existing COD item:",
      existingCodItem ? "Found" : "Not found"
    );

    if (payment_provider === "pp_system_default") {
      // Si el provider es COD y no existe el item, lo añadimos
      if (!existingCodItem) {
        console.log("🔄 Adding COD fee item...");
        await cartModuleService.addLineItems([
          {
            cart_id: cart_id,
            thumbnail:
              "https://bucket-production-5197.up.railway.app/medusa-media/photobox-01JXMRHDX00RF3REG9QSGK5G7T.jpg",
            title: COD_ITEM_TITLE,
            product_title: COD_ITEM_TITLE,
            unit_price: COD_FEE_AMOUNT,
            variant_title: COD_VARIANT_TITLE,
            quantity: 1,
            metadata: COD_ITEM_METADATA,
          },
        ]);
        console.log("✅ COD fee item added");
      } else {
        console.log("ℹ️ COD fee item already exists");
      }
    } else {
      // Si el provider no es COD pero existe el item, lo eliminamos
      if (existingCodItem) {
        console.log("🔄 Removing COD fee item...");
        await cartModuleService.deleteLineItems([existingCodItem.id]);
        console.log("✅ COD fee item removed");
      } else {
        console.log("ℹ️ No COD fee item to remove");
      }
    }

    // Devolver el carrito actualizado
    const updatedCart = await cartModuleService.retrieveCart(cart_id, {
      relations: ["items", "shipping_address", "billing_address"],
    });

    console.log("✅ COD endpoint completed successfully");
    res.json({ cart: updatedCart });
  } catch (error) {
    console.error("❌ Error en endpoint COD:", error);

    if (error instanceof MedusaError) {
      res
        .status(error.type === MedusaError.Types.NOT_FOUND ? 404 : 400)
        .json({ error: error.message });
    } else {
      res.status(500).json({
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
