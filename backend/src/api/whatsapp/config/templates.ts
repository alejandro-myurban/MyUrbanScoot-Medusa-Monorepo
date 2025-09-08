// config/templates.ts - Configuración centralizada de templates de Twilio

export const TWILIO_TEMPLATES = {
  // Template para confirmación de cita enviado al cliente
  APPOINTMENT_CONFIRMATION: {
    SID: process.env.TWILIO_TEMPLATE_APPOINTMENT_CONFIRMATION_SID || "HXfc8f8bb977b948bf69dfe523a09242ae", // Reemplazar con el SID real
    NAME: "appointment_confirmation",
    VARIABLES: {
      "1": "workshopName",     // {{1}} = Nombre del taller
      "2": "appointmentDate",  // {{2}} = Fecha de la cita  
      "3": "appointmentTime",  // {{3}} = Hora de la cita
      "4": "description"       // {{4}} = Descripción
    },
    BUTTONS: {
      CONFIRM_YES: "CONFIRM_YES",
      CONFIRM_NO: "CONFIRM_NO"
    }
  },

  // Template para notificación al taller sobre nueva cita
  WORKSHOP_NOTIFICATION: {
    SID: process.env.TWILIO_TEMPLATE_WORKSHOP_NOTIFICATION_SID || "HXda46308fa8e431640df42a75b1f472a7", // Reemplazar con el SID real
    NAME: "workshop_notification", 
    VARIABLES: {
      "1": "customerName",     // {{1}} = Nombre del cliente
      "2": "customerPhone",    // {{2}} = Teléfono del cliente
      "3": "appointmentDate",  // {{3}} = Fecha de la cita
      "4": "appointmentTime",  // {{4}} = Hora de la cita
      "5": "description"       // {{5}} = Descripción
    }
  }
};

// Función helper para validar que los templates están configurados
export function validateTemplateConfiguration() {
  const missing = [];
  
  if (!TWILIO_TEMPLATES.APPOINTMENT_CONFIRMATION.SID || TWILIO_TEMPLATES.APPOINTMENT_CONFIRMATION.SID.includes("...")) {
    missing.push("TWILIO_TEMPLATE_APPOINTMENT_CONFIRMATION_SID");
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

// Función helper para crear payload de botones
export function createButtonPayload(action: "CONFIRM_YES" | "CONFIRM_NO", appointmentId: string) {
  return JSON.stringify({
    action,
    appointmentId
  });
}