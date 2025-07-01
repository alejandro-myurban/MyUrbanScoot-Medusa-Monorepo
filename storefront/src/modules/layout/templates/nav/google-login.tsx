"use client" // include with Next.js 13+

import { sdk } from "@lib/config"
import { Google } from "@medusajs/icons"
import { useTranslation } from "react-i18next"

export default function GoogleLogin() {
  const { t } = useTranslation()
  const loginWithGoogle = async () => {
    const result = await sdk.auth.login("customer", "google", {})

    if (typeof result === "object" && result.location) {
      // redirect to Google for authentication
      window.location.href = result.location

      return
    }

    if (typeof result !== "string") {
      // result failed, show an error
      alert("Authentication failed")
      return
    }

    // all subsequent requests are authenticated
    const { customer } = await sdk.store.customer.retrieve()

    console.log(customer)
  }

  return (
    <div className="p-[2px] rounded-lg   bg-[linear-gradient(to_right,#3b82f6,#ef4444,#facc15,#10b981)]">
      <button
        type="button"
        onClick={loginWithGoogle}
        className="flex text-sm justify-center font-dmSans font-semibold items-center py-2 px-1 gap-2 w-full bg-white text-black/90 uppercase rounded-lg"
      >
        {t("login.google")} <Google />
      </button>
    </div>
  )
}
