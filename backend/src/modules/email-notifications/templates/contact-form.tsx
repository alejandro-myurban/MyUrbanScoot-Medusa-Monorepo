// src/modules/email-notifications/templates/contact-form.tsx
import {
  Text,
  Section,
  Row,
  Column,
  Link,
  Img,
} from "@react-email/components";
import * as React from "react";
import { Base } from "./base";

export const CONTACT_FORM = "contact-form";

export interface ContactFormProps {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  contactSubject: string;
  contactMessage: string;
}

export const isContactFormData = (data: any): data is ContactFormProps =>
  typeof data.customerName === "string" && 
  typeof data.customerEmail === "string" && 
  typeof data.contactMessage === "string";

export const ContactFormTemplate = ({
  customerName,
  customerEmail,
  customerPhone,
  contactSubject,
  contactMessage,
}: ContactFormProps) => (
  <Base preview={`Nuevo mensaje de contacto de ${customerName}`}>
    <Section
      className="max-w-[600px] mx-auto px-4"
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "0 16px",
      }}
    >
      <Text className="text-[32px] font-light text-[#888888] text-center m-0 mb-8">
        Nuevo Mensaje de Contacto
      </Text>

      {/* Información del cliente */}
      <Section
        className="bg-[#fafafa] rounded border-collapse text-[12px] text-[#333333] mb-8"
        style={{ width: "100%" }}
      >
        <Row>
          <Column style={{ padding: "20px" }}>
            <Text className="text-[10px] text-[#666666] m-0 leading-[1.4] mb-4">
              DATOS DEL CLIENTE
            </Text>
            
            <Text className="text-[14px] text-[#333333] m-0 leading-[1.6] mb-2">
              <strong>Nombre:</strong> {customerName}
            </Text>
            <Text className="text-[14px] text-[#333333] m-0 leading-[1.6] mb-2">
              <strong>Email:</strong> {customerEmail}
            </Text>
            <Text className="text-[14px] text-[#333333] m-0 leading-[1.6] mb-2">
              <strong>Teléfono:</strong> {customerPhone}
            </Text>
            <Text className="text-[14px] text-[#333333] m-0 leading-[1.6]">
              <strong>Asunto:</strong> {contactSubject}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Mensaje */}
      <Section
        className="bg-white rounded border-collapse text-[14px] text-[#333333] mb-8"
        style={{ 
          width: "100%",
          border: "1px solid #e0e0e0",
          borderLeft: "4px solid #10b981"
        }}
      >
        <Row>
          <Column style={{ padding: "20px" }}>
            <Text className="text-[10px] text-[#666666] m-0 leading-[1.4] mb-4">
              MENSAJE
            </Text>
            <Text className="text-[14px] text-[#333333] m-0 leading-[1.6] whitespace-pre-wrap">
              {contactMessage}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Botón de respuesta */}
      <Section className="text-center mb-8">
        <Link
          href={`mailto:${customerEmail}?subject=Re: ${contactSubject}`}
          style={{
            backgroundColor: "#10b981",
            borderRadius: "8px",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "600",
            textDecoration: "none",
            padding: "12px 24px",
            display: "inline-block",
          }}
        >
          Responder al Cliente
        </Link>
      </Section>

      <Section
        className="text-center mt-8"
        style={{
          borderTop: "1px solid #e0e0e0",
          paddingTop: "20px",
        }}
      >
        <Text className="text-[12px] text-[#888888] m-0">
          Este mensaje fue enviado desde el formulario de contacto de MyUrbanScoot.com
        </Text>
      </Section>
    </Section>
  </Base>
);

// Preview props para desarrollo
ContactFormTemplate.PreviewProps = {
  customerName: "Juan Pérez",
  customerEmail: "juan@example.com",
  customerPhone: "+34 612 345 678",
  contactSubject: "Consulta sobre patinete Xiaomi",
  contactMessage: "Hola, me gustaría saber más información sobre los repuestos para el modelo Xiaomi Mi Scooter Pro 2. ¿Tienen disponible la batería de repuesto? Gracias.",
} as ContactFormProps;

export default ContactFormTemplate;