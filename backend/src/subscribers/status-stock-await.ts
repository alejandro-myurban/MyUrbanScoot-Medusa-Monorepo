// import { Modules } from "@medusajs/framework/utils";
// import {
//   INotificationModuleService,
//   IOrderModuleService,
// } from "@medusajs/framework/types";
// import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
// import { EmailTemplates } from "../modules/email-notifications/templates";

// export default async function statusAwaitHandler({
//   event: { data },
//   container,
// }: SubscriberArgs<any>) {
//   const notificationModuleService: INotificationModuleService =
//     container.resolve(Modules.NOTIFICATION);
//   const orderModuleService: IOrderModuleService = container.resolve(
//     Modules.ORDER
//   );
//   const eventModuleService = container.resolve(Modules.EVENT_BUS);

//   const order = await orderModuleService.retrieveOrder(data.id, {
//     relations: ["items", "summary", "shipping_address"],
//   });

//   await eventModuleService.emit({
//     name: "order.stock_await_change",
//     data: {
//       id: order.id,
//       status: "espera_stock",
//       type: "stock",
//     },
//   });

//   try {
//     await notificationModuleService.createNotifications({
//       to: order.email,
//       channel: "email",
//       template: EmailTemplates.WORKSHOP_STATUS,
//       data: {
//         emailOptions: {
//           replyTo: "info@myurbanscoot.com",
//           subject: `Tu producto no tiene stock, estará disponible muy pronto`,
//         },
//         greeting: `El producto que quieres comprar estará disponible para ser enviado el ${data.day} del ${data.month}`,
//         actionUrl: "https://misitio.com/orden/detalle",
//         preview: "Tu pedido ha sido actualizado preview",
//       },
//     });
//   } catch (error) {
//     console.error("Error sending order confirmation notification:", error);
//   }
// }

// export const config: SubscriberConfig = {
//   event: "order.status_stock_await",
// };
