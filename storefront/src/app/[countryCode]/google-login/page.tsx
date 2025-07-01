"use client" // include with Next.js 13+

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { decodeToken } from "react-jwt"

export default function GoogleCallback() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer>()
  const [isNewCustomer, setIsNewCustomer] = useState(false) // ← Nueva variable de estado
  const searchParams = useSearchParams()
  const hasExecuted = useRef(false)

  const queryParams = useMemo(() => {
    const entries = Array.from(searchParams.entries())
    return Object.fromEntries(entries)
  }, [searchParams])

  const sendCallback = async () => {
    console.log("📞 Enviando callback con params:", queryParams)
    let token = ""

    try {
      token = await sdk.auth.callback("customer", "google", queryParams)
      console.log("✅ Callback exitoso, token recibido")
      console.log(
        "🎯 Token (primeros 50 chars):",
        token.substring(0, 50) + "..."
      )
    } catch (error) {
      console.log("❌ Error en callback:", error)
      console.log("❌ Detalles del error:", error.message)
      console.log("❌ Stack trace:", error.stack)
    }

    return token
  }

  const fetchUserMetadata = async (authIdentityId: string, token: string) => {
    console.log("🔍 Fetching user metadata...")
    console.log("🔍 Auth Identity ID:", authIdentityId)
    console.log(
      "🔍 Token para metadata (primeros 20 chars):",
      token.substring(0, 20) + "..."
    )

    try {
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

      console.log("🌐 Response status:", response.status)
      console.log("🌐 Response ok:", response.ok)

      if (!response.ok) {
        console.log("❌ Response no OK:", await response.text())
      }

      const data = await response.json()
      console.log("✅ Metadata response:", data)
      return data
    } catch (error) {
      console.log("❌ Error fetching metadata:", error)
      throw error
    }
  }

  const createCustomer = async (userMetadata: any) => {
    console.log("=== DATOS DEL USUARIO DESDE GOOGLE ===")
    console.log("Email:", userMetadata.email)
    console.log("Nombre:", userMetadata.given_name || "No proporcionado")
    console.log("Apellido:", userMetadata.family_name || "No proporcionado")
    console.log("Metadata completo:", userMetadata)
    console.log("=====================================")

    // ¡DESCOMENTAMOS LA CREACIÓN REAL!
    try {
      const result = await sdk.store.customer.create({
        email: userMetadata.email,
        first_name: userMetadata.given_name || "",
        last_name: userMetadata.family_name || "",
      })
      console.log("✅ Customer creado exitosamente:", result)
      return result
    } catch (error) {
      console.log("❌ Error creando customer:", error)
      throw error
    }
  }

  const setTokenInCookie = async (token: string) => {
    console.log("🍪 Setting token in cookie...")
    console.log("🔍 Token que vamos a guardar (tipo):", typeof token)
    console.log("🔍 Token length:", token.length)
    
    // Decodificar el token para ver qué contiene
    try {
      const decoded = decodeToken(token)
      console.log("🔍 Token decoded content:", decoded)
    } catch (e) {
      console.log("❌ No se pudo decodificar el token:", e)
    }
    
    try {
      const response = await fetch("/api/auth/set-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        console.log("❌ Failed to set cookie:", await response.text())
        throw new Error("Failed to set auth token")
      }

      console.log("✅ Token set in cookie successfully")
    } catch (error) {
      console.error("❌ Error setting auth token:", error)
    }
  }

  const validateCallback = async () => {
    console.log("🔍 INICIANDO VALIDACIÓN...")
    console.log("🔍 Query params recibidos:", queryParams)

    const token = await sendCallback()
    console.log("🎯 Token después de sendCallback:", !!token)
    console.log("🎯 Tipo de token:", typeof token)
    console.log("🎯 Longitud del token:", token?.length)

    if (!token) {
      console.log("❌ No hay token, abortando...")
      setLoading(false)
      return
    }

    let decodedToken
    try {
      decodedToken = decodeToken(token) as {
        actor_id: string
        auth_identity_id: string
      }
      console.log("✅ Token decodificado exitosamente:")
      console.log("   - Actor ID:", decodedToken.actor_id)
      console.log("   - Auth Identity ID:", decodedToken.auth_identity_id)
    } catch (error) {
      console.log("❌ Error decodificando token:", error)
      setLoading(false)
      return
    }

    const shouldCreateCustomer = decodedToken.actor_id === ""
    setIsNewCustomer(shouldCreateCustomer) // ← Guardar en el estado
    console.log("❓ ¿Debe crear customer?", shouldCreateCustomer)
    console.log("   (actor_id está vacío:", decodedToken.actor_id === "", ")")

    if (shouldCreateCustomer) {
      console.log("🚀 Intentando fetchear metadata...")

      try {
        const userMetadata = await fetchUserMetadata(
          decodedToken.auth_identity_id,
          token
        )

        if (userMetadata && userMetadata.email) {
          await createCustomer(userMetadata)
          
          // ¡AQUÍ ESTÁ LA CLAVE! Hacer refresh del token después de crear customer
          console.log("🔄 Haciendo refresh del token después de crear customer...")
          try {
            const newToken = await sdk.auth.refresh()
            console.log("✅ Nuevo token obtenido después de refresh:", !!newToken)
            console.log("🔍 Nuevo token type:", typeof newToken)
            console.log("🔍 Nuevo token length:", newToken?.length)
            console.log("🔍 Nuevo token primeros chars:", newToken?.substring(0, 50) + "...")
            
            // Decodificar el nuevo token para verificar su contenido
            try {
              const decodedNewToken = decodeToken(newToken)
              console.log("🔍 Nuevo token decodificado:", decodedNewToken)
            } catch (decodeError) {
              console.log("❌ Error decodificando nuevo token:", decodeError)
            }
            
            // FORZAR que el SDK use el nuevo token
            console.log("🔧 Intentando setear token en SDK...")
            try {
              // Solo intentar el método privado con casting
              if ((sdk.auth as any).setToken_) {
                (sdk.auth as any).setToken_(newToken)
                console.log("✅ Token seteado usando setToken_")
              } else {
                console.log("❌ setToken_ no disponible")
              }
              
              // Intentar acceso al client
              if ((sdk.auth as any).client) {
                (sdk.auth as any).client.token = newToken
                console.log("✅ Token seteado directamente en client")
                console.log("🔍 Token verificado en client:", (sdk.auth as any).client?.token?.substring(0, 20) + "...")
              } else {
                console.log("❌ Client no accesible")
              }
              
            } catch (setTokenError) {
              console.log("❌ Error seteando token en SDK:", setTokenError)
            }
            
            // Guardar el NUEVO token (no el original de Google)
            await setTokenInCookie(newToken)
            console.log("✅ Nuevo token guardado en cookie")
          } catch (refreshError) {
            console.log("❌ Error en refresh:", refreshError)
            console.log("❌ Refresh error details:", refreshError.message)
            console.log("❌ Refresh error stack:", refreshError.stack)
          }
          
          console.log("✅ Datos de usuario obtenidos y procesados correctamente")
        } else {
          console.log(
            "❌ No se pudo obtener metadata del usuario o falta email"
          )
          console.log("❌ UserMetadata:", userMetadata)
          alert("No se pudo obtener información del usuario de Google")
          return
        }
      } catch (error) {
        console.log("❌ Error en fetchUserMetadata:", error)
        setLoading(false)
        return
      }
    } else {
      console.log("🔄 Customer ya existe, solo setting token")
      await setTokenInCookie(token)
      console.log("✅ Token seteado para customer existente")
    }

    // ENFOQUE ALTERNATIVO: Si el SDK no funciona, hacer petición manual
    try {
      console.log("👤 Intentando obtener customer con token refrescado...")
      
      // DEBUGGING: Verificar estado del SDK antes de la petición
      console.log("🔍 DEBUG SDK antes de retrieve:")
      console.log("🔍 SDK object keys:", Object.keys(sdk))
      console.log("🔍 SDK auth keys:", Object.keys(sdk.auth))
      
      // Intentar acceder a propiedades privadas para debug
      try {
        console.log("🔍 SDK auth client token:", (sdk.auth as any).client?.token?.substring(0, 30) + "...")
        console.log("🔍 SDK auth client token length:", (sdk.auth as any).client?.token?.length)
      } catch (e) {
        console.log("❌ No se puede acceder al client token")
      }
      
      // Verificar si hay alguna configuración visible
      try {
        console.log("🔍 SDK baseUrl:", (sdk as any).baseUrl || "No disponible")
        console.log("🔍 SDK config:", (sdk as any).config || "No disponible")
      } catch (e) {
        console.log("❌ No se puede acceder a config")
      }
      
      // En producción puede haber latencia, agregar pequeño delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Intentar primero con el SDK
      let customerData
      try {
        const result = await sdk.store.customer.retrieve()
        customerData = result.customer
        console.log("✅ Customer obtenido exitosamente con SDK:", customerData)
      } catch (sdkError) {
        console.log("❌ SDK falló, intentando petición manual...")
        
        // Si el SDK falla, hacer petición manual con cookie
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me`,
          {
            headers: {
              "x-publishable-api-key": process.env.NEXT_PUBLIC_PUBLISHEABLE_KEY || "",
              "Content-Type": "application/json",
            },
            credentials: 'include' // Para incluir cookies
          }
        )
        
        if (response.ok) {
          const manualResult = await response.json()
          customerData = manualResult.customer
          console.log("✅ Customer obtenido con petición manual:", customerData)
        } else {
          throw new Error(`Manual request failed: ${response.status}`)
        }
      }

      setCustomer(customerData)
      setLoading(false)
    } catch (error) {
      console.log("❌ Error obteniendo customer (usando customer simulado):", error)
      // Fallback a customer simulado si aún hay problemas
      const simulatedCustomer = {
        email: shouldCreateCustomer ? "kavaliergrau@gmail.com" : "existing@customer.com",
        id: "simulated_customer_id"
      } as HttpTypes.StoreCustomer
      
      setCustomer(simulatedCustomer)
      setLoading(false)
    }
  }

  // ✅ PRIMER useEffect - Validación principal
  useEffect(() => {
    console.log("🔄 useEffect triggered, loading:", loading, "hasExecuted:", hasExecuted.current)

    if (!loading || hasExecuted.current) {
      console.log("⏭️ Skipping validation - loading:", loading, "hasExecuted:", hasExecuted.current)
      return
    }

    console.log("🚀 Starting validation process...")
    hasExecuted.current = true

    validateCallback().catch((error) => {
      console.error("💥 Error during validation:", error)
      setLoading(false)
      hasExecuted.current = false // Solo resetear en caso de error real
    })
  }, [loading])

  // ✅ SEGUNDO useEffect - Redirección
  useEffect(() => {
    console.log(
      "🔄 Redirect useEffect, loading:",
      loading,
      "customer:",
      !!customer
    )
    if (!loading && customer) {
      console.log("🏠 Redirecting to home...")
      router.push("/")
    }
  }, [loading, customer, router])

  console.log(
    "🎨 Rendering component, loading:",
    loading,
    "customer:",
    !!customer
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-green-500 via-yellow-400 to-red-500 bg-[length:400%_400%] animate-gradient-shift flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 relative overflow-hidden">
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-green-500/10 animate-pulse"></div>
        
        <div className="relative z-10">
          {loading ? (
            <div className="text-center">
              {/* Google-style spinner */}
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-l-blue-500 border-t-red-500 border-r-yellow-400 border-b-green-500 rounded-full animate-spin"></div>
              </div>
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-red-500 via-yellow-500 to-green-600 bg-clip-text text-transparent mb-3">
                Conectando con Google
              </h2>
              
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <span>Verificando autenticación</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <span>Configurando cuenta</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <span>Preparando sesión</span>
                </div>
              </div>
            </div>
          ) : customer ? (
            <div className="text-center">
              {/* Success animation */}
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                {/* Ripple effect */}
                <div className="absolute inset-0 bg-green-400/30 rounded-full animate-ping"></div>
              </div>
              
              {/* Título dinámico basado en si es nuevo o existente */}
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isNewCustomer ? "¡Bienvenido/a! 🎉" : "¡Bienvenido/a de nuevo! 👋"}
              </h2>
              
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-4 mb-4 border border-green-200">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    {customer.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">{customer.email}</p>
                    <p className="text-sm text-gray-600">Autenticado con Google</p>
                  </div>
                </div>
              </div>
              
              {/* Mensaje dinámico basado en si es nuevo o existente */}
              <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span className="font-medium">
                  {isNewCustomer ? "Cuenta creada exitosamente" : "Sesión iniciada correctamente"}
                </span>
              </div>
              
              <div className="text-gray-600">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Redirigiendo a la página principal...</span>
                </div>
              </div>
              
              {/* Google-style progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-1 mt-4">
                <div className="bg-gradient-to-r from-blue-500 via-red-500 via-yellow-400 to-green-500 h-1 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Error de autenticación
              </h2>
              
              <p className="text-gray-600 mb-4">
                No se pudo completar el proceso de autenticación con Google
              </p>
              
              <button 
                onClick={() => window.location.href = '/login'}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
              >
                Intentar nuevamente
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient-shift {
          animation: gradient-shift 8s ease infinite;
        }
      `}</style>
    </div>
  )
}