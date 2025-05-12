import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Button, Input, toast, Toaster } from "@medusajs/ui";
import { useState } from "react";
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types";
import { sdk } from "../lib/sdk"; // Asegúrate de tener el JS SDK configurado

const EstimatedProductionTimeWidget = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  const [value, setValue] = useState<string>(
    data.metadata?.estimated_production_time?.toString() || ""
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await sdk.admin.product.update(data.id, {
        metadata: {
          ...data.metadata,
          estimated_production_time: value,
        },
      });
      toast.success("Tiempo estimado de producción guardado");
    } catch (e) {
      toast.error("Error al guardar el tiempo estimado de producción");
    }
    setLoading(false);
  };

  return (
    <Container>
      <div className="flex flex-col gap-2">
        <label htmlFor="numero-personalizado">
          Introduce un tiempo estimado de producción en días.
        </label>
        <Input
          id="numero-personalizado"
          type="number"
          placeholder="Ej: 5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button onClick={handleSave} disabled={loading}>
          Guardar
        </Button>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default EstimatedProductionTimeWidget;
