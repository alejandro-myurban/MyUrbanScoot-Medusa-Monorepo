import { Drawer, Input, Button, Select, Textarea, Text } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../../lib/sdk"
import { Appointment, Workshop } from "../page"
import { X } from "lucide-react"

interface AppointmentModalProps {
  appointment: Appointment | null
  workshops: Workshop[]
  onClose: () => void
  open: boolean
}

const AppointmentModal = ({ appointment, workshops, onClose, open }: AppointmentModalProps) => {
  const queryClient = useQueryClient()
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [description, setDescription] = useState("")
  const [workshopId, setWorkshopId] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("60")

  useEffect(() => {
    if (appointment) {
      setCustomerName(appointment.customer_name)
      setCustomerPhone(appointment.customer_phone)
      setDescription(appointment.description || "")
      setWorkshopId(appointment.workshop_id)
      
      const startDate = new Date(appointment.start_time)
      setDate(startDate.toISOString().split('T')[0])
      setTime(startDate.toTimeString().slice(0, 5))
      
      const durationMs = new Date(appointment.end_time).getTime() - startDate.getTime()
      setDuration((durationMs / (1000 * 60)).toString())
    } else {
      // Set default values for new appointment
      setCustomerName("")
      setCustomerPhone("")
      setDescription("")
      setWorkshopId(workshops[0]?.id || "")
      setDate(new Date().toISOString().split('T')[0])
      setTime("09:00")
      setDuration("60")
    }
  }, [appointment, open, workshops])

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending POST request to create new appointment with data:", data)
      const res = await sdk.client.fetch<{ appointment: Appointment }>("/appointments", {
        method: "POST",
        body: JSON.stringify(data)
      })
      console.log("Appointment created successfully:", res.appointment)
      return res.appointment
    },
    onSuccess: () => {
      console.log("Create mutation success. Invalidating appointments cache.")
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      onClose()
    },
    onError: (error) => {
      console.error("Error creating appointment:", error)
    }
  })

  const updateAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending PUT request to update appointment with ID:", appointment?.id, " and data:", data)
      const res = await sdk.client.fetch<{ appointment: Appointment }>(`/appointments/${appointment?.id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      })
      console.log("Appointment updated successfully:", res.appointment)
      return res.appointment
    },
    onSuccess: () => {
      console.log("Update mutation success. Invalidating appointments cache.")
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      onClose()
    },
    onError: (error) => {
      console.error("Error updating appointment:", error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log("Form submission triggered.")
    
    if (!workshopId || !customerName || !customerPhone || !date || !time) {
      console.log("Validation failed. Missing required fields.")
      return
    }

    const startTime = new Date(`${date}T${time}`)
    const endTime = new Date(startTime.getTime() + parseInt(duration) * 60000)

    const data = {
      customer_name: customerName,
      customer_phone: customerPhone,
      description,
      workshop_id: workshopId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString()
    }

    if (appointment) {
      updateAppointmentMutation.mutate(data)
    } else {
      createAppointmentMutation.mutate(data)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>{appointment ? "Editar Turno" : "Nuevo Turno"}</Drawer.Title>
          <Button variant="transparent" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </Drawer.Header>
        <Drawer.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Text className="text-sm font-medium mb-2">Tienda *</Text>
              <Select value={workshopId} onValueChange={setWorkshopId}>
                <Select.Trigger>
                  <Select.Value placeholder="Seleccionar tienda" />
                </Select.Trigger>
                <Select.Content>
                  {workshops.map(workshop => (
                    <Select.Item key={workshop.id} value={workshop.id}>
                      {workshop.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div>
              <Text className="text-sm font-medium mb-2">Nombre del Cliente *</Text>
              <Input
                placeholder="Nombre completo"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div>
              <Text className="text-sm font-medium mb-2">Teléfono *</Text>
              <Input
                placeholder="Número de teléfono"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <Text className="text-sm font-medium mb-2">Descripción (opcional)</Text>
              <Textarea
                placeholder="Detalles adicionales del turno"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text className="text-sm font-medium mb-2">Fecha *</Text>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Text className="text-sm font-medium mb-2">Hora *</Text>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Text className="text-sm font-medium mb-2">Duración</Text>
              <Select value={duration} onValueChange={setDuration}>
                <Select.Trigger>
                  <Select.Value placeholder="Seleccionar duración" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="30">30 minutos</Select.Item>
                  <Select.Item value="60">60 minutos</Select.Item>
                  <Select.Item value="90">90 minutos</Select.Item>
                  <Select.Item value="120">120 minutos</Select.Item>
                </Select.Content>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createAppointmentMutation.isPending || updateAppointmentMutation.isPending}
              >
                {appointment ? "Actualizar" : "Crear"} Turno
              </Button>
            </div>
          </form>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}

export default AppointmentModal