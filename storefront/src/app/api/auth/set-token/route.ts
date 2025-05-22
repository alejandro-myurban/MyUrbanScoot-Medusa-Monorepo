import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    // Set the cookie
    cookies().set("_medusa_jwt", token, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting auth token:", error)
    return NextResponse.json(
      { error: "Failed to set auth token" },
      { status: 500 }
    )
  }
}