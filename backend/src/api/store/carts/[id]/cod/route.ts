// src/api/store/carts/[id]/cod/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { manageCODFeeWorkflow } from "workflows/add-cod-fee-to-cart";

interface CODRequestBody {
  payment_provider: string;
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const cart_id = req.params.id;
    const { payment_provider } = req.body as CODRequestBody;

    if (!payment_provider) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "payment_provider es requerido"
      );
    }

    console.log("🔍 COD Endpoint - Executing workflow");
    console.log("  - Cart ID:", cart_id);
    console.log("  - Payment Provider:", payment_provider);

    // Ejecutar el workflow
    const { result } = await manageCODFeeWorkflow.run({
      input: {
        cart_id,
        payment_provider,
      },
      container: req.scope,
    });

    console.log("✅ COD workflow completed successfully");

    // Devolver el carrito actualizado
    res.json({ 
      cart: result.cart,
      success: true 
    });

  } catch (error) {
    console.error("❌ Error en endpoint COD:", error);

    if (error instanceof MedusaError) {
      res
        .status(error.type === MedusaError.Types.NOT_FOUND ? 404 : 400)
        .json({ 
          error: error.message,
          success: false 
        });
    } else {
      res.status(500).json({
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false
      });
    }
  }
}

// OPCIONAL: GET endpoint para verificar el estado del COD fee
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const cart_id = req.params.id;
    
    // Usar useQueryGraphStep directamente para obtener el carrito
    const { data: carts } = await req.scope.resolve("query").graph({
      entity: "cart",
      filters: { id: cart_id },
      fields: [
        "id",
        "items.*",
        "items.metadata",
        "total",
      ],
    });

    const cart = carts[0];
    if (!cart) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Carrito no encontrado"
      );
    }

    // Buscar el item de COD
    const codItem = cart.items.find(
      (item: any) => item.metadata?.is_cod_fee === true
    );

    const codFee = codItem ? (codItem.metadata?.fee_amount || 500) : 0;

    res.json({
      cart_id: cart.id,
      has_cod_fee: !!codItem,
      cod_fee: codFee,
      cod_fee_formatted: codFee > 0 ? `${(codFee / 100).toFixed(2)} EUR` : null,
      total_without_cod: cart.total,
      total_with_cod: cart.total + codFee,
    });

  } catch (error) {
    console.error("❌ Error getting COD status:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}