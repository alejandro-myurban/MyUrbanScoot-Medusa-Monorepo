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
import { OrderDTO, OrderAddressDTO } from "@medusajs/framework/types";

export const ORDER_PLACED_ADMIN = "order-placed-admin";

interface OrderPlacedPreviewProps {
  order: OrderDTO & {
    display_id: string;
    summary: { raw_current_order_total: { value: number } };
  };
  shippingAddress: OrderAddressDTO;
}

export interface OrderPlacedTemplateProps {
  order: OrderDTO & {
    display_id: string;
    summary: { raw_current_order_total: { value: number } };
  };
  shippingAddress: OrderAddressDTO;
  preview?: string;
}

export const isOrderPlacedAdminTemplateData = (
  data: any
): data is OrderPlacedTemplateProps =>
  typeof data.order === "object" && typeof data.shippingAddress === "object";

export const OrderPlacedAdminTemplate: React.FC<OrderPlacedTemplateProps> & {
  PreviewProps: OrderPlacedPreviewProps;
} = ({ order, shippingAddress, preview = "Nueva orden recibida!" }) => {
  return (
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
          Nuevo Pedido
        </Text>

        <Text className="text-[14px] text-[#111111] m-0 mb-4">
          Se ha recibido una nueva orden de {shippingAddress.first_name} {shippingAddress.last_name},
        </Text>

        <Text className="text-[14px] text-[#111111] m-0 mb-8">
          Aquí están los detalles de la orden:
        </Text>

        {/* Information Table - Mejorado para móvil */}
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
                      EMAIL CLIENTE
                    </Text>
                    <Link
                      className="text-[12px] text-[#1155cc] underline m-0 leading-[1.4] break-all"
                      style={{ wordBreak: "break-all" }}
                    >
                      {order.email}
                    </Link>
                  </Column>
                </Row>
                <Row className="mb-2">
                  <Column>
                    <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
                      FECHA ORDEN
                    </Text>
                    <Text className="text-[12px] m-0 leading-[1.4]">
                      {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                  </Column>
                </Row>
                <Row>
                  <Column className="w-1/2">
                    <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
                      ID ORDEN
                    </Text>
                    <Link className="text-[12px] text-[#1155cc] underline m-0 leading-[1.4]">
                      {order.display_id}
                    </Link>
                  </Column>
                  <Column className="w-1/2">
                    <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
                      TOTAL
                    </Text>
                    <Text className="text-[12px] m-0 leading-[1.4]">
                      {order.summary.raw_current_order_total.value}{" "}
                      {order.currency_code}
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
                ENVIAR A
              </Text>
              <Text className="text-[12px] m-0 leading-[1.4]">
                {shippingAddress.first_name} {shippingAddress.last_name}
              </Text>
              <Text className="text-[12px] m-0 leading-[1.4]">
                {shippingAddress.address_1}
              </Text>
              <Text className="text-[12px] m-0 leading-[1.4]">
                {shippingAddress.city}, {shippingAddress.province}{" "}
                {shippingAddress.postal_code}
              </Text>
              <Text className="text-[12px] m-0 leading-[1.4]">
                {shippingAddress.country_code}
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
            Productos Pedidos
          </Text>
        </Section>

        {/* Order Items - Mejorado para móvil */}
        {order.items.map((item, index) => (
          <div key={item.id}>
            <Section className="mb-4">
              {/* Título del producto full width */}
              <Row className="mb-3">
                <Column style={{ width: "100%" }}>
                  <Text className="text-[14px] font-semibold m-0 leading-[1.4]">
                    {item.title} - {item.product_title}
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
                  <Text className="text-[12px] text-[#666666] m-0 leading-[1.4]">
                    Precio Unitario: {item.unit_price} {order.currency_code}
                  </Text>
                  <div className="text-[12px] mt-1">
                    <Link href="#" className="text-[#0070c9] no-underline">
                      Ver Producto
                    </Link>
                    <span className="mx-1 text-[#333333] font-light">|</span>
                    <Link href="#" className="text-[#0070c9] no-underline">
                      Gestionar Inventario
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
                  <Text className="text-[12px] font-semibold m-0">
                    {item.unit_price} {order.currency_code}
                  </Text>
                </Column>
              </Row>
            </Section>
            {index < order.items.length - 1 && (
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
          Puedes gestionar esta orden desde el panel de administración o contactar al cliente en{" "}
          <Link
            href={`mailto:${order.email}`}
            className="text-[#1155cc] underline"
          >
            {order.email}
          </Link>
          .
        </Text>
        <Text className="text-[14px] text-[#111111] m-0">
          ¡Nueva venta realizada!
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
          © {new Date().getFullYear()} MyUrbanScoot. Panel de Administración.
        </Text>
      </Section>
    </Base>
  );
};

OrderPlacedAdminTemplate.PreviewProps = {
  order: {
    id: "test-order-id",
    display_id: "ORD-123",
    created_at: new Date().toISOString(),
    email: "test@example.com",
    currency_code: "USD",
    items: [
      {
        id: "item-1",
        title: "Item 1",
        product_title: "Product 1",
        quantity: 2,
        unit_price: 10,
      },
      {
        id: "item-2",
        title: "Item 2",
        product_title: "Product 2",
        quantity: 1,
        unit_price: 25,
      },
    ],
    shipping_address: {
      first_name: "Test",
      last_name: "User",
      address_1: "123 Main St",
      city: "Anytown",
      province: "CA",
      postal_code: "12345",
      country_code: "US",
    },
    summary: { raw_current_order_total: { value: 45 } },
  },
  shippingAddress: {
    first_name: "Test",
    last_name: "User",
    address_1: "123 Main St",
    city: "Anytown",
    province: "CA",
    postal_code: "12345",
    country_code: "US",
  },
} as OrderPlacedPreviewProps;

export default OrderPlacedAdminTemplate;