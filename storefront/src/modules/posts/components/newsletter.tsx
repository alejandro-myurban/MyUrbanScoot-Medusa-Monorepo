import React from "react"

const Newsletter = () => {
  return (
    <section className="mt-12 bg-gradient-to-r from-mysGreen-100 to-gray-900 rounded-2xl p-8 text-white text-center">
      <h3 className="text-2xl font-bold mb-4">¡No te pierdas nada!</h3>
      <p className="text-mysGreen-100-100 mb-6 max-w-2xl mx-auto">
        Suscríbete y recibe los mejores artículos sobre patinetes eléctricos
        directamente en tu email.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          placeholder="Tu email"
          className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
        />
        <button className="bg-white text-mysGreen-100 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          Suscribirse
        </button>
      </div>
    </section>
  )
}

export default Newsletter
