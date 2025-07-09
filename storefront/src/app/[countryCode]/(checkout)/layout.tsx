import MedusaCTA from "@modules/layout/components/medusa-cta"
import Nav from "@modules/layout/templates/nav"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white relative min-h-screen flex flex-col">
      {/* Header fijo */}
      <div className="h-16 bg-white border-b flex-shrink-0">
        <Nav />
      </div>
      
      {/* Contenido principal que crece */}
      <div className="relative flex-1" data-testid="checkout-container">
        {children}
      </div>
      
      {/* Footer que se pega abajo */}
      <div className="py-6 w-full flex items-center justify-center flex-col gap-2 flex-shrink-0">
        <img src="/logomys.png" className="w-full sm:w-2/6 px-6" />
        <small className="text-gray-500">
          &copy; Todos los derechos reservados. MyUrbanScoot 2025.
        </small>
      </div>
    </div>
  )
}