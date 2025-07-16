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

export const PRODUCT_STATUS = "production-status-update";

export interface ProductStatus {
  order_id: string;
  customer_name: string;
  status_display: string;
  status_message: string;
  order_items: { title: string; quantity: number }[];
  previous_status: string;
  preview?: string;
}

// Solo comprobamos los campos obligatorios.
// **NO** incluimos `emailOptions` porque lo ignoramos en el guardia.
export const isProductStatusData = (data: any): data is ProductStatus =>
  typeof data.order_id === "string" &&
  typeof data.customer_name === "string" &&
  typeof data.status_display === "string" &&
  typeof data.status_message === "string" &&
  Array.isArray(data.order_items) &&
  typeof data.previous_status === "string";

export const ProductStatusTemplate: React.FC<ProductStatus> & {
  PreviewProps: ProductStatus;
} = ({
  order_id,
  customer_name,
  status_display,
  status_message,
  order_items,
  previous_status,
  preview = "Actualización de estado de tu pedido",
}: ProductStatus) => (
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
        Actualización de Estado
      </Text>

      <Text className="text-[14px] text-[#111111] m-0 mb-4">
        ¡Hola {customer_name}!
      </Text>

      <Text className="text-[14px] text-[#111111] m-0 mb-8">
        {status_message}
      </Text>

      {/* Information Table - Estilo Apple */}
      <Section
        className="bg-[#fafafa] rounded border-collapse text-[12px] text-[#333333] mb-8"
        style={{ width: "100%" }}
      >
        <Row className="min-h-[46px]">
          <Column
            className="pl-3 pr-2 border-r border-b border-white min-h-[44px]"
            style={{ width: "50%", padding: "12px" }}
          >
            <Section>
              <Row className="mb-2">
                <Column>
                  <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
                    ORDEN
                  </Text>
                  <Link className="text-[12px] text-[#1155cc] underline m-0 leading-[1.4]">
                    #{order_id}
                  </Link>
                </Column>
              </Row>
              <Row className="mb-2">
                <Column>
                  <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
                    ESTADO ANTERIOR
                  </Text>
                  <Text className="text-[12px] m-0 leading-[1.4]">
                    {previous_status}
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
                    NUEVO ESTADO
                  </Text>
                  <Text className="text-[12px] font-semibold text-[#007aff] m-0 leading-[1.4]">
                    {status_display}
                  </Text>
                </Column>
              </Row>
            </Section>
          </Column>
          <Column
            className="pl-3 border-b border-white min-h-[44px]"
            style={{ width: "50%", padding: "12px" }}
          >
            <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
              CLIENTE
            </Text>
            <Text className="text-[12px] m-0 leading-[1.4]">
              {customer_name}
            </Text>
            <Text className="text-[10px] text-[#666666] mt-2 m-0 leading-[1.4]">
              FECHA ACTUALIZACIÓN
            </Text>
            <Text className="text-[12px] m-0 leading-[1.4]">
              {new Date().toLocaleDateString()}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Products Title */}
      <Section
        className="bg-[#fafafa] rounded border-collapse text-[12px] text-[#333333] my-8 min-h-[24px]"
        style={{ width: "100%" }}
      >
        <Text className="bg-[#fafafa] pl-2.5 text-[14px] font-medium m-0">
          Productos en tu Orden
        </Text>
      </Section>

      {/* Order Items - Mismo estilo que las órdenes */}
      {order_items.map((item, index) => (
        <div key={index}>
          <Section className="mb-4">
            {/* Título del producto full width */}
            <Row className="mb-3">
              <Column style={{ width: "100%" }}>
                <Text className="text-[14px] font-semibold m-0 leading-[1.4]">
                  {item.title}
                </Text>
              </Column>
            </Row>

            {/* Imagen y detalles en la misma fila */}
            <Row>
              <Column style={{ width: "64px", minWidth: "64px" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    marginLeft: "8px",
                    borderRadius: "14px",
                    border: "1px solid #f2f2f2",
                    backgroundColor: "#f8f8f8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text className="text-[10px] text-[#999] text-center m-0">
                    IMG
                  </Text>
                </div>
              </Column>
              <Column className="pl-3" style={{ paddingLeft: "12px" }}>
                <Text className="text-[12px] text-[#666666] m-0 leading-[1.4]">
                  Cantidad: {item.quantity}
                </Text>
                <Text className="text-[12px] text-[#007aff] m-0 leading-[1.4] font-medium">
                  Estado: {status_display}
                </Text>
                <div className="text-[12px] mt-1">
                  <Link href="#" className="text-[#0070c9] no-underline">
                    Ver Detalles
                  </Link>
                  <span className="mx-1 text-[#333333] font-light">|</span>
                  <Link href="#" className="text-[#0070c9] no-underline">
                    Contactar Soporte
                  </Link>
                </div>
              </Column>
              <Column
                className="text-right pr-2 align-top"
                style={{
                  width: "80px",
                  minWidth: "80px",
                  textAlign: "right",
                  paddingRight: "8px",
                  verticalAlign: "top",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#e3f2fd",
                    color: "#1976d2",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: "500",
                    textAlign: "center",
                  }}
                >
                  {status_display}
                </div>
              </Column>
            </Row>
          </Section>
          {index < order_items.length - 1 && (
            <Hr className="border-0 border-t border-[#f0f0f0] my-4" />
          )}
        </div>
      ))}
    </Section>

    {/* Footer fuera del container principal para mantener el ancho completo */}
    <Section
      className="text-center my-8 max-w-[600px] mx-auto px-4"
      style={{
        maxWidth: "600px",
        margin: "32px auto",
        padding: "0 16px",
      }}
    >
      <Text className="text-[14px] text-[#111111] m-0 mb-4">
        Si tienes alguna pregunta sobre el estado de tu pedido, no dudes en contactarnos.
      </Text>
      <Text className="text-[14px] text-[#111111] m-0">
        ¡Gracias por tu paciencia!
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
ProductStatusTemplate.PreviewProps = {
  order_id: "12345",
  customer_name: "Juan Pérez",
  status_display: "En producción",
  status_message: "Tu pedido ha entrado en producción y nuestro equipo está trabajando en él.",
  order_items: [
    { title: "Patinete Eléctrico Urban Pro Max", quantity: 2 },
    { title: "Casco de Seguridad Premium", quantity: 1 },
  ],
  previous_status: "Pendiente",
  preview: "Actualización de estado de tu pedido #12345",
} as ProductStatus;

export default ProductStatusTemplate;