import {
  Text,
  Section,
  Row,
  Column,
  Link,
  Img,
} from "@react-email/components";
import { Base } from "./base";
import { translations } from "./lang/lang-translations";

export const PRODUCT_DELIVERED = "product-delivered";

// 🌍 Definición de idiomas soportados
export type SupportedLanguage = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt' | 'nl' | 'pl';

// 📝 Textos por idioma


export interface ProductDeliveredProps {
  greeting: string;
  actionUrl: string;
  preview?: string;
  language?: SupportedLanguage; // 🆕 Nueva prop para idioma
}

export const isProductDeliveredData = (data: any): data is ProductDeliveredProps =>
  typeof data.greeting === "string" && 
  typeof data.actionUrl === "string";

export const ProductDeliveredTemplate = ({
  greeting,
  actionUrl,
  preview,
  language = 'es', // 🆕 Default español
}: ProductDeliveredProps) => {
  // 🔤 Obtener textos según idioma
  const t = translations[language] || translations.es;
  const finalPreview = preview || t.defaultPreview;

  return (
    <Base preview={finalPreview}>
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
          {t.title}
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
                {t.shippingStatus}
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
                  border: "1px solid #bbdefb"
                }}
              >
                {t.statusBadge}
              </div>

              <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-4">
                {t.statusDescription}
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
                  {t.trackButton}
                </Link>
              </Section>

              <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
                {t.trackDescription}
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
                {t.deliveryInfo}
              </Text>
              <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-2">
                {t.estimatedTime}
              </Text>
              <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-2">
                {t.notifications}
              </Text>
              <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-2">
                {t.signature}
              </Text>
              <Text className="text-[12px] text-[#333333] m-0 leading-[1.4]">
                {t.availability}
              </Text>
            </Column>
          </Row>
        </Section>

        {/* Enlaces adicionales */}
        <Section className="text-center mb-8">
          <Text className="text-[12px] text-[#666666] m-0 mb-3">
            {t.needChanges}
          </Text>
          <div className="text-[12px]">
            <Link href="#" className="text-[#0070c9] no-underline mr-4">
              {t.changeAddress}
            </Link>
            <span className="mx-1 text-[#333333] font-light">|</span>
            <Link href="#" className="text-[#0070c9] no-underline ml-4">
              {t.contactSupport}
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
          {t.thankYou}
        </Text>
        <Text className="text-[14px] text-[#111111] m-0">
          {t.soon}
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
};

// Add preview props for the email dev server
ProductDeliveredTemplate.PreviewProps = {
  greeting: "¡Hola! Tu pedido ha sido enviado y está en camino.",
  actionUrl: "https://myurbanscoot.com/orders/track/123456",
  preview: "Tu pedido de MyUrbanScoot ha sido enviado",
  language: "es",
} as ProductDeliveredProps;

export default ProductDeliveredTemplate;