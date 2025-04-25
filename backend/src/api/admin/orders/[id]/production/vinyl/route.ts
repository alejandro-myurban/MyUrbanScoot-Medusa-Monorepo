// src/api/admin/orders/[id]/production/vinyl/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { container } from "@medusajs/framework";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const eventBus = container.resolve(Modules.EVENT_BUS);

  // acá podrías validar que la orden existe, etc.

  if (!id) return;

  await eventBus.emit({
    name: "order.vinyl_production_requested",
    data: {
      id,
      status: "produccion_vinilos",
      type: "vinyl",
    },
  });

  res.status(200).json({ success: true });
};


