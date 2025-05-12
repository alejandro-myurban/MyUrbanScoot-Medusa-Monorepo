import { sdk } from "@lib/config"
import { StoreCart } from "@medusajs/types"
import { cache } from "react"

// Shipping actions
export const listCartPaymentMethods = cache(async function (regionId: string) {
  return sdk.store.payment
    .listPaymentProviders(
      { region_id: regionId },
      { next: { tags: ["payment_providers"] } }
    )
    .then(({ payment_providers }) => payment_providers)
    .catch(() => {
      return null
    })
})

/**
 * Elimina una o más sesiones de pago utilizando el workflow personalizado
 * @param sessionIds Array de IDs de sesiones de pago a eliminar
 * @returns Resultado de la operación
 */
export async function deletePaymentSessions(sessionIds: string[]): Promise<any> {
  console.log("EL FETCH", sessionIds)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payment-session`,
    {
      method: "DELETE",
      credentials: "include", // Importante para mantener las cookies/sesión
      headers: {
        ...(process.env.NEXT_PUBLIC_PUBLISHEABLE_KEY && {
          "x-publishable-api-key": process.env.NEXT_PUBLIC_PUBLISHEABLE_KEY,
        }),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids: sessionIds,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to delete payment sessions: ${res.statusText}`);
  }

  const data = await res.json();
  return data.result || data; // Dependiendo de cómo estructuraste la respuesta
}