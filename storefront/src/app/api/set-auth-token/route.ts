import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json(
        { error: "Missing token in request body" },
        { status: 400 }
      )
    }
    
    // Set the token in a cookie
    cookies().set("_medusa_jwt", token, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting auth token:', error)
    return NextResponse.json(
      { error: "Failed to set auth token" },
      { status: 500 }
    )
  }
}