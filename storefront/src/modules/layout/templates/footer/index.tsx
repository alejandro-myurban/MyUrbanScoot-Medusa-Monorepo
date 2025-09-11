"use client"
import { Button, Input } from "@medusajs/ui"
import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  ChevronDown,
  Smartphone,
  Monitor,
} from "lucide-react"
import { useState } from "react"
import TikTok from "./icons/titok"
import Instagram from "./icons/instagram"

const Footer = () => {
  const [email, setEmail] = useState("")
  const [showMoreInfo, setShowMoreInfo] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter subscription
    console.log("Subscribing email:", email)
    setEmail("")
  }

  const footerLinks = {
    "Sobre Nosotros": [
      "¿Quiénes somos?",
      "Prensa",
      "¡Estamos contratando!",
      "Opiniones",
    ],
    Ayuda: [
      "Contacto",
      "Centro de ayuda",
      "Entrega",
      "Devoluciones y reembolsos",
    ],
    Servicios: [
      "Garantía comercial",
      "Seguros",
      "Renove",
      "Descuento estudiantes",
      "Profesionales: ¿cómo vender aquí?",
      "Portal del vendedor",
      "Pago 100% seguro",
    ],
    "Guías de compra": ["Tecnoteca", "Comparar productos", "Ideas de regalos"],
    "Condiciones legales": [
      "Condiciones generales de uso",
      "Condiciones generales de venta",
      "Términos y Condiciones de Renove",
      "Configuración de cookies y privacidad",
      "Protección de datos",
      "Otra información legal",
      "Aviso Legal",
      "Reportar contenido ilícito",
    ],
  }

  return (
    <footer className="bg-footer max-w-screen-large mx-auto text-footer-foreground border-t border-footer-border">
      {/* Newsletter Section */}
      <div className="bg-footer-newsletter">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">
                Obtén 15 € de descuento en tu primer pedido.
              </h3>
              <p className="text-footer-muted text-sm">
                En pedidos de 250 € o más al suscribirte a nuestra newsletter.
              </p>
            </div>

            <div className="flex-1 max-w-md">
              <form onSubmit={handleSubscribe} className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background text-foreground border-gray-300"
                    required
                  />
                </div>
                <Button type="submit" className="px-6">
                  Me suscribo
                </Button>
              </form>

              <button
                onClick={() => setShowMoreInfo(!showMoreInfo)}
                className="flex items-center gap-1 text-sm text-footer-muted mt-3 hover:text-footer-foreground transition-colors"
              >
                Más información
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showMoreInfo ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showMoreInfo && (
                <div className="mt-3 text-xs text-footer-muted">
                  Al suscribirte aceptas recibir nuestras comunicaciones
                  comerciales. Puedes darte de baja en cualquier momento.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold mb-4 text-footer-foreground">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-footer-muted hover:text-footer-foreground transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Media & Apps */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mt-12 pt-8 border-t border-footer-border gap-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* Social Media */}
            <div className="flex gap-4">
              <a
                href="#"
                className="text-footer-muted hover:text-footer-foreground transition-colors"
              >
                <TikTok className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-footer-muted hover:text-footer-foreground transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>

            {/* Certification */}
            {/* <div className="flex items-center gap-2 bg-footer-border rounded-lg px-3 py-2">
              <div className="w-8 h-8 bg-footer-foreground rounded-full flex items-center justify-center">
                <span className="text-footer font-bold text-sm">B</span>
              </div>
              <div className="text-xs">
                <div className="font-semibold">Certified</div>
                <div className="text-footer-muted">Corporation</div>
              </div>
            </div> */}
          </div>

          {/* App Downloads */}
          <div className="flex gap-3">
              <img className="w-[350px]" src="/logomys.png" />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-8 pt-6 border-t border-footer-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-sm text-footer-muted">
              © {new Date().getFullYear()} MyUrbanScoot. Todos los derechos
              reservados.
            </div>

            <div className="flex items-center gap-3 text-xs text-footer-muted">
              <span>Pago 100% seguro</span>
              <div className="flex gap-2">
                <div className="w-12 h-12  rounded flex items-center justify-center text-white text-xs font-bold">
                  <img src="visa-image.svg" />
                </div>
                <div className="w-12 h-12  rounded flex items-center justify-center text-white text-xs font-bold">
                  <img src="paypal-image.svg" />
                </div>
                <div className="w-12 h-12 rounded flex items-center justify-center text-white text-xs font-bold">
                   <img src="stripe-image.svg" />
                </div>
                <div className="w-12 h-12  rounded flex items-center justify-center text-white text-xs font-bold">
                 <img src="klarna-image.svg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
