// src/api/routes/admin/orders/switch-to-delivered.ts
import { container } from "@medusajs/framework";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules, MedusaError } from "@medusajs/framework/utils";
import { createOrderFulfillmentWorkflow } from "@medusajs/medusa/core-flows";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { ids } = req.body as { ids?: string[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Se requieren ids de órdenes" });
  }

  const orderService = req.scope.resolve(Modules.ORDER);
  const eventBus = container.resolve(Modules.EVENT_BUS);

  try {
    for (const id of ids) {
      // 1) recuperar la orden con sus items
      const order = await orderService.retrieveOrder(id, {
        relations: ["items"],
      });
      if (!order) {
        console.warn(`Orden ${id} no encontrada, se omite`);
        continue;
      }

      // 2) armar el payload de items para el workflow
      const itemsToFulfill = order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));

      // 3) ejecutar el core-flow de fulfillment
      await createOrderFulfillmentWorkflow(req.scope).run({
        input: {
          order_id: id,
          items: itemsToFulfill,
        },
      });

      // 4) emitir evento “status_delivered”
      await eventBus.emit({
        name: "order.status_delivered",
        data: { id },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Se marcaron ${ids.length} orden${
        ids.length > 1 ? "es" : ""
      } como entregadas`,
    });
  } catch (err) {
    console.error("Error en switch-to-delivered:", err);
    const e = err as MedusaError;
    return res
      .status(e.type === MedusaError.Types.NOT_FOUND ? 404 : 500)
      .json({ success: false, message: e.message });
  }
};
