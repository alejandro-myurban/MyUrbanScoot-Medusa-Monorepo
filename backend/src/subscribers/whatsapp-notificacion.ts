import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils";
import {
  IOrderModuleService,
  INotificationModuleService,
} from "@medusajs/framework/types";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { EmailTemplates } from "../modules/email-notifications/templates";
import { STORE_CORS } from "../lib/constants";

export default async function sendNotificationOnOrder({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve("logger");
  logger.info("📦 Nuevo pedido detectado, preparando email y WhatsApp...");

  const orderModuleService = container.resolve<IOrderModuleService>(
    Modules.ORDER
  );

  const notificationService: INotificationModuleService = container.resolve(
    Modules.NOTIFICATION
  );

  // Obtené la orden completa
  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ["items", "shipping_address"],
  });

  const shippingPhone = order.shipping_address?.phone;
  const customerName = order.shipping_address?.first_name ?? order.shipping_address?.company ?? "Cliente";

  // Opcional: Token de confirmación
  const configModule = container.resolve("configModule");
  const jwtSecret = configModule.projectConfig.http.jwtSecret;

  const token = generateJwtToken(
    {
      payment_id: data.id,
      order_id: order.id,
    },
    {
      secret: jwtSecret,
      expiresIn: "24h",
    }
  );

  try {
    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      template: EmailTemplates.INVITE_USER,
      data: {
        emailOptions: {
          replyTo: "info@myurbanscoot.com",
          subject: "¡Gracias por tu pedido!",
        },
        inviteLink: `${STORE_CORS}/es/confirm-cod-payment?token=${token}`,
        preview: "Tu pedido ya fue recibido.",
        whatsapp: shippingPhone,
        whatsappTemplate: "whatsapp-product-status-update",
        whatsappData: {
          customer_name: customerName,
          order_id: order.display_id,
          status_display: "Recibido",
        },
        order_items: order.items.map((i) => ({
          title: i.title,
          quantity: i.quantity,
        })),
      },
    });

    logger.info(`✅ Email y WhatsApp enviados a ${order.email} y ${shippingPhone}`);
  } catch (err: any) {
    logger.error(`❌ Error al enviar notificación: ${err.message}`);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
