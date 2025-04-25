// src/subscribers/production-status-changed.ts
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";
import {
  INotificationModuleService,
  IOrderModuleService,
} from "@medusajs/framework/types";
import { EmailTemplates } from "modules/email-notifications/templates";

export default async function handleProductionStatusChanged({
  event: { data },
  container,
}: SubscriberArgs<{
  id: string;
  status: string;
  previous_status: string | null;
  day?: string;
  month?: string;
}>) {
  try {
    const { id, status, previous_status, day, month } = data;

    // Obtener servicios necesarios
    const orderModuleService: IOrderModuleService = container.resolve(
      Modules.ORDER
    );
    const notificationModuleService: INotificationModuleService =
      container.resolve(Modules.NOTIFICATION);

    // Obtener la orden para acceder a sus datos
    const order = await orderModuleService.retrieveOrder(data.id, {
      relations: ["items", "summary", "shipping_address"],
    });
    if (!order) {
      console.error(`Orden con ID ${id} no encontrada`);
      return;
    }

    // Mapeo de estados a mensajes para el correo
    const statusMessages: Record<string, string> = {
      produccion_vinilos: "¡Tus vinilos están en producción!",
      produccion_baterias: "Las baterías de tu pedido están en producción",
      en_taller: "Tu pedido está siendo ensamblado en nuestro taller",
      espera_stock: `Tu pedido está en espera de stock hasta el ${day} del ${month}`,
      producto_reservado: "¡Buenas noticias! Tu producto ha sido reservado",
    };

    const statusDisplayMap: Record<string, string> = {
      produccion_vinilos: "Producción de Vinilos",
      produccion_baterias: "Producción de Baterías",
      en_taller: "En Taller",
      espera_stock: "En Espera de Stock", // ← sólo label
      producto_reservado: "Producto Reservado",
    };

    // Preparar datos para la notificación
    const customerEmail = order.email;
    const customerName = `${order.shipping_address?.first_name || ""} ${
      order.shipping_address?.last_name || ""
    }`.trim();

    // Enviar email según el estado
    await notificationModuleService.createNotifications({
      to: customerEmail,
      channel: "email",
      template: EmailTemplates.PRODUCT_STATUS,
      data: {
        emailOptions: {
          replyTo: "info@myurbanscoot.com",
          subject: "Información sobre tu pedido",
        },
        order_id: String(order.display_id),
        customer_name: customerName || "Estimado cliente",
        status_display:
          statusDisplayMap[status] || order.metadata?.production_status_display,
        status_message:
          status === "espera_stock"
            ? statusMessages[status]
            : statusMessages[status] || "Tu pedido ha cambiado de estado",
        order_items: order.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
        })),
        previous_status: previous_status
          ? statusDisplayMap[previous_status] || previous_status
          : "Estado inicial",
      },
    });

    console.log(
      `Notificación enviada para orden ${id}, nuevo estado: ${status}`
    );
  } catch (error) {
    console.error("Error al enviar notificación de cambio de estado:", error);
  }
}

export const config: SubscriberConfig = {
  event: ["order.production_status_updated", "order.status_stock_await_email"],
};
