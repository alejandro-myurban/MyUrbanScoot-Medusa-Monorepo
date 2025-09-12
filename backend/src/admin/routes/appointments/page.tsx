import { Container, Heading, Text, Button, Table, Badge, Drawer, Select } from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Calendar, Store, Trash, Edit, Settings, Eye, EyeOff } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { sdk } from "../../lib/sdk"
import Filters from "./components/filters"
import WorkshopModal from "./components/workshop-modal"
import AppointmentModal from "./components/appointments-modal"

export interface Workshop {
  id: string
  name: string
  address: string
  phone: string
  opening_hours: {
    mon_fri: Array<{ start: string; end: string }>
    sat: Array<{ start: string; end: string }>
    sun: Array<{ start: string; end: string }>
  }
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  customer_name: string
  customer_phone: string
  description?: string
  start_time: string
  end_time: string
  workshop_id: string
  workshop?: Workshop
  state: string
  created_at: string
  updated_at: string
}

const AppointmentsDashboard = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchWorkshop, setSearchWorkshop] = useState("")
  const [searchDate, setSearchDate] = useState("")
  const [searchCustomer, setSearchCustomer] = useState("")
  const [showWorkshopModal, setShowWorkshopModal] = useState(false)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  
  const [showWorkshopManagement, setShowWorkshopManagement] = useState(false)

  // Fetch workshops
  const { data: workshops = [], isLoading: loadingWorkshops } = useQuery<Workshop[]>({
    queryKey: ["workshops"],
    queryFn: async () => {
      const res = await sdk.client.fetch<{ workshops: Workshop[] }>(
        `/workshops`,
        { method: "GET" }
      )
      return res.workshops || []
    }
  })

  // Fetch appointments
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await sdk.client.fetch<{ appointments: Appointment[] }>(
        `/appointments`,
        { method: "GET" }
      )
      return res.appointments || []
    }
  })

  // Delete workshop mutation
  const deleteWorkshopMutation = useMutation({
    mutationFn: async (id: string) => {
      await sdk.client.fetch(`/workshops/${id}`, { method: "DELETE" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] })
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    }
  })

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await sdk.client.fetch(`/appointments/${id}`, { method: "DELETE" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    }
  })

  // ✅ Nueva mutación para actualizar el estado de la cita
  const updateAppointmentStateMutation = useMutation({
    mutationFn: async ({ id, state }: { id: string, state: string }) => {
      const res = await sdk.client.fetch<{ appointment: Appointment }>(
        `/appointments/${id}`,
        {
          method: "PUT",
          body: JSON.stringify({ state }),
          headers: { "Content-Type": "application/json" }
        }
      );
      return res.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    }
  });

  const filteredAppointments = useMemo(() => {
    let filtered = appointments
    
    if (searchWorkshop && searchWorkshop !== "all") {
      filtered = filtered.filter(apt => apt.workshop_id === searchWorkshop)
    }

    if (searchDate) {
      filtered = filtered.filter(apt => 
        new Date(apt.start_time).toISOString().split('T')[0] === searchDate
      )
    }

    if (searchCustomer) {
      filtered = filtered.filter(apt =>
        apt.customer_name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
        apt.customer_phone.includes(searchCustomer)
      )
    }
    
    return filtered.sort((a, b) => 
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    )
  }, [appointments, searchWorkshop, searchDate, searchCustomer])

  const handleEditWorkshop = (workshop: Workshop) => {
    setEditingWorkshop(workshop)
    setShowWorkshopModal(true)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setShowAppointmentModal(true)
  }

  const handleCloseModal = () => {
    setShowWorkshopModal(false)
    setShowAppointmentModal(false)
    setEditingWorkshop(null)
    setEditingAppointment(null)
  }

  const handleStateChange = (appointmentId: string, newState: string) => {
    updateAppointmentStateMutation.mutate({ id: appointmentId, state: newState });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'green';
      case 'canceled': return 'red';
      case 'completed': return 'blue';
      default: return 'orange';
    }
  }

  if (loadingAppointments || loadingWorkshops) {
    return (
      <Container>
        <Heading level="h2">Gestión de Turnos</Heading>
        <Text>Cargando...</Text>
      </Container>
    )
  }

  return (
    <Container className="p-4">
      <div className="flex justify-between items-center mb-6">
        <Heading level="h2" className="flex items-center gap-2">
          <Calendar className="w-8 h-8 text-blue-500" /> Gestión de Turnos
        </Heading>
        <div className="flex gap-2">
          <Button 
            variant="transparent" 
            size="small"
            onClick={() => setShowWorkshopManagement(!showWorkshopManagement)}
            className="text-gray-500 hover:text-gray-700"
          >
            {showWorkshopManagement ? <EyeOff className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          </Button>
          
          {showWorkshopManagement && (
            <Button variant="secondary" onClick={() => setShowWorkshopModal(true)}>
              <Store className="w-4 h-4 mr-2" /> Nueva Tienda
            </Button>
          )}
          
          <Button onClick={() => setShowAppointmentModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Turno
          </Button>
        </div>
      </div>

      <Filters
        searchWorkshop={searchWorkshop}
        setSearchWorkshop={setSearchWorkshop}
        searchDate={searchDate}
        setSearchDate={setSearchDate}
        searchCustomer={searchCustomer}
        setSearchCustomer={setSearchCustomer}
        workshops={workshops}
      />

      {showWorkshopManagement && (
        <div className="mb-8">
          <Heading level="h3" className="mb-4 flex items-center gap-2">
            <Store className="w-5 h-5" /> Tiendas ({workshops.length})
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workshops.map(workshop => (
              <div key={workshop.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <Heading level="h3">{workshop.name}</Heading>
                  <div className="flex gap-2">
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => handleEditWorkshop(workshop)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => deleteWorkshopMutation.mutate(workshop.id)}
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <Text className="text-sm text-gray-600 mb-2">{workshop.address}</Text>
                <Text className="text-sm text-gray-600 mb-2">Tel: {workshop.phone}</Text>
                <Badge className="mt-2">
                  {appointments.filter(apt => apt.workshop_id === workshop.id).length} turnos
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <Heading level="h3" className="mb-4">
          Turnos ({filteredAppointments.length})
        </Heading>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Cliente</Table.HeaderCell>
              <Table.HeaderCell>Teléfono</Table.HeaderCell>
              <Table.HeaderCell>Tienda</Table.HeaderCell>
              <Table.HeaderCell>Fecha</Table.HeaderCell>
              <Table.HeaderCell>Horario</Table.HeaderCell>
              <Table.HeaderCell>Estado</Table.HeaderCell>
              <Table.HeaderCell>Acciones</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredAppointments.map(appointment => (
              <Table.Row key={appointment.id}>
                <Table.Cell>
                  <div>
                    <Text className="font-medium">{appointment.customer_name}</Text>
                    {appointment.description && (
                      <Text className="text-sm text-gray-600">{appointment.description}</Text>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>{appointment.customer_phone}</Table.Cell>
                <Table.Cell>{appointment.workshop?.name || appointment.workshop_id}</Table.Cell>
                <Table.Cell>{formatDate(appointment.start_time)}</Table.Cell>
                <Table.Cell>
                  {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                </Table.Cell>
                <Table.Cell>
                  {/* ✅ Select para cambiar el estado */}
                  <Select
                    value={appointment.state}
                    onValueChange={(value) => handleStateChange(appointment.id, value)}
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="pending">Pending</Select.Item>
                      <Select.Item value="confirmed">Confirmed</Select.Item>
                      <Select.Item value="completed">Completed</Select.Item>
                      <Select.Item value="canceled">Canceled</Select.Item>
                    </Select.Content>
                  </Select>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => handleEditAppointment(appointment)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => deleteAppointmentMutation.mutate(appointment.id)}
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      <WorkshopModal
        workshop={editingWorkshop}
        onClose={handleCloseModal}
        open={showWorkshopModal}
      />

      <AppointmentModal
        appointment={editingAppointment}
        workshops={workshops}
        onClose={handleCloseModal}
        open={showAppointmentModal}
      />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Gestión de Turnos",
  icon: Calendar,
})

export default AppointmentsDashboard