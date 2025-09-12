// src/app/dashboard/appointments/components/filters.tsx
import { Input, Select, Text } from "@medusajs/ui"
import { Workshop } from "../page"

interface FiltersProps {
  searchWorkshop: string
  setSearchWorkshop: (value: string) => void
  searchDate: string
  setSearchDate: (value: string) => void
  searchCustomer: string
  setSearchCustomer: (value: string) => void
  workshops: Workshop[]
}

const Filters = ({
  searchWorkshop,
  setSearchWorkshop,
  searchDate,
  setSearchDate,
  searchCustomer,
  setSearchCustomer,
  workshops
}: FiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <Text className="text-sm font-medium mb-2 block">Filtrar por Tienda</Text>
        <Select value={searchWorkshop} onValueChange={setSearchWorkshop}>
          <Select.Trigger>
            <Select.Value placeholder="Todas las tiendas" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">Todas las tiendas</Select.Item>
            {workshops.map(workshop => (
              <Select.Item key={workshop.id} value={workshop.id}>
                {workshop.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <div>
        <Text className="text-sm font-medium mb-2 block">Filtrar por Fecha</Text>
        <Input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
        />
      </div>

      <div>
        <Text className="text-sm font-medium mb-2 block">Buscar Cliente</Text>
        <Input
          placeholder="Nombre o teléfono..."
          value={searchCustomer}
          onChange={(e) => setSearchCustomer(e.target.value)}
        />
      </div>
    </div>
  )
}

export default Filters