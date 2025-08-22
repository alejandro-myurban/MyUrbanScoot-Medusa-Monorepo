// app/api/upload-file/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Función para normalizar nombres de archivo
const normalizeFileName = (originalName: string) => {
  // Extraer extensión
  const extension = originalName.split('.').pop()?.toLowerCase() || 'pdf'
  const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, "")
  
  // Normalizar el nombre (sin extensión)
  let normalizedName = nameWithoutExtension
    // Convertir a minúsculas
    .toLowerCase()
    // Quitar acentos (á→a, ñ→n, ü→u, etc.)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    // Reemplazar espacios y símbolos por guiones
    .replace(/[\s_\.]+/g, "-")
    // Quitar caracteres peligrosos/nocivos
    .replace(/[^a-z0-9\-]/g, "")
    // Limpiar múltiples guiones
    .replace(/\-+/g, "-")
    // Quitar guiones al inicio/final
    .replace(/^-+|-+$/g, "")

  // Acortar a máximo 12 caracteres (sin contar la extensión)
  if (normalizedName.length > 12) {
    // Tomar los primeros 8 caracteres + timestamp corto para evitar duplicados
    const timestamp = Date.now().toString().slice(-4) // últimos 4 dígitos
    normalizedName = normalizedName.substring(0, 8) + timestamp
  }
  
  // Si aún es muy corto, añadir algo descriptivo
  if (normalizedName.length < 3) {
    normalizedName = "doc" + Date.now().toString().slice(-4)
  }
  
  // Quitar guión final si quedó
  normalizedName = normalizedName.replace(/-+$/, "")
  
  return `${normalizedName}.${extension}`
}

export async function POST(request: NextRequest) {
  console.log('🚀 API Route: Iniciando upload...')
  
  try {
    // Verificar que el request tiene contenido
    const contentType = request.headers.get('content-type')
    console.log('📋 Content-Type:', contentType)
    
    if (!contentType?.includes('multipart/form-data')) {
      console.error('❌ Content-Type incorrecto')
      return NextResponse.json(
        { error: 'Content-Type debe ser multipart/form-data' },
        { status: 400 }
      )
    }

    // Obtener el FormData
    let formData: FormData
    try {
      formData = await request.formData()
      console.log('📁 FormData obtenido correctamente')
    } catch (formError) {
      console.error('❌ Error al parsear FormData:', formError)
      return NextResponse.json(
        { error: 'Error al procesar el archivo' },
        { status: 400 }
      )
    }

    // Verificar que hay archivos
    const files = formData.getAll('files') as File[]
    console.log('📂 Archivos encontrados:', files.length)
    
    if (files.length === 0) {
      console.error('❌ No se encontraron archivos')
      return NextResponse.json(
        { error: 'No se encontraron archivos para subir' },
        { status: 400 }
      )
    }

    // Log del archivo
    const file = files[0]
    const normalizedFileName = normalizeFileName(file.name)
    
    console.log('📄 Archivo:', {
      originalName: file.name,
      normalizedName: normalizedFileName,
      originalLength: file.name.length,
      normalizedLength: normalizedFileName.length,
      size: file.size,
      type: file.type
    })
    
    // Verificar que el nombre normalizado no exceda el límite
    const nameWithoutExt = normalizedFileName.split('.')[0]
    if (nameWithoutExt.length > 12) {
      console.warn('⚠️ ADVERTENCIA: Nombre normalizado excede 12 caracteres:', nameWithoutExt)
    } else {
      console.log('✅ Nombre normalizado dentro del límite:', nameWithoutExt.length, 'caracteres')
    }

    // Crear nuevo FormData con el nombre normalizado
    const normalizedFormData = new FormData()
    normalizedFormData.append('files', file, normalizedFileName)

    // Hacer la petición a Medusa
    console.log('🔄 Enviando a Medusa...')
    
    // IMPORTANTE: NO agregar Content-Type header para FormData
    // fetch automáticamente configurará multipart/form-data con boundary
    const medusaResponse = await fetch('https://backend-production-9e9f.up.railway.app/store/upload-image', {
      method: 'POST',
      body: normalizedFormData, // FormData con nombre normalizado
      headers: {
        'x-publishable-api-key': 'pk_14db1a49297371bf3f8d345db0cf016616d4244f1d593db1050907c88333cd21',
        // NO incluir 'Content-Type' - fetch lo configurará automáticamente
      },
    })

    console.log('📊 Respuesta de Medusa:', {
      status: medusaResponse.status,
      statusText: medusaResponse.statusText,
      ok: medusaResponse.ok
    })

    // Leer la respuesta
    let result: any
    try {
      const responseText = await medusaResponse.text()
      console.log('📝 Respuesta raw:', responseText)
      
      result = JSON.parse(responseText)
      console.log('✅ Respuesta parseada:', result)
    } catch (parseError) {
      console.error('❌ Error al parsear respuesta de Medusa:', parseError)
      return NextResponse.json(
        { error: 'Error en la respuesta del servidor de archivos' },
        { status: 502 }
      )
    }

    if (!medusaResponse.ok) {
      console.error('❌ Error de Medusa:', result)
      return NextResponse.json(
        { error: result.message || 'Error uploading file to Medusa' },
        { status: medusaResponse.status }
      )
    }

    console.log('🎉 Upload exitoso!')
    return NextResponse.json(result)

  } catch (error) {
    console.error('💥 Error general en API route:', error)
    
    // Error más detallado
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}