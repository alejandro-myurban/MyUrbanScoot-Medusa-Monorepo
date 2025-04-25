// import { Modules } from "@medusajs/framework/utils";
// import { IOrderModuleService } from "@medusajs/framework/types";
// import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";

// export default async function backorderHandler({
//   event: { data },
//   container,
// }: SubscriberArgs<any>) {
//   const orderService: IOrderModuleService = container.resolve(Modules.ORDER);
//   const eventBus = container.resolve(Modules.EVENT_BUS);

//   // Trae la orden con items, cada item con su variante y los inventory_items de esa variante
//   const order = await orderService.retrieveOrder(data.id, {
//     relations: ["items", "items.variant", "items.variant.inventory_items"],
//   });

//   // Recorremos los items para ver si hay backorder
//   for (const item of order.items) {
//     const variant = (item as any).variant;
//     if (variant.allow_backorder && variant.inventory_items.length === 0) {
//       // Emitimos un evento por cada variante en backorder
//       await eventBus.emit({
//         name: "order.backorder_requested",
//         data: {
//           order_id: order.id,
//           variant_id: variant.id,
//           quantity: item.quantity,
//         },
//       });
//     }
//   }
// }

// export const config: SubscriberConfig = {
//   event: ["order.placed"],
// };
