import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { image, documentType, mimeType } = await request.json()

    if (!image || !documentType) {
      return NextResponse.json(
        {
          error: "Imagen y tipo de documento requeridos",
        },
        { status: 400 }
      )
    }

    console.log(`📄 Recibido documento: ${documentType}, MIME: ${mimeType || 'no especificado'}`)

    // Validar tipos de documento permitidos
    const validTypes = [
      "dni_front",
      "dni_back",
      "bank_certificate",
      "bank_statement",
      "payroll",
    ]
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        {
          error: `Tipo de documento no válido. Debe ser: ${validTypes.join(
            ", "
          )}`,
        },
        { status: 400 }
      )
    }

    console.log(`🔍 Verificando documento tipo: ${documentType}`)

    // Llamar a tu API de Medusa
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/document-verification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key":
            "pk_14db1a49297371bf3f8d345db0cf016616d4244f1d593db1050907c88333cd21",
        },
        body: JSON.stringify({
          image,
          documentType,
          mimeType,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error del backend:", errorData)
      throw new Error(errorData.error || "Error al verificar documento")
    }

    const result = await response.json()
    console.log(`✅ Resultado de verificación:`, result.data)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error en API route:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        //@ts-ignore
        details: error.message,
      },
      { status: 500 }
    )
  }
}
