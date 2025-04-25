// src/subscribers/order-next-steps.ts
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";
import {
  IOrderModuleService,
  INotificationModuleService,
} from "@medusajs/framework/types";

/**
 * Después de que la orden se cree (normal o COD), dispara:
 *  - stock await si hace backorder sin stock
 *  - o producción (vinilos/baterías) si no
 */
export default async function handleOrderNextSteps({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve<IOrderModuleService>(Modules.ORDER);
  const eventBus = container.resolve(Modules.EVENT_BUS);
  const query = container.resolve("query");

  // 1) Obtener la orden
  const order = await orderService.retrieveOrder(data.id, {
    relations: ["items"],
  });
  if (!order) {
    console.error(`Order ${data.id} not found`);
    return;
  }

  console.log(`Order ${data.id} next stepsSDASDASDDSSDASD`);

  if (name === "order.placed") {
    // comprobamos si hay algún pago COD pendiente
    const { data: orders } = await query.graph({
      entity: "order",
      filters: { id: order.id },
      fields: ["payment_collections.payments.provider_id"],
    });
    const isCOD = orders[0].payment_collections.some((pc: any) =>
      pc.payments?.some((p: any) => p.provider_id === "pp_system_default")
    );
    if (isCOD) {
      console.log(`Order ${order.id} es COD, esperamos confirmación.`);
      return;
    }
  }
  console.log(`Order ${order.id} next steps (${name})`);
  try {
    let needsStock = false;
    for (const item of order.items) {
      const { data: variants } = await query.graph({
        entity: "variant",
        fields: [
          "allow_backorder",
          "inventory_items.*",
          "manage_inventory",
          "inventory_quantity",
        ],
        filters: {
          id: item.variant_id,
        },
      });

      console.log("variants", variants);
      const v = variants[0];
      if (v?.allow_backorder && v.inventory_items.length === 0) {
        needsStock = true;
        break;
      }
    }
    console.log("needsStock", needsStock);
    if (needsStock) {
      // dispara el flujo de espera de stock
      await eventBus.emit({
        name: "order.status_stock_await",
        data: {
          id: order.id,
          status: "espera_stock",
        },
      });
    } else {
      // sin backorder, dispara producción según tipos en la orden

      console.log("EL ELSE DEBE DISPARAR PRODUCCION");
      const mapEvt: Record<
        string,
        { name: string; status: string; type: string }
      > = {
        Vinilos: {
          name: "order.vinyl_production_requested",
          status: "produccion_vinilos",
          type: "vinyl",
        },
        Baterias: {
          name: "order.battery_production_requested",
          status: "produccion_baterias",
          type: "battery",
        },
      };
      console.log("ORDER ITEMS",order.items)
      // para cada tipo único presente:
      for (const productType of Array.from(
        new Set(order.items.map((i) => i.product_type))
      )) {
        const cfg = mapEvt[productType];
        if (cfg) {
          console.log("cfg", cfg);
          await eventBus.emit({
            name: cfg.name,
            data: {
              id: order.id,
              status: cfg.status,
              type: cfg.type,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error fetching variants:", error);
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.cod_order_placed"],
};
