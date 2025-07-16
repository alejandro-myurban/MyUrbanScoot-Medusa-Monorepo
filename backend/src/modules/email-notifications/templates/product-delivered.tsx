import {
  Text,
  Section,
  Hr,
  Row,
  Column,
  Link,
  Img,
} from "@react-email/components";
import * as React from "react";
import { Base } from "./base";

export const PRODUCT_DELIVERED = "product-delivered";

export interface ProductDeliveredProps {
  greeting: string;
  actionUrl: string;
  preview?: string;
}

export const isProductDeliveredData = (data: any): data is ProductDeliveredProps =>
  typeof data.greeting === "string" && typeof data.actionUrl === "string";

export const ProductDeliveredTemplate = ({
  greeting,
  actionUrl,
  preview = "Tu pedido ha sido entregado",
}: ProductDeliveredProps) => (
  <Base preview={preview}>
    {/* Container principal con ancho máximo */}
    <Section
      className="max-w-[600px] mx-auto px-4"
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "0 4px",
      }}
    >
      <Text className="text-[32px] font-light text-[#888888] text-center m-0 mb-8">
        Entrega Completada
      </Text>

      <Text className="text-[14px] text-[#111111] m-0 mb-8">
        {greeting}
      </Text>

      {/* Information Table - Estilo Apple */}
      <Section
        className="bg-[#fafafa] rounded border-collapse text-[12px] text-[#333333] mb-8"
        style={{ width: "100%" }}
      >
        <Row className="min-h-[46px]">
          <Column
            className="pl-3 pr-2 border-b border-white min-h-[44px]"
            style={{ width: "100%", padding: "20px", textAlign: "center" }}
          >
            <Text className="text-[10px] text-[#666666] m-0 leading-[1.4] mb-2">
              ESTADO DE ENTREGA
            </Text>
            
            <div
              style={{
                backgroundColor: "#e8f5e8",
                color: "#2e7d32",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                textAlign: "center",
                marginBottom: "16px",
                border: "1px solid #c8e6c9"
              }}
            >
              ✅ Entregado con Éxito
            </div>

            <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-4">
              Tu pedido ha sido entregado correctamente. Esperamos que disfrutes de tu compra.
            </Text>

            {/* Botón de acción */}
            <Section className="text-center mb-4">
              <Link
                href={actionUrl}
                style={{
                  backgroundColor: "#007aff",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  textDecoration: "none",
                  padding: "12px 24px",
                  display: "inline-block",
                }}
              >
                Ver Detalles de Entrega
              </Link>
            </Section>

            <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
              Haz clic en el botón para ver más información sobre tu entrega
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Información adicional */}
      <Section
        className="bg-[#fafafa] rounded border-collapse text-[12px] text-[#333333] my-8"
        style={{ width: "100%" }}
      >
        <Row>
          <Column style={{ padding: "16px" }}>
            <Text className="text-[10px] text-[#666666] m-0 leading-[1.4] mb-2">
              PRÓXIMOS PASOS
            </Text>
            <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-2">
              • Revisa que todo esté en perfecto estado
            </Text>
            <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-2">
              • Guarda tu comprobante de entrega
            </Text>
            <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-2">
              • Déjanos una reseña de tu experiencia
            </Text>
            <Text className="text-[12px] text-[#333333] m-0 leading-[1.4]">
              • Contacta soporte si hay algún problema
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Enlaces adicionales */}
      <Section className="text-center mb-8">
        <Text className="text-[12px] text-[#666666] m-0 mb-3">
          ¿Necesitas ayuda?
        </Text>
        <div className="text-[12px]">
          <Link href="#" className="text-[#0070c9] no-underline mr-4">
            Escribir Reseña
          </Link>
          <span className="mx-1 text-[#333333] font-light">|</span>
          <Link href="#" className="text-[#0070c9] no-underline ml-4">
            Contactar Soporte
          </Link>
        </div>
      </Section>
    </Section>

    {/* Footer fuera del container principal */}
    <Section
      className="text-center my-8 max-w-[600px] mx-auto px-4"
      style={{
        maxWidth: "600px",
        margin: "32px auto",
        padding: "0 16px",
      }}
    >
      <Text className="text-[14px] text-[#111111] m-0 mb-4">
        Gracias por elegir MyUrbanScoot. Tu satisfacción es nuestra prioridad.
      </Text>
      <Text className="text-[14px] text-[#111111] m-0">
        ¡Esperamos verte pronto!
      </Text>
    </Section>

    <Section
      className="text-center flex justify-center items-center mt-8 max-w-[600px] mx-auto px-4"
      style={{
        maxWidth: "600px",
        margin: "32px auto 0",
        padding: "0 16px",
        textAlign: "center",
      }}
    >
      <Img
        src="https://myurbanscoot.com/wp-content/uploads/2025/05/cropped-logo-myurbanscoot-vertical-2025-05-382x101.png"
        alt="MyUrbanScoot Logo"
        style={{ maxWidth: "250px", height: "auto" }}
      />
      <Text className="text-[12px] text-[#888888] text-center m-0 mt-8">
        © {new Date().getFullYear()} MyUrbanScoot. All rights reserved.
      </Text>
    </Section>
  </Base>
);

// Add preview props for the email dev server
ProductDeliveredTemplate.PreviewProps = {
  greeting: "¡Hola! Tu pedido ha sido entregado con éxito.",
  actionUrl: "https://myurbanscoot.com/orders/track/123456",
  preview: "Tu pedido de MyUrbanScoot ha sido entregado",
} as ProductDeliveredProps;

export default ProductDeliveredTemplate;