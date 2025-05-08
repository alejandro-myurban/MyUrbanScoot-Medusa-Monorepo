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

// in @lib/data/payment.ts
export async function cancelPaymentSession(
  cartId: string,
  providerId: string
): Promise<StoreCart> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/carts/${cartId}/payment-sessions/${providerId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to cancel payment session: ${res.statusText}`);
  }

  const { cart } = await res.json();
  return cart;
}
