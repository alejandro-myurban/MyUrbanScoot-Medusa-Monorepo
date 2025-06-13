import { Text } from "@react-email/components";
import * as React from "react";
import { Base } from "./base";

export const RESET_PASSWORD = "reset-password";

export interface ResetPasswordProps {
  url: string; // Cambiado de actionUrl a url
  preview?: string;
}

export const isResetPasswordData = (data: any): data is ResetPasswordProps =>
  typeof data.url === "string";

export const ResetPassword = ({
  url,
  preview = "Restablece tu contraseña",
}: ResetPasswordProps) => (
  <Base preview={preview}>
    <Text>¡Hola!</Text>
    <Text>
      Hemos recibido una solicitud para restablecer tu contraseña.
    </Text>
    <Text>
      Para continuar, haz clic en el siguiente enlace:
    </Text>
    <Text>
      <a 
        href={url}
        style={{
          background: '#3b82f6',
          color: 'white',
          padding: '12px 24px',
          textDecoration: 'none',
          borderRadius: '6px',
          display: 'inline-block',
          fontWeight: 'bold'
        }}
      >
        Restablecer Contraseña
      </a>
    </Text>
    <Text>
      Si no solicitaste este cambio, puedes ignorar este email de forma segura.
    </Text>
    <Text>
      Por seguridad, este enlace expirará en 24 horas.
    </Text>
  </Base>
);

// Preview props actualizados

// Add preview props for the email dev server
ResetPassword.PreviewProps = {
  url: "https://storefront-production-e469.up.railway.app/reset-password?token=example-token&email=user@example.com",
  preview: "Restablece tu contraseña",
} as ResetPasswordProps;