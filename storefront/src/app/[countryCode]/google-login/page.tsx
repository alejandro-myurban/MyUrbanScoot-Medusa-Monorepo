"use client"

import { useEffect, useState } from "react"
import { sdk } from "../../../lib/config"

export default function GoogleCallback() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ email: string }>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    ;(async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const res = await fetch(`/api/google-profile?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(JSON.stringify(data))

        // 1) Guardamos token en el SDK para futuras peticiones
        sdk.client.setToken(data.token)

        // 2) Mostramos email y demás
        setProfile(data.profile)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <span>Loading…</span>
  if (error) return <span style={{ color: "red" }}>{error}</span>
  return (
    <div>
      <p>¡Bienvenido, {profile?.email}!</p>
    </div>
  )
}
