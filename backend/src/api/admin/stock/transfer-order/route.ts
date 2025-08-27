import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { transferAsOrderWorkflow } from "../../../../workflows/transfer-as-order-workflow";

// Tipo para el request body
type CreateTransferOrderRequest = {
  inventoryItemId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  productId: string;
  productTitle: string;
  performedBy?: string;
  reason?: string;
  notes?: string;
  expected_delivery_date?: string;
};

export async function POST(
  req: MedusaRequest<CreateTransferOrderRequest>,
  res: MedusaResponse
) {
  console.log("🚀 API: Iniciando transferencia como pedido...");

  try {
    const {
      inventoryItemId,
      fromLocationId,
      toLocationId,
      quantity,
      productId,
      productTitle,
      performedBy,
      reason,
      notes,
      expected_delivery_date
    } = req.body;

    // Validaciones básicas
    if (!inventoryItemId || !fromLocationId || !toLocationId || !quantity || !productId) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos obligatorios: inventoryItemId, fromLocationId, toLocationId, quantity, productId"
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: "La cantidad debe ser mayor a 0"
      });
    }

    if (fromLocationId === toLocationId) {
      return res.status(400).json({
        success: false,
        error: "Las ubicaciones de origen y destino no pueden ser iguales"
      });
    }

    console.log("📋 API: Datos validados, ejecutando workflow...");
    console.log(`   - Producto: ${productTitle} (${productId})`);
    console.log(`   - Cantidad: ${quantity}`);
    console.log(`   - Desde: ${fromLocationId} → Hacia: ${toLocationId}`);

    // Preparar datos para el workflow
    const workflowInput = {
      inventoryItemId,
      fromLocationId,
      toLocationId,
      quantity,
      productId,
      productTitle,
      // @ts-ignore
      performedBy: performedBy || req.auth?.user_id || "system",
      reason: reason || "Transferencia solicitada via API",
      notes,
      expected_delivery_date: expected_delivery_date ? new Date(expected_delivery_date) : undefined
    };

    // Ejecutar workflow híbrido
    const workflowResult = await transferAsOrderWorkflow.run({
      input: workflowInput,
      context: {
             // @ts-ignore
        manager: req.scope.manager,
      },
    });

    console.log("✅ API: Workflow completado exitosamente");
    console.log("📋 API: Pedido creado:", workflowResult.result.order.orderDisplayId);

    // Respuesta exitosa
    return res.status(201).json({
      success: true,
      message: "Transferencia creada como pedido y ejecutada correctamente",
      data: {
        transferId: workflowResult.result.transfer.transferId,
        orderId: workflowResult.result.order.orderId,
        orderDisplayId: workflowResult.result.order.orderDisplayId,
        sourceLocation: workflowResult.result.order.sourceLocationName,
        destinationLocation: workflowResult.result.order.destLocationName,
        quantityTransferred: workflowResult.result.transfer.quantityTransferred,
        stockMovement: {
          originBefore: workflowResult.result.transfer.originStockBefore,
          originAfter: workflowResult.result.transfer.originStockAfter,
          destBefore: workflowResult.result.transfer.destStockBefore,
          destAfter: workflowResult.result.transfer.destStockAfter
        }
      }
    });

  } catch (error: any) {
    console.error("❌ API ERROR:", error);

    // Determinar tipo de error y código de respuesta
    let statusCode = 500;
    let errorMessage = "Error interno del servidor";

    if (error.message?.includes("Stock insuficiente")) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message?.includes("No hay stock")) {
      statusCode = 404;
      errorMessage = error.message;
    } else if (error.message?.includes("validación")) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? {
        stack: error.stack,
        type: error.constructor.name
      } : undefined
    });
  }
}

// Endpoint para obtener estadísticas de transferencias como pedidos
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log("📊 API: Obteniendo estadísticas de transferencias...");

    const supplierService = req.scope.resolve("supplierService");
         // @ts-ignore
    const stats = await supplierService.getTransferStatistics();

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        message: "Estadísticas de transferencias como pedidos"
      }
    });

  } catch (error: any) {
    console.error("❌ API ERROR al obtener estadísticas:", error);
    
    return res.status(500).json({
      success: false,
      error: "Error al obtener estadísticas de transferencias",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}