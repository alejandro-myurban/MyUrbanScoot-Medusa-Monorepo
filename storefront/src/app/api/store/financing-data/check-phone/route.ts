import { NextRequest, NextResponse } from "next/server"
import { sdk } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Next.js API route /api/store/financing-data/check-phone called")
    const body = await request.json()
    console.log("📋 Request body:", body)
    
    // Hacer la llamada al backend de MedusaJS
    console.log("📡 Llamando a backend MedusaJS: /store/financing-data/check-phone")
    const response = await sdk.client.fetch("/store/financing-data/check-phone", {
      method: "POST",
      body: body
    })

    console.log("📨 Response from MedusaJS backend:", response)
    console.log("📊 Response.exists:", response.exists)
    console.log("📊 Response.message:", response.message)
    console.log("📊 Response.normalized_phone:", response.normalized_phone)
    
    const jsonResponse = NextResponse.json(response)
    console.log("🚀 Enviando respuesta al frontend:", response)
    return jsonResponse
    
  } catch (error: any) {
    console.error("❌ Error in phone check API route:", error)
    
    return NextResponse.json(
      { 
        message: "Error al verificar el número de teléfono",
        error: error.message,
        exists: false 
      },
      { status: 500 }
    )
  }
}