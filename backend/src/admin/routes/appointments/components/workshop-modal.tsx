import { Drawer, Input, Button, Text, Textarea } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Workshop } from "../page"
import { X } from "lucide-react"
import { sdk } from "../../../lib/sdk"

interface WorkshopModalProps {
  workshop: Workshop | null
  onClose: () => void
  open: boolean
}

const WorkshopModal = ({ workshop, onClose, open }: WorkshopModalProps) => {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [openingHours, setOpeningHours] = useState({
    mon_fri: [{ start: "09:00", end: "18:00" }],
    sat: [{ start: "09:00", end: "14:00" }],
    sun: [{ start: "", end: "" }],
  });
  
  useEffect(() => {
    if (workshop) {
      setName(workshop.name);
      setAddress(workshop.address);
      setPhone(workshop.phone);
      // Asegurar que el estado inicial de openingHours es un array
      // incluso si la API devuelve un solo objeto (poco probable pero seguro)
      setOpeningHours({
        mon_fri: Array.isArray(workshop.opening_hours.mon_fri) ? workshop.opening_hours.mon_fri : [{ start: "", end: "" }],
        sat: Array.isArray(workshop.opening_hours.sat) ? workshop.opening_hours.sat : [{ start: "", end: "" }],
        sun: Array.isArray(workshop.opening_hours.sun) ? workshop.opening_hours.sun : [{ start: "", end: "" }],
      });
    } else {
      // Reiniciar el formulario con valores por defecto
      setName("");
      setAddress("");
      setPhone("");
      setOpeningHours({
        mon_fri: [{ start: "09:00", end: "18:00" }],
        sat: [{ start: "09:00", end: "14:00" }],
        sun: [{ start: "", end: "" }],
      });
    }
  }, [workshop, open]);

  const createWorkshopMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await sdk.client.fetch<{ workshop: Workshop }>("/workshops", {
        method: "POST",
        body: data,
      });
      return res.workshop;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
      onClose();
    },
  });

  const updateWorkshopMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await sdk.client.fetch<{ workshop: Workshop }>(`/workshops/${workshop?.id}`, {
        method: "PUT",
        body: data,
      });
      return res.workshop;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, address, phone, opening_hours: openingHours };
    
    if (workshop) {
      updateWorkshopMutation.mutate(data);
    } else {
      createWorkshopMutation.mutate(data);
    }
  };

  const updateTimeSlot = (
    day: keyof typeof openingHours,
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: prev[day].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const addTimeSlot = (day: keyof typeof openingHours) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: "", end: "" }],
    }));
  };

  const removeTimeSlot = (day: keyof typeof openingHours, index: number) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>{workshop ? "Editar Tienda" : "Nueva Tienda"}</Drawer.Title>
          <Button variant="transparent" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </Drawer.Header>
        <Drawer.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            
            <Textarea
              placeholder="Dirección"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
            
            <Input
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <div>
              <Text className="text-sm font-medium mb-2">Horarios de Atención</Text>
              
              {Object.entries(openingHours).map(([day, slots]) => (
                <div key={day} className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <Text className="font-medium capitalize">
                      {day.replace('_', ' a ')}
                    </Text>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => addTimeSlot(day as keyof typeof openingHours)}
                    >
                      +
                    </Button>
                  </div>
                  {slots.map((slot, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(day as keyof typeof openingHours, index, "start", e.target.value)}
                      />
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(day as keyof typeof openingHours, index, "end", e.target.value)}
                      />
                      {slots.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => removeTimeSlot(day as keyof typeof openingHours, index)}
                        >
                          -
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createWorkshopMutation.isPending || updateWorkshopMutation.isPending}>
                {workshop ? "Actualizar" : "Crear"} Tienda
              </Button>
            </div>
          </form>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}

export default WorkshopModal
