import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { capturePaymentWorkflow } from "@medusajs/medusa/core-flows";

export async function POST(
  req: MedusaRequest & { body: { ids: string[] } },
  res: MedusaResponse
) {
  console.log("=== Endpoint /admin/orders/process-batch reached ===");
  const { ids } = req.body;
  console.log("IDs recibidos:", ids);
  const query = req.scope.resolve("query");

  try {
    for (const orderId of ids) {
      console.log(`Procesando la orden ${orderId}`);

      // Obtener la orden con sus payment collections
      const { data: orders } = await query.graph({
        entity: "order",
        filters: {
          id: orderId,
        },
        fields: ["payment_collections.*", "payment_collections.payments.*"],
      });

      if (!orders || orders.length === 0) {
        console.log(`No se encontró la orden para el ID: ${orderId}`);
        continue; // Saltamos esta iteración si no se encuentra la orden
      }

      const order = orders[0];

      if (order?.payment_collections?.length) {
        for (const paymentCollection of order.payment_collections) {
          if (paymentCollection.payments?.length) {
            for (const payment of paymentCollection.payments) {
              if (!payment.captured_at) {
                // Solo capturar pagos no capturados
                console.log(
                  `Capturando el pago ${payment.id} para la orden ${orderId}`
                );
                // Intentamos capturar el pago y, si falla, capturamos el error pero continuamos con el siguiente
                try {
                  await capturePaymentWorkflow(req.scope).run({
                    input: {
                      payment_id: payment.id,
                    },
                  });
                } catch (innerError) {
                  console.error(
                    `Error al capturar el pago ${payment.id} para la orden ${orderId}:`,
                    innerError
                  );
                  // Podrías decidir si abortar completamente o continuar con las demás órdenes.
                  // Por ejemplo, para continuar simplemente no lanzar el error.
                }
              }
            }
          } else {
            console.log(
              `No hay pagos en el payment collection para la orden ${orderId}`
            );
          }
        }
      } else {
        console.log(`La orden ${orderId} no tiene payment collections.`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error procesando órdenes en batch:", error);
    res.status(500).json({ error: error.message });
  }
}
