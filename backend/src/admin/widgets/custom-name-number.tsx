import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Button,
  Input,
  toast,
  Toaster,
  Checkbox,
} from "@medusajs/ui";
import { useState } from "react";
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types";
import { sdk } from "../lib/sdk";

const CustomNameNumberWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [customNameEnabled, setCustomNameEnabled] = useState(
    data.metadata?.custom_name === "true"
  );
  const [customNumberEnabled, setCustomNumberEnabled] = useState(
    data.metadata?.custom_number === "true"
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    console.log("Saving custom name and number", {
      customNameEnabled,
      customNumberEnabled,
    });
    try {
      await sdk.admin.product.update(data.id, {
        metadata: {
          ...data.metadata,
          custom_name: customNameEnabled.toString(),
          custom_number: customNumberEnabled.toString(),
        },
      });
      toast.success("Configuración guardada correctamente");
    } catch (e) {
      toast.error("Error al guardar las configuraciones personalizadas");
    } finally {
      setLoading(false);
    }
  };

  console.log(data);
  return (
    <>
      {data.type?.value === "Vinilos" && (
        <Container>
          <Toaster />
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={customNameEnabled}
                onCheckedChange={(checked) => setCustomNameEnabled(!!checked)}
              />
              <span>
                Marca la casilla para activar el nombre personalizado.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={customNumberEnabled}
                onCheckedChange={(checked) => setCustomNumberEnabled(!!checked)}
              />
              <span>
                Marca la casilla para activar el número personalizado.
              </span>
            </div>
            <Button onClick={handleSave} variant="primary" disabled={loading}>
              Guardar
            </Button>
          </div>
        </Container>
      )}
    </>
  );
};

export default CustomNameNumberWidget;

export const config = defineWidgetConfig({
  zone: "product.details.after",
});
