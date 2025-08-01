"use client"

import { useState } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useMutation } from "@tanstack/react-query"
import {
  Heading,
  Switch,
  Container,
  toast,
  Toaster,
  Text,
} from "@medusajs/ui"
import { DetailWidgetProps } from "@medusajs/framework/types"

type ProductVariantWithShipping = {
  id: string
  requires_shipping: boolean
}

const VariantRequiresShippingWidget = ({
  data,
}: DetailWidgetProps<"product_variant"> & {
  data: ProductVariantWithShipping
}) => {
  // Inicializa el estado 'checked' con el valor de 'data.requires_shipping' o false si es nulo
  const [checked, setChecked] = useState(data.requires_shipping ?? false)

  // Log para verificar que el ID de la variante se está recibiendo correctamente
  console.log("Widget cargado para la variante ID:", data.id);
  console.log("Estado inicial de requires_shipping:", data.requires_shipping);

  const mutation = useMutation({
    mutationFn: async () => {
      const newValue = !checked // Calcula el nuevo valor antes de la mutación

      // Log para ver qué valor se va a enviar
      console.log(`Intentando actualizar variante ${data.id} con requires_shipping: ${newValue}`);

      const res = await fetch(
        // ¡CAMBIO AQUÍ! La ruta correcta para actualizar variantes en Medusa es /admin/variants/{id}
        `/admin/variants/${data.id}`, 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Importante para usar la sesión del admin
          body: JSON.stringify({
            requires_shipping: newValue,
          }),
        }
      )

      // Log para ver la respuesta cruda de la API
      console.log("Respuesta de la API:", res);

      if (!res.ok) {
        const error = await res.json()
        // Log detallado del error de la API
        console.error("Error en la respuesta de la API:", error);
        throw new Error(error.message || "Error al actualizar");
      }

      return newValue // Devuelve el nuevo valor para actualizar el estado local
    },
    onSuccess: (newValue) => {
      toast.success("¡Campo 'requires_shipping' actualizado correctamente!")
      setChecked(newValue) // Actualiza el estado local solo si la mutación fue exitosa
      console.log("Actualización exitosa. Nuevo estado:", newValue);
    },
    onError: (err: any) => {
      // Log detallado del error en caso de fallo de la mutación
      console.error("Error al actualizar el widget:", err);
      toast.error("Error al actualizar", {
        description: err.message || "No se pudo guardar el cambio.",
      })
    },
  })

  return (
    <Container className="p-4 bg-ui-bg-base rounded-lg shadow-sm">
      <Toaster /> {/* Componente para mostrar las notificaciones toast */}
      <Heading level="h2" className="text-base mb-4">
        ¿Requiere envío?
      </Heading>
      <Switch
        checked={checked} // Estado actual del switch
        onCheckedChange={() => mutation.mutate()} // Llama a la mutación al cambiar el switch
        disabled={mutation.isPending} // Deshabilita el switch mientras la petición está en curso
      />
      <Text className="mt-4 text-sm text-ui-fg-muted">
        Estado actual:{" "}
        <span className="font-semibold">
          {checked ? "Requiere envío" : "No requiere envío"}
        </span>
      </Text>
    </Container>
  )
}

// Configuración del widget para que aparezca después de los detalles de la variante de producto
export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
})

export default VariantRequiresShippingWidget
