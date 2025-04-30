// src/admin/widgets/login-image-widget.tsx
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container } from "@medusajs/ui"

const LoginImageWidget = () => {
  return (
    <Container className="flex justify-center p-4">
      <img 
        src="https://myurbanscoot.com/wp-content/uploads/2023/05/cropped-logoH-01-284x62.png" 
        alt="Login image" 
        className="max-w-[200px]"
      />
    </Container>
  )
}

// La configuración del widget
export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginImageWidget