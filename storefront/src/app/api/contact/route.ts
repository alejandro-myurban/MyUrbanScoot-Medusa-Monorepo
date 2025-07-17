// app/api/contact/route.ts
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Inicializa Resend con tu clave de API desde las variables de entorno
const resend = new Resend(process.env.RESEND_API_KEY);

// Define la función POST para manejar las solicitudes del formulario
export async function POST(request: Request) {
  try {
    // Parsea los datos JSON del cuerpo de la solicitud
    const { fullName, email, subject, phone, message } = await request.json();

    // Valida que los campos requeridos no estén vacíos
    if (!fullName || !email || !subject || !message) {
      return NextResponse.json(
        { message: 'Faltan campos obligatorios.' },
        { status: 400 }
      );
    }

    // Envía el correo electrónico usando Resend
    const { data, error } = await resend.emails.send({
      from: 'Tu Empresa <onboarding@resend.dev>', // ¡IMPORTANTE! Reemplaza con un dominio verificado en Resend o usa 'onboarding@resend.dev' para pruebas
      to: ['eliancuevac@gmail.com'], // Tu correo personal donde quieres recibir los mensajes
      subject: `Mensaje de contacto: ${subject}`,
      replyTo: email, // Para que puedas responder directamente al remitente
      html: `
        <p><strong>Nombre Completo:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <p><strong>Teléfono:</strong> ${phone || 'No proporcionado'}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message}</p>
      `,
    });

    // Maneja cualquier error de Resend
    if (error) {
      console.error('Error al enviar correo con Resend:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    // Responde con éxito si el correo se envió correctamente
    return NextResponse.json({ message: 'Mensaje enviado con éxito', data });
  } catch (error: any) {
    // Captura cualquier otro error en el proceso
    console.error('Error en el API Route de contacto:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor.', error: error.message },
      { status: 500 }
    );
  }
}