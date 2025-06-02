"use client" // include with Next.js 13+

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { decodeToken } from "react-jwt"

export default function GoogleCallback() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer>()

  const searchParams = useSearchParams()

  const queryParams = useMemo(() => {
    const entries = Array.from(searchParams.entries())
    return Object.fromEntries(entries)
  }, [searchParams])

  const sendCallback = async () => {
    let token = ""

    try {
      token = await sdk.auth.callback(
        "customer",
        "google",
        // pass all query parameters received from the
        // third party provider
        queryParams
      )
    } catch (error) {}

    return token
  }

  const fetchUserMetadata = async (authIdentityId: string, token: string) => {
    // Fetch user metadata from your custom endpoint using the token we just received
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/auth`,
      {
        headers: {
          "x-publishable-api-key":
            process.env.NEXT_PUBLIC_PUBLISHEABLE_KEY || "",
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return await response.json()
  }

  const createCustomer = async (userMetadata: any) => {
    // Use email from user metadata instead of hardcoded value
    await sdk.store.customer.create({
      email: userMetadata.email,
      first_name: userMetadata.given_name || "",
      last_name: userMetadata.family_name || "",
    })
  }

  const setTokenInCookie = async (token: string) => {
    // Set token in cookie via a server action
    try {
      const response = await fetch("/api/auth/set-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        throw new Error("Failed to set auth token")
      }
    } catch (error) {
      console.error("Error setting auth token:", error)
    }
  }

  const refreshToken = async (token: string) => {
    // refresh the token
    await sdk.auth.refresh()
    // Set token in cookie
    await setTokenInCookie(token)
  }

  const validateCallback = async () => {
    const token = await sendCallback()
    const decodedToken = decodeToken(token) as {
      actor_id: string
      auth_identity_id: string
    }

    const shouldCreateCustomer = decodedToken.actor_id === ""

    if (shouldCreateCustomer) {
      // Fetch user metadata from Google auth identity using the token
      const userMetadata = await fetchUserMetadata(
        decodedToken.auth_identity_id,
        token
      )

      if (userMetadata && userMetadata.email) {
        await createCustomer(userMetadata)
        await refreshToken(token)
      } else {
        alert("No se pudo obtener información del usuario de Google")
        return
      }
    } else {
      // If customer already exists, just set the token
      await setTokenInCookie(token)
    }

    // all subsequent requests are authenticated
    const { customer: customerData } = await sdk.store.customer.retrieve()

    setCustomer(customerData)
    setLoading(false)
    // The redirect is now handled in a separate useEffect
  }

  useEffect(() => {
    if (!loading) {
      return
    }

    validateCallback().catch((error) => {
      console.error("Error during validation:", error)
      setLoading(false)
    })
  }, [loading])

  useEffect(() => {
    // Handle redirection after customer is set and loading is complete
    if (!loading && customer) {
      router.push("/")
    }
  }, [loading, customer, router])

  return (
    <div>
      {loading && <span>Loading...</span>}
      {customer && (
        <span>
          Created customer {customer.email} with Google. Redirecting...
        </span>
      )}
    </div>
  )
}
