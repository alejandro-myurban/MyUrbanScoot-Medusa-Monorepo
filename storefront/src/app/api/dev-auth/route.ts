// app/api/dev-auth/route.ts
import { NextRequest, NextResponse } from 'next/server'

const DEV_PASSWORD = process.env.DEV_ACCESS_PASSWORD || 'mi-password-seguro-2024'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (password === DEV_PASSWORD) {
      // Crear respuesta exitosa con cookie
      const response = NextResponse.json({ success: true })
      
      // Establecer cookie de autenticación que expira en 24 horas
      response.cookies.set('dev-access', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 horas en segundos
        path: '/'
      })

      return response
    } else {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Opcional: endpoint para logout
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  
  // Eliminar la cookie de autenticación
  response.cookies.delete('dev-access')
  
  return response
}