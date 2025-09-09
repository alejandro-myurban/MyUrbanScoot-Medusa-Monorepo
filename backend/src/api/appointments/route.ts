// api/appointments/route.ts

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TWILIO_TEMPLATES } from "api/whatsapp/config/templates";
import { sendWhatsAppTemplate } from "api/whatsapp/route";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    console.log("-----------------------------------------");
    console.log("GET /appointments endpoint reached.");
    console.log("Query params:", req.query);

    const appointmentsModuleService = req.scope.resolve("appointments") as any;

    const filters: any = { ...req.query };
    if (typeof filters.date === 'string') {
        const date = new Date(filters.date);
        if (!isNaN(date.getTime())) {
            filters.date = date;
        } else {
            delete filters.date;
        }
    }
    const options = {
      relations: ['workshop'],
    };
    
    console.log("Filters applied:", filters);
    console.log("Options for list method:", options);

    try {
        const appointments = await appointmentsModuleService.list(
            filters,
            options,
            req.scope
        );
        console.log("Appointments found:", appointments.length);
        console.log("Appointments data:", appointments);
        console.log("-----------------------------------------");
        res.status(200).json({ appointments });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        console.log("-----------------------------------------");
        res.status(500).json({ message: "Error fetching appointments" });
    }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
    console.log("🚨🚨🚨 POST /appointments endpoint reached! Processing request. 🚨🚨🚨");

    const appointmentsModuleService = req.scope.resolve("appointments") as any;

    console.log("-----------------------------------------");
    console.log("Request body (req.body):", req.body);
    console.log("-----------------------------------------");

    try {
        const { customer_name, customer_phone, start_time, end_time, workshop_id, description } = req.body as any;
        if (!customer_name || !customer_phone || !start_time || !end_time || !workshop_id) {
            console.error("❌ [ERROR] Missing required fields: customer_name, customer_phone, start_time, end_time, and workshop_id are required.");
            throw new Error("Missing required fields: customer_name, customer_phone, start_time, end_time, and workshop_id are required.");
        }

        const appointment = await appointmentsModuleService.createAppointment(
            req.body,
            req.scope
        );

        console.log("✅ Appointment successfully created:", appointment);

        // 📱 Enviar notificación al taller
        try {
            console.log("🔍 [DEBUG] Iniciando el proceso de notificación del taller...");
            const workshop = await appointmentsModuleService.retrieveWorkshop(workshop_id, {}, req.scope);
            console.log("🔍 [DEBUG] Datos del taller recuperados:", workshop);

            if (workshop && workshop.phone) {
                console.log("🔍 [DEBUG] Número de teléfono del taller encontrado:", workshop.phone);

                const appointmentDate = new Date(start_time);
                const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                const formattedTime = appointmentDate.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const templateVariables = {
                    "1": customer_name,
                    "2": customer_phone,
                    "3": formattedDate,
                    "4": formattedTime,
                    "5": description || 'Sin descripción',
                };

                const workshopPhoneNumber = `whatsapp:${workshop.phone.replace(/\s+/g, '')}`;
                console.log("📝 [DEBUG] Número de teléfono del taller formateado para Twilio:", workshopPhoneNumber);

                await sendWhatsAppTemplate(
                    workshopPhoneNumber,
                    TWILIO_TEMPLATES.WORKSHOP_NOTIFICATION.SID,
                    `🔧 NUEVA CITA SOLICITADA\nCliente: ${customer_name}\nTeléfono: ${customer_phone}`,
                    templateVariables
                );
                console.log(`✅ Notificación enviada exitosamente al taller: ${workshopPhoneNumber}`);
            } else {
                console.warn("⚠️ No se encontró el taller o el número de teléfono. Saltando la notificación.");
            }

        } catch (templateError) {
            console.error("❌ Error durante el proceso de notificación de WhatsApp:", templateError);
        }

        // ✅ LÓGICA CORREGIDA: ENVIAR CONFIRMACIÓN AL CLIENTE CON PLANTILLA ESTÁTICA
        try {
            const customerWhatsAppNumber = `whatsapp:${customer_phone.replace(/\s+/g, '')}`;
            await sendWhatsAppTemplate(
                customerWhatsAppNumber,
                TWILIO_TEMPLATES.APPOINTMENT_CONFIRMATION_BUTTONS.SID,
                `¡Hola! Se ha solicitado una cita en los talleres de MyUrbanScoot. ¿Deseas confirmar esta cita?`,
                {} // No se pasan variables ya que la plantilla es estática
            );
            console.log(`✅ Notificación de confirmación estática enviada al cliente: ${customerWhatsAppNumber}`);
        } catch (confirmationError) {
            console.error("❌ Error enviando confirmación al cliente:", confirmationError);
        }

        res.status(201).json({ appointment });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("❌ Error creando la cita:", errorMessage);
        res.status(500).json({ message: errorMessage });
    }
}
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
    const appointmentsModuleService = req.scope.resolve("appointments") as any;
    const { id } = req.query;

    console.log(`PUT /appointments/${id} endpoint reached.`);
    console.log("Request body (req.body):", req.body);

    if (typeof id !== 'string') {
        return res.status(400).json({ message: "ID parameter is required" });
    }

    try {
        const updatedAppointment = await appointmentsModuleService.updateAppointment(
            id,
            req.body,
            req.scope
        );
        res.status(200).json({ appointment: updatedAppointment });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Error updating appointment:", errorMessage);
        res.status(500).json({ message: errorMessage });
    }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
    const appointmentsModuleService = req.scope.resolve("appointments") as any;
    const { id } = req.query;

    console.log(`DELETE /appointments/${id} endpoint reached.`);

    if (typeof id !== 'string') {
        return res.status(400).json({ message: "ID parameter is required" });
    }

    try {
        await appointmentsModuleService.deleteAppointment(id, req.scope);
        res.status(204).send();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Error deleting appointment:", errorMessage);
        res.status(500).json({ message: errorMessage });
    }
}