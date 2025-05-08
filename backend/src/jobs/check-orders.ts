// src/jobs/check-orders-7days.ts
import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function checkOrders7DaysJob(container: MedusaContainer) {
  const eventModuleService = container.resolve(Modules.EVENT_BUS);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "created_at"],
    filters: {
      created_at: {
        $gte: new Date(sevenDaysAgo.setHours(0, 0, 0, 0)),
        $lte: new Date(sevenDaysAgo.setHours(23, 59, 59, 999)),
      },
    },
  });

  for (const order of orders) {
    // Emite el evento personalizado
    await eventModuleService.emit({
      name: "order.check_orders_7days",
      data: {
        id: order.id,
        customer_id: order.customer_id,
      },
    });
  }
}

export const config = {
  name: "check-orders-7days",
  schedule: "0 12 * * *",
}; 
