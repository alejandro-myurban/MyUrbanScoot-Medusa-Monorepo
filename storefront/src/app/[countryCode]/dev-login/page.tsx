// app/dev-login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DevLoginPage() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/dev-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        // Redirigir a la página principal o donde necesites
        router.push('/')
        router.refresh()
      } else {
        setError('Contraseña incorrecta')
      }
    } catch (error) {
      setError('Error al conectar con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acceso de Desarrollo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa la contraseña para acceder al sitio completo
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Contraseña de desarrollo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Verificando...' : 'Ingresar'}
            </button>
          </div>
          
          <div className="text-center">
            <a 
              href="/financing-data" 
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              Ir a Financing Data (acceso público)
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}