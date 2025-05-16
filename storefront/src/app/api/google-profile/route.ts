import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code  = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state" },
        { status: 400 }
      );
    }

    // 1) Intercambiar code → tokens con Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  process.env.GOOGLE_CALLBACK_URL!,
        grant_type:    "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: "google_token", details: tokenData },
        { status: 400 }
      );
    }

    // 2) Obtener perfil de Google
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const profile = await profileRes.json();

    if (!profileRes.ok) {
      return NextResponse.json(
        { error: "google_profile", details: profile },
        { status: 400 }
      );
    }

    // 3) Validar callback en Medusa
    const medusaCallback = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/google/callback?code=${code}&state=${state}`,
      { method: "POST" }
    );
    const medusaData = await medusaCallback.json();

    if (!medusaCallback.ok) {
      return NextResponse.json(
        { error: "medusa_callback", details: medusaData },
        { status: 400 }
      );
    }

    let finalToken = medusaData.token;

    // 4) Si actor_id viene vacío → cliente nuevo
    if (!medusaData.actor_id) {
      // 4a) Crear customer en Medusa
      await fetch(
        `${process.env.MEDUSA_BACKEND_URL}/store/customers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${finalToken}`,
          },
          body: JSON.stringify({ email: profile.email }),
        }
      );

      // 4b) Refrescar token
      const refreshRes = await fetch(
        `${process.env.MEDUSA_BACKEND_URL}/auth/token/refresh`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${finalToken}` },
        }
      );
      const refreshData = await refreshRes.json();
      finalToken = refreshData.token;
    }

    // 5) Devolver JSON final
    return NextResponse.json(
      {
        profile,
        customer: medusaData.actor_id
          ? { /* podrías pasar aquí medusaData.customer */ }
          : { /* opcional: recuperar con /store/customer */ },
        token: finalToken,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error en /api/google-profile:", err);
    return NextResponse.json(
      { error: "internal_server_error", details: err.message },
      { status: 500 }
    );
  }
}
