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

export const PRODUCT_DELIVERED_EN = "product-delivered-en";

export interface ProductDeliveredEnProps {
  greeting: string;
  actionUrl: string;
  preview?: string;
}

export const isProductDeliveredEnData = (
  data: any
): data is ProductDeliveredEnProps =>
  typeof data.greeting === "string" && typeof data.actionUrl === "string";

export const ProductDeliveredEnTemplate = ({
  greeting,
  actionUrl,
  preview = "Your order has been shipped",
}: ProductDeliveredEnProps) => (
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
        On Its Way
      </Text>

      <Text className="text-[14px] text-[#111111] m-0 mb-8">{greeting}</Text>

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
              SHIPPING STATUS
            </Text>

            <div
              style={{
                backgroundColor: "#e3f2fd",
                color: "#1976d2",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                textAlign: "center",
                marginBottom: "16px",
                border: "1px solid #bbdefb",
              }}
            >
              🚚 Shipped - In Transit
            </div>

            <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-4">
              Your order has left our warehouse and is on its way to you. You'll
              receive updates about the delivery progress.
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
                Track Order
              </Link>
            </Section>

            <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
              Click the button to follow your shipment status in real time
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
              DELIVERY INFORMATION
            </Text>
            <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-2">
              • Estimated time: 2-5 business days
            </Text>
            <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-2">
              • You'll receive tracking notifications
            </Text>
            <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-2">
              • Package requires signature upon delivery
            </Text>
            <Text className="text-[12px] text-[#333333] m-0 leading-[1.4]">
              • Make sure to be available at the delivery address
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Enlaces adicionales */}
      <Section className="text-center mb-8">
        <Text className="text-[12px] text-[#666666] m-0 mb-3">
          Need to change something?
        </Text>
        <div className="text-[12px]">
          <Link href="#" className="text-[#0070c9] no-underline mr-4">
            Change Address
          </Link>
          <span className="mx-1 text-[#333333] font-light">|</span>
          <Link href="#" className="text-[#0070c9] no-underline ml-4">
            Contact Support
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
        Thank you for choosing MyUrbanScoot. We're excited for you to receive
        your order.
      </Text>
      <Text className="text-[14px] text-[#111111] m-0">
        It will be with you soon!
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
ProductDeliveredEnTemplate.PreviewProps = {
  greeting: "Hello! Your order has been shipped and is on its way.",
  actionUrl: "https://myurbanscoot.com/orders/track/123456",
  preview: "Your MyUrbanScoot order has been shipped",
} as ProductDeliveredEnProps;

export default ProductDeliveredEnTemplate;
