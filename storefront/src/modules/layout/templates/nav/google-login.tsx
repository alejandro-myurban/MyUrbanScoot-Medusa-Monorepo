"use client" 

import { sdk } from "@lib/config"
import Google2 from "./google-icon"

export default function Login() {
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
      <button className="flex justify-center items-center gap-2" onClick={loginWithGoogle}>Login with <Google2 className="text-2xl" /></button>
    </div>
  )
}
