'use client'

import { useState, useEffect } from "react"
import { Button, Text, Select, Input, Heading, Container, Badge, Alert } from "@medusajs/ui"
import { format } from 'date-fns'
import { Calendar, Clock, User, Phone, MapPin, Loader2, ChevronDown } from "lucide-react"

// Definición de tipos
interface Workshop {
  id: string
  name: string
  address: string
  phone: string
  email?: string
}

const API_URL = "http://localhost:9000"

export default function AppointmentsPage() {
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedSlot, setSelectedSlot] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [description, setDescription] = useState("")
  
  const [honeypot, setHoneypot] = useState("")

  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [workshopsLoading, setWorkshopsLoading] = useState(false)
  const [workshopsError, setWorkshopsError] = useState<string | null>(null)

  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const [nameError, setNameError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [slotError, setSlotError] = useState<string | null>(null)
  const [workshopError, setWorkshopError] = useState<string | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    const fetchWorkshops = async () => {
      setWorkshopsLoading(true)
      setWorkshopsError(null)
      try {
        const response = await fetch(`${API_URL}/workshops`, {
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setWorkshops(data.workshops || [])
      } catch (err) {
        setWorkshopsError("Error al cargar los talleres. Por favor, intenta nuevamente.")
        console.error("Error fetching workshops:", err)
      } finally {
        setWorkshopsLoading(false)
      }
    }
    fetchWorkshops()
  }, [])

  useEffect(() => {
    if (!selectedWorkshopId || !selectedDate) {
      setAvailableSlots([])
      return
    }

    const fetchSlots = async () => {
      setSlotsLoading(true)
      setSlotsError(null)
      try {
        const response = await fetch(
          `${API_URL}/workshops/${selectedWorkshopId}/slots?date=${selectedDate}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setAvailableSlots(data.availableSlots || [])
      } catch (err) {
        setSlotsError("Error al cargar los horarios disponibles. Por favor, intenta nuevamente.")
        console.error("Error fetching slots:", err)
      } finally {
        setSlotsLoading(false)
      }
    }
    fetchSlots()
  }, [selectedWorkshopId, selectedDate])

  const validateFields = () => {
    let isValid = true
    setSubmitError(null)
    setNameError(null)
    setPhoneError(null)
    setWorkshopError(null)
    setDateError(null)
    setSlotError(null)

    if (!selectedWorkshopId) {
      setWorkshopError("Por favor, selecciona un taller.")
      isValid = false
    }

    if (!selectedDate) {
      setDateError("Por favor, selecciona una fecha.")
      isValid = false
    }

    if (!selectedSlot) {
      setSlotError("Por favor, selecciona un horario disponible.")
      isValid = false
    }

    if (!customerName.trim()) {
      setNameError("El nombre es un campo obligatorio.")
      isValid = false
    }

    const phoneRegex = /^\+?[0-9\s()+-]+$/;
    if (!customerPhone.trim() || !phoneRegex.test(customerPhone.trim())) {
      setPhoneError("Ingresa un número de teléfono válido.")
      isValid = false
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (honeypot) {
      console.log("Honeypot field was filled. This is likely a bot.")
      return
    }

    if (!validateFields()) {
      setSubmitError("Por favor, corrige los campos marcados antes de continuar.")
      setSubmitSuccess(false)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const [hour, minute] = selectedSlot.split(":").map(Number)
      const [year, month, day] = selectedDate.split('-').map(Number)
      const start_time = new Date(year, month - 1, day, hour, minute)

      const end_time = new Date(start_time)
      end_time.setMinutes(start_time.getMinutes() + 30)

      const appointmentData = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        description: description.trim() || "Cita agendada",
        start_time,
        end_time,
        workshop_id: selectedWorkshopId,
      }

      const response = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      setSubmitSuccess(true)
      setSelectedWorkshopId("")
      setSelectedDate("")
      setSelectedSlot("")
      setCustomerName("")
      setCustomerPhone("")
      setDescription("")
      setAvailableSlots([])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al reservar la cita."
      setSubmitError(errorMessage)
      console.error("Error al reservar la cita:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedWorkshop = workshops.find((w: Workshop) => w.id === selectedWorkshopId)
  const formattedDate = selectedDate.split('-').reverse().join('/')

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerName(e.target.value)
    if (e.target.value.trim()) {
      setNameError(null)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerPhone(e.target.value)
    const phoneRegex = /^\+?[0-9\s()+-]*$/;
    if (e.target.value.trim() && phoneRegex.test(e.target.value.trim())) {
      setPhoneError(null)
    }
  }

  const handleWorkshopChange = (value: string) => {
    setSelectedWorkshopId(value)
    setSelectedDate("")
    setSelectedSlot("")
    setAvailableSlots([])
    setWorkshopError(null)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
    setSelectedSlot("")
    setDateError(null)
  }

  const handleSlotChange = (slot: string) => {
    setSelectedSlot(slot)
    setSlotError(null)
  }

  return (
    <div className="min-h-screen bg-grey-5 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 font-poppins">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8 lg:mb-10">
          <div className="mb-6 sm:mb-8 lg:mb-10">
            <img
              className="w-[280px] sm:w-[350px] lg:w-[500px] h-auto"
              src="/logomys.png"
              alt="Logo"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-archivoBlack text-grey-90 mb-3 sm:mb-4 px-4">
            Reservar Cita
          </h1>
          <Text className="text-sm sm:text-base text-grey-60 max-w-2xl mx-auto leading-relaxed font-dmSans px-4">
            Completa el siguiente formulario para agendar tu cita en nuestro taller. Te guiaremos paso a paso para que sea rápido y sencillo.
          </Text>
        </div>

        <div className="bg-grey-0 rounded-lg sm:rounded-large shadow-lg border border-grey-20 overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-grey-10">
          
            <input 
              type="text" 
              name="honeypot" 
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              autoComplete="off"
            />

            {/* Sección 1: Información del Taller */}
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-mysGreen-100 text-grey-90 rounded-circle flex items-center justify-center text-xs sm:text-sm font-bold font-archivo">
                  1
                </div>
                <h2 className="text-lg sm:text-xl font-archivo font-semibold text-grey-90">
                  Información del Taller
                </h2>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="text-sm font-medium text-grey-70 mb-3 block font-dmSans">
                    Taller <span className="text-mysRed-100">*</span>
                  </label>
                  <div className="relative w-full">
                    <Select
                      value={selectedWorkshopId}
                      onValueChange={handleWorkshopChange}
                    >
                      <Select.Trigger
                        className={`w-full bg-grey-0 border border-grey-30 rounded-base px-4 py-3.5 text-left hover:border-grey-50 focus:ring-1 font-dmSans text-base overflow-hidden min-h-[52px] ${workshopError ? "border-mysRed-100 focus:border-mysRed-100 focus:ring-mysRed-100" : "focus:border-mysGreen-100 focus:ring-mysGreen-100"}`}
                      >
                        <Select.Value placeholder="Seleccionar taller">
                          {selectedWorkshop ? (
                            <div className="w-full overflow-hidden pr-8">
                              <span className="block truncate text-base font-medium text-grey-90 max-w-full">
                                {selectedWorkshop.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-grey-50 text-base">Seleccionar taller</span>
                          )}
                        </Select.Value>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-70 pointer-events-none flex-shrink-0" />
                      </Select.Trigger>

                      <Select.Content
                        className="bg-grey-0 border border-grey-20 rounded-base shadow-xl max-h-80 overflow-y-auto z-50"
                        position="popper"
                        side="bottom"
                        sideOffset={8}
                        avoidCollisions={true}
                        style={{ width: 'var(--radix-select-trigger-width)', maxWidth: '100vw' }}
                      >
                        {workshopsLoading && (
                          <div className="p-6 text-center min-w-0">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-mysGreen-100" />
                            <Text className="text-sm text-grey-50 font-dmSans">Cargando talleres...</Text>
                          </div>
                        )}
                        {workshopsError && (
                          <div className="p-4 min-w-0">
                            <div className="bg-mysRed-100 bg-opacity-10 border border-mysRed-100 text-mysRed-100 px-4 py-3 rounded-soft text-sm font-dmSans">
                              {workshopsError}
                            </div>
                          </div>
                        )}
                        {workshops.map((workshop, index) => (
                          <Select.Item
                            key={workshop.id}
                            value={workshop.id}
                            className={`px-4 py-4 hover:bg-grey-5 cursor-pointer ${index !== workshops.length - 1 ? 'border-b border-grey-10' : ''} flex items-start gap-3 transition-colors duration-200 min-w-0`}
                          >
                            <div className="space-y-2 w-full min-w-0 overflow-hidden">
                              <div className="font-semibold text-grey-90 font-dmSans text-base leading-tight truncate">
                                {workshop.name}
                              </div>
                              <div className="text-sm text-grey-60 font-dmSans leading-relaxed break-words line-clamp-2">
                                📍 {workshop.address}
                              </div>
                              <div className="text-sm text-grey-50 font-dmSans truncate">
                                📞 {workshop.phone}
                              </div>
                            </div>
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  {workshopError && (
                    <Text className="text-mysRed-100 text-sm mt-2 font-dmSans">
                      {workshopError}
                    </Text>
                  )}
                  </div>
                </div>

                {selectedWorkshop && (
                  <div className="bg-mysGreen-100 bg-opacity-10 p-4 rounded-base border border-mysGreen-100 border-opacity-30">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <Text className="font-bold text-grey-90 text-lg font-dmSans leading-tight flex-1 min-w-0">
                          {selectedWorkshop.name}
                        </Text>
                        <span className="bg-mysGreen-100 text-grey-90 px-3 py-1.5 rounded-soft text-sm font-semibold font-dmSans whitespace-nowrap flex-shrink-0">
                          ✓ Seleccionado
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Text className="text-grey-70 text-sm font-dmSans leading-relaxed break-words">
                          📍 {selectedWorkshop.address}
                        </Text>
                        <Text className="text-grey-70 text-sm font-dmSans">
                          📞 {selectedWorkshop.phone}
                        </Text>
                        {selectedWorkshop.email && (
                          <Text className="text-grey-70 text-sm font-dmSans break-all">
                            ✉️ {selectedWorkshop.email}
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sección 2: Fecha y Hora */}
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-mysGreen-100 text-grey-90 rounded-circle flex items-center justify-center text-xs sm:text-sm font-bold font-archivo">
                  2
                </div>
                <h2 className="text-lg sm:text-xl font-archivo font-semibold text-grey-90">
                  Fecha y Hora
                </h2>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-grey-70 mb-2 block font-dmSans">
                      Fecha <span className="text-mysRed-100">*</span>
                    </label>
                    <Input
                      type="date"
                      min={today}
                      value={selectedDate}
                      onChange={handleDateChange}
                      disabled={!selectedWorkshopId}
                      className={`w-full border-grey-30 focus:ring-1 font-dmSans text-sm sm:text-base py-2.5 sm:py-3 ${dateError ? "border-mysRed-100 focus:border-mysRed-100 focus:ring-mysRed-100" : "focus:border-mysGreen-100 focus:ring-mysGreen-100"}`}
                    />
                    {dateError && <Text className="text-mysRed-100 text-xs sm:text-sm mt-1">{dateError}</Text>}
                  </div>
                </div>

                {!selectedWorkshopId && (
                  <div className="text-grey-50 text-xs sm:text-sm font-dmSans p-3 sm:p-4 bg-grey-10 rounded-base">
                    ⚠️ Primero selecciona un taller para ver los horarios disponibles
                  </div>
                )}

                {selectedWorkshopId && !selectedDate && (
                  <div className="text-grey-50 text-xs sm:text-sm font-dmSans p-3 sm:p-4 bg-grey-10 rounded-base">
                    📅 Selecciona una fecha para ver los horarios disponibles
                  </div>
                )}

                {slotsLoading && (
                  <div className="text-center py-6 sm:py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-mysGreen-100" />
                    <Text className="text-xs sm:text-sm text-grey-60 font-dmSans">Buscando horarios disponibles...</Text>
                  </div>
                )}

                {slotsError && (
                  <div className="bg-mysRed-100 bg-opacity-10 border border-mysRed-100 text-mysRed-100 px-3 py-2 rounded-soft text-xs sm:text-sm">
                    {slotsError}
                  </div>
                )}

                {availableSlots.length > 0 && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-grey-70 mb-3 sm:mb-4 block font-dmSans">
                      Horarios disponibles para {formattedDate}:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSlotChange(slot)}
                          className={`h-10 sm:h-12 text-xs sm:text-sm font-medium rounded-base border-2 transition-all font-dmSans ${
                            selectedSlot === slot
                              ? 'border-mysGreen-100 bg-mysGreen-100 text-grey-90'
                              : 'border-grey-30 bg-grey-0 text-grey-70 hover:border-grey-50 hover:bg-grey-5 active:scale-95'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                    {slotError && <Text className="text-mysRed-100 text-xs sm:text-sm mt-2">{slotError}</Text>}
                  </div>
                )}

                {selectedDate && availableSlots.length === 0 && !slotsLoading && selectedWorkshopId && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-soft text-xs sm:text-sm">
                    ℹ️ No hay horarios disponibles para esta fecha. Por favor, selecciona otra fecha.
                  </div>
                )}
              </div>
            </div>

            {/* Sección 3: Datos del Cliente */}
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-mysGreen-100 text-grey-90 rounded-circle flex items-center justify-center text-xs sm:text-sm font-bold font-archivo">
                  3
                </div>
                <h2 className="text-lg sm:text-xl font-archivo font-semibold text-grey-90">
                  Tus Datos
                </h2>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-grey-70 mb-2 block font-dmSans">
                      Nombre completo <span className="text-mysRed-100">*</span>
                    </label>
                    <Input
                      placeholder="Ej: Juan Pérez"
                      value={customerName}
                      onChange={handleNameChange}
                      className={`w-full border-grey-30 focus:ring-1 font-dmSans text-sm sm:text-base py-2.5 sm:py-3 ${nameError ? "border-mysRed-100 focus:border-mysRed-100 focus:ring-mysRed-100" : "focus:border-mysGreen-100 focus:ring-mysGreen-100"}`}
                    />
                    {nameError && <Text className="text-mysRed-100 text-xs sm:text-sm mt-1">{nameError}</Text>}
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium text-grey-70 mb-2 block font-dmSans">
                      Teléfono <span className="text-mysRed-100">*</span>
                    </label>
                    <Input
                      placeholder="Ej: +34 612 345 678"
                      type="tel"
                      value={customerPhone}
                      onChange={handlePhoneChange}
                      className={`w-full border-grey-30 focus:ring-1 font-dmSans text-sm sm:text-base py-2.5 sm:py-3 ${phoneError ? "border-mysRed-100 focus:border-mysRed-100 focus:ring-mysRed-100" : "focus:border-mysGreen-100 focus:ring-mysGreen-100"}`}
                    />
                    {phoneError && <Text className="text-mysRed-100 text-xs sm:text-sm mt-1">{phoneError}</Text>}
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-grey-70 mb-2 block font-dmSans">
                    Descripción del servicio (opcional)
                  </label>
                  <textarea
                    placeholder="Describe el tipo de servicio que necesitas..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-grey-30 rounded-base focus:border-mysGreen-100 focus:ring-1 focus:ring-mysGreen-100 resize-none font-dmSans text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Resumen y botón de confirmación */}
            <div className="p-4 sm:p-6 lg:p-8">
              {selectedSlot && (
                <div className="bg-mysGreen-100 bg-opacity-10 p-4 sm:p-6 rounded-base border border-mysGreen-100 border-opacity-30 mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-grey-90 mb-3 sm:mb-4 font-archivo">
                    📋 Resumen de tu cita
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="space-y-1 sm:space-y-2">
                      <Text className="font-medium text-grey-80 font-dmSans">📅 Fecha:</Text>
                      <Text className="font-dmSans">{formattedDate}</Text>
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Text className="font-medium text-grey-80 font-dmSans">🕒 Horario:</Text>
                      <Text className="font-dmSans">{selectedSlot}</Text>
                    </div>
                    {selectedWorkshop && (
                      <div className="space-y-1 sm:space-y-2 sm:col-span-2">
                        <Text className="font-medium text-grey-80 font-dmSans">🏢 Taller:</Text>
                        <Text className="font-dmSans break-words">{selectedWorkshop.name}</Text>
                      </div>
                    )}
                    {description && (
                      <div className="space-y-1 sm:space-y-2 sm:col-span-2">
                        <Text className="font-medium text-grey-80 font-dmSans">🔧 Descripción:</Text>
                        <Text className="font-dmSans break-words">{description}</Text>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {submitError && (
                <div className="bg-mysRed-100 bg-opacity-10 border border-mysRed-100 text-mysRed-100 px-3 py-2 rounded-soft text-xs sm:text-sm mb-4">
                  ❌ {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-soft text-xs sm:text-sm mb-4">
                  ✅ ¡Cita reservada con éxito! Te contactaremos pronto para confirmar.
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedSlot || isSubmitting}
                className={`w-full h-11 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg font-semibold rounded-base transition-all font-dmSans ${
                  !selectedSlot || isSubmitting
                    ? 'bg-grey-30 text-grey-50 cursor-not-allowed'
                    : 'bg-mysGreen-100 text-grey-90 hover:bg-opacity-90 active:bg-opacity-80 active:scale-[0.99]'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Procesando...</span>
                  </div>
                ) : (
                  "Confirmar Reserva"
                )}
              </button>

              <Text className="text-center text-xs text-grey-50 mt-3 sm:mt-4 font-dmSans px-4">
                Al confirmar, aceptas nuestros términos y condiciones.
              </Text>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}