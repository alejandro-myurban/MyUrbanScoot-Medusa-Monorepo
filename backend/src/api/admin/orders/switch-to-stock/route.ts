// src/api/routes/admin/orders/switch-to-stock.ts
import { container } from "@medusajs/framework";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules, MedusaError } from "@medusajs/framework/utils";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { ids, day, month } = req.body as {
    ids?: string[];
    day?: string;
    month?: string;
  };

  if (!Array.isArray(ids) || ids.length === 0 || !day || !month) {
    return res
      .status(400)
      .json({ success: false, message: "Se requieren ids, day y month" });
  }

  const orderService = req.scope.resolve(Modules.ORDER);
  const eventBus = container.resolve(Modules.EVENT_BUS);

  try {
    // Para cada orden, actualizamos metadata y emitimos evento
    for (const id of ids) {
      const order = await orderService.retrieveOrder(id);
      if (!order) {
        // Si no existe, saltamos esa ID
        console.warn(`Orden ${id} no encontrada, se omite`);
        continue;
      }

      const newMetadata = {
        ...order.metadata,
        production_status: "espera_stock",
        production_status_display: "En espera de stock",
        production_status_updated_at: new Date().toISOString(),
        stock_await_day: day,
        stock_await_month: month,
      };

      // Actualizamos la orden
      await orderService.updateOrders([{ id, metadata: newMetadata }]);

      // Emitimos evento para que el subscriber envíe el email
      await eventBus.emit({
        name: "order.status_stock_await_email",
        data: {
          id: order.id,
          status: "espera_stock",
          day,
          month,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Se marcaron ${ids.length} orden${
        ids.length > 1 ? "es" : ""
      } en espera de stock`,
    });
  } catch (err) {
    console.error("Error al procesar switch-to-stock:", err);
    const e = err as MedusaError;
    return res
      .status(e.type === MedusaError.Types.NOT_FOUND ? 404 : 500)
      .json({ success: false, message: e.message });
  }
};

