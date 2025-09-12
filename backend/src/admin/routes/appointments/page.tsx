import { Container, Heading, Text, Button, Table, Badge, Drawer, Select } from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useMemo, useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Calendar, Store, Trash, Edit, Settings, Eye, EyeOff, Clock, AlertTriangle } from "lucide-react"
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
  state: 'pending' | 'confirmed' | 'completed' | 'canceled'
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
  
  // ✅ Nuevo estado para filtrar por estado
  const [statusFilter, setStatusFilter] = useState<string>('confirmed')
  
  // ✅ Estado para mostrar estadísticas de limpieza
  const [cleanupStats, setCleanupStats] = useState<{ cleaned: number; pending: number } | null>(null)

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

  // ✅ Fetch appointments con parámetros de estado
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["appointments", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') {
        params.append('state', statusFilter)
      }
      
      const res = await sdk.client.fetch<{ appointments: Appointment[] }>(
        `/appointments?${params.toString()}`,
        { method: "GET" }
      )
      return res.appointments || []
    }
  })

  // ✅ Mutación para limpiar citas pendientes vencidas
  const cleanupPendingMutation = useMutation({
    mutationFn: async () => {
      const res = await sdk.client.fetch<{ cleaned: number; pending: number }>(
        `/appointments/cleanup`,
        { method: "POST" }
      )
      return res
    },
    onSuccess: (data) => {
      setCleanupStats(data)
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      // Ocultar estadísticas después de 5 segundos
      setTimeout(() => setCleanupStats(null), 5000)
    }
  })

  // ✅ Ejecutar limpieza automática al cargar el dashboard
  useEffect(() => {
    // Ejecutar limpieza solo una vez al montar el componente
    cleanupPendingMutation.mutate()
  }, [])

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

  // ✅ Mutación para actualizar el estado de la cita
  const updateAppointmentStateMutation = useMutation({
    mutationFn: async ({ id, state }: { id: string, state: string }) => {
      let endpoint = `/appointments/${id}`
      let method = "PUT"
      let body: any = { state }

      // ✅ Si es confirmación o cancelación, usar endpoints específicos
      if (state === 'confirmed') {
        endpoint = `/appointments/${id}/confirm`
        method = "POST"
        body = {}
      } else if (state === 'canceled') {
        endpoint = `/appointments/${id}/cancel`
        method = "POST"
        body = {}
      }

      const res = await sdk.client.fetch<{ appointment: Appointment }>(
        endpoint,
        {
          method,
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" }
        }
      );
      return res.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    }
  });

  // ✅ Filtrar citas con mejor lógica
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

  // ✅ Función para verificar si una cita pending está vencida
  const isPendingExpired = (appointment: Appointment) => {
    if (appointment.state !== 'pending') return false
    const now = new Date()
    const created = new Date(appointment.created_at)
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return diffHours > 12
  }

  // ✅ Contar citas por estado
  const appointmentStats = useMemo(() => {
    const stats = appointments.reduce((acc, apt) => {
      acc[apt.state] = (acc[apt.state] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const expired = appointments.filter(isPendingExpired).length
    return { ...stats, expired }
  }, [appointments])

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
      case 'pending': return 'orange';
      default: return 'gray';
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'canceled': return 'Cancelado';
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      default: return status;
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
          
          {/* ✅ Botón de limpieza manual */}
          <Button 
            variant="secondary" 
            size="small"
            onClick={() => cleanupPendingMutation.mutate()}
            disabled={cleanupPendingMutation.isPending}
          >
            <Clock className="w-4 h-4 mr-2" /> 
            {cleanupPendingMutation.isPending ? 'Limpiando...' : 'Limpiar Vencidos'}
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

      {/* ✅ Mostrar estadísticas de limpieza */}
      {cleanupStats && (
        <div className="mb-4 p-4 bg-gray-600 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-green-600" />
            <Text className="font-medium">
              Limpieza automática completada: {cleanupStats.cleaned} citas eliminadas, 
              {cleanupStats.pending} pendientes restantes
            </Text>
          </div>
        </div>
      )}


      {/* ✅ Filtros mejorados con selector de estado */}
      <div className="mb-6">
        <Filters
          searchWorkshop={searchWorkshop}
          setSearchWorkshop={setSearchWorkshop}
          searchDate={searchDate}
          setSearchDate={setSearchDate}
          searchCustomer={searchCustomer}
          setSearchCustomer={setSearchCustomer}
          workshops={workshops}
        />
        
        {/* ✅ Filtro por estado */}
        <div className="mt-4 flex items-center gap-4">
          <Text className="font-medium">Filtrar por estado:</Text>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <Select.Trigger className="w-48">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">Todos los estados</Select.Item>
              <Select.Item value="confirmed">Solo Confirmados</Select.Item>
              <Select.Item value="pending">Solo Pendientes</Select.Item>
              <Select.Item value="completed">Solo Completados</Select.Item>
              <Select.Item value="canceled">Solo Cancelados</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>

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
                  {appointments.filter(apt => apt.workshop_id === workshop.id && apt.state === 'confirmed').length} confirmados
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
              <Table.HeaderCell>Tiempo</Table.HeaderCell>
              <Table.HeaderCell>Acciones</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredAppointments.map(appointment => {
              const isExpired = isPendingExpired(appointment)
              const hoursFromCreation = Math.floor((new Date().getTime() - new Date(appointment.created_at).getTime()) / (1000 * 60 * 60))
              
              return (
                <Table.Row key={appointment.id} className={isExpired ? 'bg-red-50' : ''}>
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
                    {/* ✅ Select mejorado para cambiar el estado */}
                    <div className="flex items-center gap-2">
                      <Select
                        value={appointment.state}
                        onValueChange={(value) => handleStateChange(appointment.id, value)}
                      >
                        <Select.Trigger className="w-32">
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="pending">Pendiente</Select.Item>
                          <Select.Item value="confirmed">Confirmado</Select.Item>
                          <Select.Item value="completed">Completado</Select.Item>
                          <Select.Item value="canceled">Cancelado</Select.Item>
                        </Select.Content>
                      </Select>
                      {isExpired && (
                        <Badge color="red" className="text-xs">
                          Vencido
                        </Badge>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-sm">
                      <Text className={`${hoursFromCreation > 12 && appointment.state === 'pending' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {hoursFromCreation}h desde creación
                      </Text>
                    </div>
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
              )
            })}
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