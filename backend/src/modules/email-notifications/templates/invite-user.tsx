import {
  Button,
  Link,
  Section,
  Text,
  Img,
  Hr,
  Row,
  Column,
} from "@react-email/components";
import { Base } from "./base";

/**
 * The key for the InviteUserEmail template, used to identify it
 */
export const INVITE_USER = "invite-user";

/**
 * The props for the InviteUserEmail template
 */
export interface InviteUserEmailProps {
  /**
   * The link that the user can click to accept the invitation
   */
  inviteLink: string;
  /**
   * The preview text for the email, appears next to the subject
   * in mail providers like Gmail
   */
  preview?: string;
}

/**
 * Type guard for checking if the data is of type InviteUserEmailProps
 * @param data - The data to check
 */
export const isInviteUserData = (data: any): data is InviteUserEmailProps =>
  typeof data.inviteLink === "string" &&
  (typeof data.preview === "string" || !data.preview);

/**
 * The InviteUserEmail template component built with react-email
 */
export const InviteUserEmail = ({
  inviteLink,
  preview = `You've been invited to Medusa!`,
}: InviteUserEmailProps) => {
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
        {/* Logo de Medusa arriba */}
        <Section className="mt-[32px] text-center mb-8">
          <Img
            src="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg"
            alt="Medusa"
            style={{ 
              margin: "0 auto", 
              width: "112px",
              height: "auto"
            }}
          />
        </Section>

        <Text className="text-[32px] font-light text-[#888888] text-center m-0 mb-8">
          Invitación de Administrador
        </Text>

        <Text className="text-[14px] text-[#111111] m-0 mb-8 text-center">
          Has sido invitado/a a ser administrador/a en <strong>Medusa</strong>.
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
                INVITACIÓN
              </Text>
              <Text className="text-[14px] font-semibold m-0 leading-[1.4] mb-4">
                Panel de Administración Medusa
              </Text>
              
              {/* Botón de aceptar invitación */}
              <Section className="text-center mb-4">
                <Link
                  href={inviteLink}
                  style={{
                    backgroundColor: "#000000",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "600",
                    textDecoration: "none",
                    padding: "12px 24px",
                    display: "inline-block",
                  }}
                >
                  Aceptar Invitación
                </Link>
              </Section>

              <Text className="text-[10px] text-[#666666] m-0 leading-[1.4] mb-2">
                O COPIA ESTE ENLACE
              </Text>
              <Link
                href={inviteLink}
                className="text-[11px] text-[#1155cc] underline m-0 leading-[1.4] break-all"
                style={{ 
                  wordBreak: "break-all",
                  overflowWrap: "break-word",
                  maxWidth: "100%"
                }}
              >
                {inviteLink}
              </Link>
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
                INFORMACIÓN IMPORTANTE
              </Text>
              <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-2">
                • Esta invitación expira en 24 horas
              </Text>
              <Text className="text-[12px] text-[#333333] m-0 leading-[1.4] mb-2">
                • Tendrás acceso completo al panel de administración
              </Text>
              <Text className="text-[12px] text-[#333333] m-0 leading-[1.4]">
                • Si no esperabas esta invitación, puedes ignorar este email
              </Text>
            </Column>
          </Row>
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
          Si tienes alguna pregunta sobre esta invitación o preocupaciones sobre la seguridad de tu cuenta, 
          responde a este email para ponerte en contacto con nosotros.
        </Text>
        <Text className="text-[14px] text-[#111111] m-0">
          ¡Bienvenido/a al equipo!
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

InviteUserEmail.PreviewProps = {
  inviteLink:
    "https://mywebsite.com/app/invite?token=abc123ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
} as InviteUserEmailProps;

export default InviteUserEmail;