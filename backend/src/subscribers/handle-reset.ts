import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";
import { EmailTemplates } from "modules/email-notifications/templates";

console.log("🔥 Reset password subscriber loaded!");

export default async function resetPasswordTokenHandler({
  event: {
    data: { entity_id: email, token, actor_type },
  },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);

  console.log("Password reset subscriber triggered for:", email);

  const urlPrefix =
    actor_type === "customer"
      ? "http://localhost:8000/es"
      : "https://backend-production-9e9f.up.railway.app";

  try {
    await notificationModuleService.createNotifications({
      to: email,
      channel: "email",
      template: EmailTemplates.RESET_PASSWORD,
      data: {
        emailOptions: {
          replyTo: 'info@myurbanscoot.com', // Opcional: tu email de respuesta
          subject: "Restablece tu contraseña"
        },
        url: `${urlPrefix}/reset-password?token=${token}&email=${email}`,
        preview: "Restablece tu contraseña"
      },
    });
  } catch (error) {
    console.error("Error sending reset password email:", error);
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
};