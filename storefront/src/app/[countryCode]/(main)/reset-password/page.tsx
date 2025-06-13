"use client"

import { useMemo, useState } from "react"
import {
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react"
import { sdk } from "@lib/config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface ResetState {
  status: "idle" | "loading" | "success" | "error"
  message: string
}

export default function ResetPassword() {
  const [loading, setLoading] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetState, setResetState] = useState<ResetState>({
    status: "idle",
    message: "",
  })

  // for other than Next.js
  const searchParams = useMemo(() => {
    if (typeof window === "undefined") {
      return
    }
    return new URLSearchParams(window.location.search)
  }, [])

  const token = useMemo(() => {
    return searchParams?.get("token")
  }, [searchParams])

  const email = useMemo(() => {
    return searchParams?.get("email")
  }, [searchParams])

  // Si hay token, estamos en modo "cambiar contraseña", sino en modo "solicitar reset"
  const isResetMode = !!(token && email)

  const handleRequestReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!emailInput.trim()) {
      setResetState({
        status: "error",
        message: "El email es requerido",
      })
      return
    }

    setResetState({ status: "loading", message: "" })

    try {
      await sdk.auth.resetPassword("customer", "emailpass", {
        identifier: emailInput,
      })
      
      setResetState({
        status: "success",
        message: "Si existe una cuenta con este email, recibirás las instrucciones para restablecer tu contraseña.",
      })
      setEmailInput("") // Limpiar el formulario
    } catch (error) {
      setResetState({
        status: "error",
        message: error instanceof Error ? error.message : "Ocurrió un error inesperado",
      })
    }
  }

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!token) {
      setResetState({
        status: "error",
        message: "Token inválido o expirado",
      })
      return
    }

    if (!password.trim()) {
      setResetState({
        status: "error",
        message: "La contraseña es requerida",
      })
      return
    }

    if (password.length < 8) {
      setResetState({
        status: "error",
        message: "La contraseña debe tener al menos 8 caracteres",
      })
      return
    }

    if (password !== confirmPassword) {
      setResetState({
        status: "error",
        message: "Las contraseñas no coinciden",
      })
      return
    }

    setLoading(true)
    setResetState({ status: "loading", message: "" })

    try {
      await sdk.auth.updateProvider(
        "customer",
        "emailpass",
        {
          email,
          password,
        },
        token
      )

      setResetState({
        status: "success",
        message:
          "¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.",
      })

      // Limpiar campos
      setPassword("")
      setConfirmPassword("")

      // Opcional: redirigir al login después de unos segundos
      setTimeout(() => {
        window.location.href = "/login"
      }, 3000)
    } catch (error) {
      setResetState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo restablecer la contraseña",
      })
    } finally {
      setLoading(false)
    }
  }

  const isSuccess = resetState.status === "success"
  const isLoading = resetState.status === "loading"

  return (
    <div className="max-w-md mx-auto p-6 py-40 bg-white">
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto mb-4 bg-mysGreen-100 rounded-full flex items-center justify-center">
          {isResetMode ? (
            <Lock className="w-6 h-6 text-black" />
          ) : (
            <Mail className="w-6 h-6 text-black" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isResetMode ? "Nueva Contraseña" : "Restablecer Contraseña"}
        </h2>
        <p className="text-gray-600 text-sm">
          {isResetMode ? (
            <>
              {email && (
                <span className="block font-medium text-gray-800 mb-1">
                  {email}
                </span>
              )}
              Ingresa tu nueva contraseña
            </>
          ) : (
            "Ingresa tu email y te enviaremos las instrucciones"
          )}
        </p>
      </div>

      {isSuccess ? (
        <div className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 text-sm">{resetState.message}</p>
          </div>
          {isResetMode ? (
            <p className="text-gray-600 text-sm">
              Serás redirigido al login en unos segundos...
            </p>
          ) : (
            <button
              onClick={() => {
                setResetState({ status: "idle", message: "" })
                setEmailInput("")
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Enviar otro email
            </button>
          )}
        </div>
      ) : isResetMode ? (
        // Formulario para cambiar contraseña
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (resetState.status === "error") {
                    setResetState({ status: "idle", message: "" })
                  }
                }}
                placeholder="Mínimo 8 caracteres"
                className={`w-full px-4 py-3 pl-11 pr-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mysGreen-100 focus:border-mysGreen-100 transition-colors ${
                  resetState.status === "error"
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (resetState.status === "error") {
                    setResetState({ status: "idle", message: "" })
                  }
                }}
                placeholder="Repite tu contraseña"
                className={`w-full px-4 py-3 pl-11 pr-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mysGreen-100 focus:border-mysGreen-100 transition-colors ${
                  resetState.status === "error"
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Indicador de fortaleza de contraseña */}
          {password && (
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                Fortaleza de la contraseña:
              </div>
              <div className="flex space-x-1">
                <div
                  className={`h-2 w-1/4 rounded ${
                    password.length >= 8 ? "bg-green-400" : "bg-gray-200"
                  }`}
                ></div>
                <div
                  className={`h-2 w-1/4 rounded ${
                    password.length >= 8 && /[A-Z]/.test(password)
                      ? "bg-green-400"
                      : "bg-gray-200"
                  }`}
                ></div>
                <div
                  className={`h-2 w-1/4 rounded ${
                    password.length >= 8 && /[0-9]/.test(password)
                      ? "bg-green-400"
                      : "bg-gray-200"
                  }`}
                ></div>
                <div
                  className={`h-2 w-1/4 rounded ${
                    password.length >= 8 && /[^A-Za-z0-9]/.test(password)
                      ? "bg-green-400"
                      : "bg-gray-200"
                  }`}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                Incluye: mayúsculas, números y símbolos para mayor seguridad
              </div>
            </div>
          )}

          {resetState.status === "error" && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{resetState.message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              isLoading ||
              !password.trim() ||
              !confirmPassword.trim() ||
              password !== confirmPassword
            }
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              isLoading ||
              !password.trim() ||
              !confirmPassword.trim() ||
              password !== confirmPassword
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-mysGreen-100 hover:bg-mysGreen-200 text-black shadow-sm hover:shadow-md"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Actualizando...</span>
              </>
            ) : (
              <span>Restablecer Contraseña</span>
            )}
          </button>
        </form>
      ) : (
        // Formulario para solicitar reset
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value)
                  if (resetState.status === "error") {
                    setResetState({ status: "idle", message: "" })
                  }
                }}
                placeholder="tu@email.com"
                className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mysGreen-100 focus:border-mysGreen-100 transition-colors ${
                  resetState.status === "error" 
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                    : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {resetState.status === "error" && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{resetState.message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !emailInput.trim()}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              isLoading || !emailInput.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-mysGreen-100 hover:bg-mysGreen-200 text-black shadow-sm hover:shadow-md"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <span>Enviar Instrucciones</span>
            )}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          ¿Ya tienes tu contraseña?{" "}
          <LocalizedClientLink
            href="/login"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Iniciar Sesión
          </LocalizedClientLink>
        </p>
      </div>
    </div>
  )
}