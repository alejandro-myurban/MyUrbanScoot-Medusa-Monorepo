import { Text, Section, Hr } from "@react-email/components";
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

export const ProductStatus: React.FC<ProductStatus> & {
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
    <Section>
      <Text
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          textAlign: "center",
          margin: "0 0 30px",
        }}
      >
        Actualización de Estado
      </Text>

      <Text style={{ margin: "0 0 15px" }}>¡Hola {customer_name}!</Text>

      <Text style={{ margin: "0 0 30px" }}>{status_message}</Text>

      <Hr style={{ margin: "20px 0" }} />

      <Text
        style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 10px" }}
      >
        Detalles del Pedido
      </Text>

      <Text style={{ margin: "0 0 5px" }}>Orden #{order_id}</Text>
      <Text style={{ margin: "0 0 5px" }}>
        Estado anterior: {previous_status}
      </Text>
      <Text style={{ margin: "0 0 20px" }}>Nuevo estado: {status_display}</Text>

      <Hr style={{ margin: "20px 0" }} />

      <Section>
        <Text
          style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 15px" }}
        >
          Productos en tu orden:
        </Text>
        {order_items.map((item, index) => (
          <Text key={index} style={{ margin: "0 0 5px" }}>
            {item.title} - Cantidad: {item.quantity}
          </Text>
        ))}
      </Section>
    </Section>
  </Base>
);

// Add preview props for the email dev server
ProductStatus.PreviewProps = {
  order_id: "12345",
  customer_name: "Juan Pérez",
  status_display: "En producción",
  status_message: "Tu pedido ha entrado en producción",
  order_items: [
    { title: "Producto 1", quantity: 2 },
    { title: "Producto 2", quantity: 1 },
  ],
  previous_status: "Pendiente",
  preview: "Actualización de estado de tu pedido #12345",
} as ProductStatus;

export default ProductStatus;
