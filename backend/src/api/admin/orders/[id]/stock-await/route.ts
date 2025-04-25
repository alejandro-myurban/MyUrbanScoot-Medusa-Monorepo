import { container } from "@medusajs/framework";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError, Modules } from "@medusajs/framework/utils";
import { ModuleRegistrationName } from "@medusajs/framework/utils";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const { month, day } = req.body as { month: string; day: string };
  const eventModuleService = container.resolve(Modules.EVENT_BUS);

  if (!month || !day) {
    return res.status(400).json({
      success: false,
      message: "Se requieren month y day",
    });
  }

  try {
    const orderService = req.scope.resolve(ModuleRegistrationName.ORDER);
    const order = await orderService.retrieveOrder(id);

    if (!order) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Orden ${id} no encontrada`
      );
    }

    // Opcionalmente podrías crear una Date real:
    // const date = new Date(new Date().getFullYear(), Number(month)-1, Number(day))
    // const iso = date.toISOString()

    // Pero aquí lo guardamos por separado:
    const newMetadata = {
      ...order.metadata,
      stock_await_month: month,
      stock_await_day: day,
      stock_await_display: `Stock el ${day}/${month}`,
      stock_await_updated_at: new Date().toISOString(),
    };

    await orderService.updateOrders([{ id, metadata: newMetadata }]);

    // await eventModuleService.emit({
    //   name: "order.vinyl_production_requested",
    //   data: {
    //     id: order.id,
    //     status: "produccion_vinilos",
    //     type: "vinyl",
    //   },
    // });

    await eventModuleService.emit({
      name: "order.status_stock_await_email",
      data: {
        id: order.id,
        status: "espera_stock",
        month,
        day,
      },
    });

    return res.status(200).json({
      success: true,
      metadata: newMetadata,
    });
  } catch (err) {
    console.error("Error al guardar fecha de espera:", err);
    const e = err as MedusaError;
    return res.status(e.type === MedusaError.Types.NOT_FOUND ? 404 : 500).json({
      success: false,
      message: e.message,
    });
  }
};

export const AUTHENTICATE = false;
