// src/api/admin/orders/production/vinyl/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { container } from "@medusajs/framework";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { ids } = req.body as { ids: string[] };
  if (!ids?.length) {
    return res.status(400).json({ success: false, message: "Se requieren ids" });
  }

  const orderService = req.scope.resolve(Modules.ORDER);
  const eventBus = container.resolve(Modules.EVENT_BUS);

  await Promise.all(ids.map(async (id) => {
    await orderService.updateOrders([{
      id,
      metadata: {
        ...((await orderService.retrieveOrder(id))?.metadata || {}),
        production_status: "produccion_vinilos",
        production_status_display: "Producción de Vinilos",
        production_status_updated_at: new Date().toISOString(),
      }
    }]);

    await eventBus.emit({
      name: "order.vinyl_production_requested",
      data: { id, status: "produccion_vinilos", type: "vinyl" },
    });
  }));

  return res.status(200).json({ success: true });
};


