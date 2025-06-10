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
    <div>
      <button
        className="flex gap-2 justify-center items-center"
        onClick={loginWithGoogle}
      >
        {t("login.google")}
        <Google />
      </button>
    </div>
  )
}
