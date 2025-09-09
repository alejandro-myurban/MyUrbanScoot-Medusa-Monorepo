// api/whatsapp/config/templates.ts

// Configuración centralizada de templates de Twilio
export const TWILIO_TEMPLATES = {
  // Template para confirmación de cita enviado al cliente (con botones estáticos)
  APPOINTMENT_CONFIRMATION_BUTTONS: {
    SID: process.env.TWILIO_TEMPLATE_APPOINTMENT_CONFIRMATION_BUTTONS_SID || "HX8c594cc0d60073d6a32fdcf3e4de1de8", // 👈 Tu SID para la plantilla sin variables
    NAME: "appointment_confirmation_buttons_static",
  },

  // Template para notificación al taller sobre nueva cita
  WORKSHOP_NOTIFICATION: {
    SID: process.env.TWILIO_TEMPLATE_WORKSHOP_NOTIFICATION_SID || "HXda46308fa8e431640df42a75b1f472a7",
    NAME: "workshop_notification",
    VARIABLES: {
      "1": "customerName",
      "2": "customerPhone",
      "3": "appointmentDate",
      "4": "appointmentTime",
      "5": "description"
    }
  }
};

// Función helper para validar que los templates están configurados
export function validateTemplateConfiguration() {
  const missing = [];

  if (!TWILIO_TEMPLATES.APPOINTMENT_CONFIRMATION_BUTTONS.SID || TWILIO_TEMPLATES.APPOINTMENT_CONFIRMATION_BUTTONS.SID.includes("...")) {
    missing.push("TWILIO_TEMPLATE_APPOINTMENT_CONFIRMATION_BUTTONS_SID");
  }

  if (!TWILIO_TEMPLATES.WORKSHOP_NOTIFICATION.SID || TWILIO_TEMPLATES.WORKSHOP_NOTIFICATION.SID.includes("...")) {
    missing.push("TWILIO_TEMPLATE_WORKSHOP_NOTIFICATION_SID");
  }

  if (missing.length > 0) {
    console.warn("⚠️ Templates de Twilio no configurados:", missing);
    console.warn("Por favor, configura las siguientes variables de entorno:");
    missing.forEach(env => console.warn(`- ${env}`));
  }

  return missing.length === 0;
}