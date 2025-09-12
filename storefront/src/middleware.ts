import { HttpTypes } from "@medusajs/types"
import { notFound } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "es"
// Nuevo: País por defecto específico
const PREFERRED_DEFAULT_COUNTRY = "es" // España como país por defecto

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap() {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: ["regions"],
      },
    }).then((res) => res.json())

    if (!regions?.length) {
      notFound()
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * Fetches regions from Medusa and sets the region cookie.
 * @param request
 * @param response
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION
    } else if (regionMap.has(PREFERRED_DEFAULT_COUNTRY)) {
      // Nuevo: Priorizar España como país por defecto
      countryCode = PREFERRED_DEFAULT_COUNTRY
    } else if (regionMap.keys().next().value) {
      // Fallback: primer país disponible
      countryCode = regionMap.keys().next().value
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable?"
      )
    }
  }
}

/**
 * 🆕 NUEVA FUNCIÓN: Verificar restricciones de acceso
 */
function checkAccessRestrictions(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  
  // Rutas que siempre están permitidas (públicas)
  const allowedPublicPaths = [
    '/financing-products',
    '/financing-success',
    '/appointments',
    '/api', // APIs necesarias para el funcionamiento
    '/_next', // Assets de Next.js
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
  ]
  
  // Rutas del sistema de login de desarrollo
  const devLoginPaths = ['/dev-login', '/api/dev-auth']
  
  // 🔧 IMPORTANTE: También incluir rutas con código de país
  const pathWithoutCountry = pathname.replace(/^\/[a-z]{2}\//, '/') // Remueve /es/, /en/, etc.
  
  // Verificar si la ruta actual está en las permitidas públicamente
  const isPublicPath = allowedPublicPaths.some(path => 
    pathname.startsWith(path) || pathWithoutCountry.startsWith(path)
  )
  
  // Verificar si es una ruta del sistema de login de desarrollo
  const isDevLoginPath = devLoginPaths.some(path => 
    pathname.startsWith(path) || pathWithoutCountry.startsWith(path)
  )
  
  // 🔧 NUEVO: Verificar si ya estamos EN financing-products para evitar bucles
  const isAlreadyOnFinancingData = pathname === '/financing-products' || 
    pathWithoutCountry === '/financing-products' ||
    pathname.includes('/financing-products')
  
  // Si es una ruta pública, del login de desarrollo, o ya está en financing-products, permitir continuar
  if (isPublicPath || isDevLoginPath || isAlreadyOnFinancingData) {
    return null // null significa "continuar con el procesamiento normal"
  }
  
  // Verificar si el usuario tiene la cookie de desarrollo
  const devCookie = request.cookies.get('dev-access')
  const isDevAuthenticated = devCookie?.value === 'authenticated'
  
  // Si está autenticado como desarrollador, permitir continuar
  if (isDevAuthenticated) {
    return null // null significa "continuar con el procesamiento normal"
  }
  
  // 🚫 Si llegamos aquí, el acceso está restringido
  // Redirigir a financing-products manteniendo el país si existe
  const pathSegments = pathname.split('/').filter(Boolean)
  const firstSegment = pathSegments[0]
  
  // Si el primer segmento es un código de país (2 letras), mantenerlo
  const isCountryCode = firstSegment && firstSegment.length === 2 && /^[a-z]{2}$/.test(firstSegment)
  const redirectPath = isCountryCode 
    ? `/${firstSegment}/financing-products` 
    : '/financing-products'
    
  return NextResponse.redirect(new URL(redirectPath, request.url))
}

/**
 * Middleware to handle region selection, onboarding status, and access restrictions.
 */
export async function middleware(request: NextRequest) {
  // 🆕 PRIMERO: Verificar restricciones de acceso
  const accessCheck = checkAccessRestrictions(request)
  if (accessCheck) {
    return accessCheck // Si hay restricción, redirigir inmediatamente
  }
  
  // 🔄 CONTINUAR: Lógica original de Medusa si el acceso está permitido
  const searchParams = request.nextUrl.searchParams
  const isOnboarding = searchParams.get("onboarding") === "true"
  const cartId = searchParams.get("cart_id")
  const checkoutStep = searchParams.get("step")
  const onboardingCookie = request.cookies.get("_medusa_onboarding")
  const cartIdCookie = request.cookies.get("_medusa_cart_id")

  const regionMap = await getRegionMap()

  const countryCode = regionMap && (await getCountryCode(request, regionMap))

  const urlHasCountryCode =
    countryCode && request.nextUrl.pathname.split("/")[1].includes(countryCode)

  // check if one of the country codes is in the url
  if (
    urlHasCountryCode &&
    (!isOnboarding || onboardingCookie) &&
    (!cartId || cartIdCookie)
  ) {
    return NextResponse.next()
  }

  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname

  const queryString = request.nextUrl.search ? request.nextUrl.search : ""

  let redirectUrl = request.nextUrl.href

  let response = NextResponse.redirect(redirectUrl, 307)

  // If no country code is set, we redirect to the relevant region.
  if (!urlHasCountryCode && countryCode) {
    redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`
    response = NextResponse.redirect(`${redirectUrl}`, 307)
  }

  // If a cart_id is in the params, we set it as a cookie and redirect to the address step.
  if (cartId && !checkoutStep) {
    redirectUrl = `${redirectUrl}&step=address`
    response = NextResponse.redirect(`${redirectUrl}`, 307)
    response.cookies.set("_medusa_cart_id", cartId, { maxAge: 60 * 60 * 24 })
  }

  // Set a cookie to indicate that we're onboarding. This is used to show the onboarding flow.
  if (isOnboarding) {
    response.cookies.set("_medusa_onboarding", "true", { maxAge: 60 * 60 * 24 })
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|favicon.ico|.*\\.png|.*\\.jpg|.*\\.gif|.*\\.svg).*)"], // prevents redirecting on static files
}