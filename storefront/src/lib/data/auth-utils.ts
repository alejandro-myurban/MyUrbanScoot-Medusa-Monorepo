// Utility to safely get auth headers in different contexts
export const getAuthHeadersSafe = async (): Promise<Record<string, string>> => {
  try {
    // Only import and use cookies in server context
    if (typeof window === 'undefined') {
      const { cookies } = await import('next/headers')
      const token = cookies().get("_medusa_jwt")?.value
      
      if (token) {
        return { authorization: `Bearer ${token}` }
      }
    }
    
    return {}
  } catch (error) {
    // Fallback if cookies can't be accessed
    return {}
  }
}