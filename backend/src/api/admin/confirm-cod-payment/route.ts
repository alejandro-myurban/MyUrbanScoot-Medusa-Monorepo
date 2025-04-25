import { container } from "@medusajs/framework";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import jwt from "jsonwebtoken";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const token = req.query.token;
  if (!token || typeof token !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Token is required" });
  }

  try {
    // Verificar el token JWT
    const configModule = req.scope.resolve("configModule");

    const jwtSecret = configModule.projectConfig.http.jwtSecret;

    const decoded = jwt.verify(token, jwtSecret) as { order_id: string };

    console.log("Decoded JWT:", decoded);

    const orderId = decoded.order_id;

    const eventModuleService = container.resolve(Modules.EVENT_BUS);

    // Obtener el payment_collection asociado con la orden
    const query = req.scope.resolve("query");
    const { data: orders } = await query.graph({
      entity: "order",
      filters: {
        id: orderId,
      },
      fields: ["payment_collections.*", "payment_collections.payments.*"],
    });

    if (
      !orders ||
      !orders[0] ||
      !orders[0].payment_collections ||
      orders[0].payment_collections.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron colecciones de pago para esta orden",
      });
    }

    // Capturar el pago
    const paymentModuleService = req.scope.resolve(Modules.PAYMENT);
    // Después de obtener la colección de pagos
    const paymentCollection = orders[0].payment_collections[0];

    // Obtener los pagos directamente de la colección de pagos
    const { data: paymentCollectionDetails } = await query.graph({
      entity: "payment_collection",
      filters: {
        id: paymentCollection.id,
      },
      fields: ["payments.*"],
    });

    if (
      !paymentCollectionDetails ||
      !paymentCollectionDetails[0] ||
      !paymentCollectionDetails[0].payments ||
      paymentCollectionDetails[0].payments.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron pagos para esta colección de pago",
      });
    }

    // Responder con éxito
    const payment = paymentCollectionDetails[0].payments[0];
    if (!payment.captured_at) {
      await paymentModuleService.capturePayment({ payment_id: payment.id });
      await eventModuleService.emit({
        name: "order.cod_order_placed",
        data: { id: orderId },
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error al confirmar el pago:", error);
    return res.status(400).json({
      success: false,
      message: "Token inválido o error al procesar el pago",
    });
  }
};

export const AUTHENTICATE = false;
