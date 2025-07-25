import { sdk } from "@lib/config"
import { Button, toast } from "@medusajs/ui"
import React from "react"
import { z } from "zod"

interface FinancingProps {
  price: number
  productName: string
}

interface FinancingOption {
  months: number
  monthlyPayment: number
  totalAmount: number
  interestRate: number
}

// Schema de validación con Zod
const financingFormSchema = z.object({
  phone: z
    .string()
    .min(1, "El teléfono es obligatorio")
    .regex(
      /^((\+|00)[1-9]\d{1,14}|[6789]\d{8})$/,
      "Formato no válido. España: 600123456 | Internacional: +34600123456"
    ),
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Formato de email no válido"),
})

type FormData = z.infer<typeof financingFormSchema>

export default function Financing({ price, productName }: FinancingProps) {
  const [selectedMonths, setSelectedMonths] = React.useState<number>(12)
  const [showForm, setShowForm] = React.useState<boolean>(false)
  const [formData, setFormData] = React.useState<FormData>({
    phone: "",
    email: "",
  })
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)

  // Tasas de interés
  const interestRates = {
    12: 0.08, // 8% anual
    18: 0.1, // 10% anual
    24: 0.12, // 12% anual
    36: 0.15, // 15% anual
    48: 0.18, // 18% anual
    60: 0.2, // 20% anual
  }

  const calculateFinancing = (
    principal: number,
    months: number,
    annualRate: number
  ): FinancingOption => {
    const monthlyRate = annualRate / 12
    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1)
    const totalAmount = monthlyPayment * months

    return {
      months,
      monthlyPayment,
      totalAmount,
      interestRate: annualRate,
    }
  }

  const financingOptions: FinancingOption[] = [12, 18, 24, 36, 48, 60].map(
    (months) =>
      calculateFinancing(
        price,
        months,
        interestRates[months as keyof typeof interestRates]
      )
  )

  const selectedOption = financingOptions.find(
    (option) => option.months === selectedMonths
  )

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = (): boolean => {
    try {
      financingFormSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof FormData, string>> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof FormData] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const data = {
        ...formData,
        selectedMonths,
        price,
        productName,
        requestDate: new Date().toISOString(),
      }

      const res = await sdk.client.fetch("/store/financing-data", {
        method: "POST",
        body: data,
      })

      // Resetear formulario en caso de éxito
      setFormData({ phone: "", email: "" })
      setShowForm(false)
      
      // Aquí podrías mostrar un mensaje de éxito
      console.log("Solicitud enviada correctamente")
      toast.success("Información enviada correctamente")
    } catch (error) {
      console.error("Error al enviar la solicitud:", error)
      // Aquí podrías mostrar un mensaje de error
    } finally {
      setIsSubmitting(false)
    }
  }

  if (price <= 0) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">
          Precio no válido para calcular financiación
        </p>
      </div>
    )
  }

  return (
    <div className=" py-4">
      <h3 className="text-lg font-medium mb-4">Financiación disponible</h3>

      <div className="mb-4">
        <label
          htmlFor="months-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Selecciona el plazo:
        </label>
        <select
          id="months-select"
          value={selectedMonths}
          onChange={(e) => setSelectedMonths(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {financingOptions.map((option) => (
            <option key={option.months} value={option.months}>
              {option.months} meses ({(option.interestRate * 100).toFixed(0)}%
              TIN)
            </option>
          ))}
        </select>
      </div>

      {selectedOption && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Cuota mensual:</span>
            <span className="text-xl font-semibold text-blue-600">
              {formatCurrency(selectedOption.monthlyPayment)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Total a pagar:</span>
            <span>{formatCurrency(selectedOption.totalAmount)}</span>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Intereses:</span>
            <span>{formatCurrency(selectedOption.totalAmount - price)}</span>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">
        Cálculos orientativos, sujetos a aprobación
      </p>

      <Button
        className="w-full mt-4 h-10 hover:bg-mysGreen-100 bg-mysGreen-100/70 text-black font-archivoBlack font-semibold border-none uppercase"
        onClick={() => setShowForm(true)}
      >
        Quiero financiarlo
      </Button>

      {/* Sección del formulario con animación */}
      <div
        className={` transition-all duration-500 ease-in-out ${
          showForm ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-gray-800 mb-3">
            Para la gestión de financiación necesitas:
          </h4>

          <ul className="text-sm text-gray-600 mb-4 space-y-1">
            <li>1. Nómina con antigüedad</li>
            <li>2. Justificante de titularidad de tu cuenta de banco</li>
          </ul>

          <p className="text-sm text-gray-600 mb-4">
            Déjanos tu número de teléfono y tu correo electrónico para que
            podamos contactarte, informarte de todo el proceso y realizar la
            gestión.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Teléfono *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="España: 600123456 | Internacional: +34600123456"
                required
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  errors.phone 
                    ? "border-red-500 focus:border-red-500" 
                    : "border-gray-300 focus:border-blue-500"
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Correo electrónico *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tu@email.com"
                required
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  errors.email 
                    ? "border-red-500 focus:border-red-500" 
                    : "border-gray-300 focus:border-blue-500"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md"
              >
                {isSubmitting ? "Enviando..." : "Enviar solicitud"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setErrors({})
                  setFormData({ phone: "", email: "" })
                }}
                disabled={isSubmitting}
                className="px-4 h-9 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-md"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}