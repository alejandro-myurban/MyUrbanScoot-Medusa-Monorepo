import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TWILIO_TEMPLATES } from "api/whatsapp/config/templates";
import { sendWhatsAppTemplate } from "api/whatsapp/route";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    console.log("-----------------------------------------");
    console.log("GET /appointments endpoint reached.");
    console.log("Query params:", req.query);
    
    const appointmentsModuleService = req.scope.resolve("appointments") as any
    
    console.log("Service resolved:", !!appointmentsModuleService);
    console.log("Available methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(appointmentsModuleService)));
    
    const filters: any = { ...req.query }

    if (typeof filters.date === 'string') {
        const date = new Date(filters.date)
        if (!isNaN(date.getTime())) {
            filters.date = date
        } else {
            delete filters.date
        }
    }

    console.log("Filters applied:", filters);

    try {
        const appointments = await appointmentsModuleService.list(
            filters, 
            {},
            req.scope
        )
        console.log("Appointments found:", appointments.length);
        console.log("Appointments data:", appointments);
        console.log("-----------------------------------------");
        res.status(200).json({ appointments })
    } catch (error) {
        console.error("Error fetching appointments:", error);
        console.log("-----------------------------------------");
        res.status(500).json({ message: "Error fetching appointments" })
    }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const appointmentsModuleService = req.scope.resolve("appointments") as any
    
    console.log("-----------------------------------------");
    console.log("POST /appointments endpoint reached.");
    console.log("Request body (req.body):", req.body);
    console.log("-----------------------------------------");

    try {
        const { customer_name, customer_phone, start_time, end_time, workshop_id, description } = req.body as any
        if (!customer_name || !customer_phone || !start_time || !end_time || !workshop_id) {
            throw new Error("Missing required fields: customer_name, customer_phone, start_time, end_time, and workshop_id are required.");
        }
        
        const appointment = await appointmentsModuleService.createAppointment(
            req.body,
            req.scope
        )
        
        console.log("Appointment successfully created:", appointment);

        // 📱 Enviar solo notificación al taller (template aprobado)
        try {
            console.log("🔍 [DEBUG] Enviando notificación al taller...");
            const workshop = await appointmentsModuleService.retrieveWorkshop(workshop_id, {}, req.scope);
            
            if (workshop.whatsapp_number) {
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
                    "2": formattedDate,
                    "3": formattedTime,
                    "4": description || 'Sin descripción',
                };

                console.log(`📝 [DEBUG] Variables para notificación del taller: ${JSON.stringify(templateVariables)}`);

                // Validar número de teléfono del taller
                const workshopPhoneNumber = workshop.whatsapp_number;
                const regex = /^\+\d{1,15}$/; 
                if (!regex.test(workshopPhoneNumber)) {
                    console.warn(`⚠️ Número de taller inválido (${workshopPhoneNumber}). No se enviará notificación.`);
                } else {
                    await sendWhatsAppTemplate(
                        workshopPhoneNumber,
                        TWILIO_TEMPLATES.WORKSHOP_NOTIFICATION.SID,
                        `🔧 NUEVA CITA SOLICITADA\n👤 Cliente: ${customer_name}\n📞 Teléfono: ${customer_phone}\n📅 Fecha: ${formattedDate}\n🕒 Hora: ${formattedTime}\n📋 Descripción: ${description || 'Sin descripción'}`,
                        templateVariables
                    );

                    console.log(`✅ Notificación enviada al taller: ${workshopPhoneNumber}`);
                }
            } else {
                console.warn("⚠️ El taller no tiene número de WhatsApp configurado");
            }
            
        } catch (templateError) {
            console.error("❌ Error enviando notificación al taller:", templateError);
            // No fallar la creación de la cita por un error de notificación
        }
        
        res.status(201).json({ appointment })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        console.error("Error creating appointment:", errorMessage);
        res.status(500).json({ message: errorMessage })
    }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
    const appointmentsModuleService = req.scope.resolve("appointments") as any
    const { id } = req.query
    
    console.log(`PUT /appointments/${id} endpoint reached.`);
    console.log("Request body (req.body):", req.body);
    
    if (typeof id !== 'string') {
        return res.status(400).json({ message: "ID parameter is required" })
    }
    
    try {
        const updatedAppointment = await appointmentsModuleService.updateAppointment(
            id,
            req.body,
            req.scope
        )
        res.status(200).json({ appointment: updatedAppointment })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        console.error("Error updating appointment:", errorMessage);
        res.status(500).json({ message: errorMessage })
    }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
    const appointmentsModuleService = req.scope.resolve("appointments") as any
    const { id } = req.query
    
    console.log(`DELETE /appointments/${id} endpoint reached.`);

    if (typeof id !== 'string') {
        return res.status(400).json({ message: "ID parameter is required" })
    }

    try {
        await appointmentsModuleService.deleteAppointment(id, req.scope)
        res.status(204).send()
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        console.error("Error deleting appointment:", errorMessage);
        res.status(500).json({ message: errorMessage })
    }
}