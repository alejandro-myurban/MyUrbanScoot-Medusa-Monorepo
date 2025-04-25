import React, { useState } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Button, toast, Container, StatusBadge } from "@medusajs/ui";
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types";

const WorkshopStatusWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [metadata, setMetadata] = useState(data.metadata || {});

  console.log("Metadata inicial:", data);

  const hasWorkshopStatus = metadata.workshop_status === "en_taller";

  const workshopStatusDate = data.metadata?.workshop_status_updated_at
    ? new Date(
        data.metadata.workshop_status_updated_at as string
      ).toLocaleString()
    : null;

  console.log(hasWorkshopStatus);

  const handleSetWorkshopStatus = async () => {
    setIsUpdating(true);
    try {
      // Enviar solicitud a nuestra API personalizada
      const response = await fetch(`/admin/orders/${data.id}/workshop-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      if (!response.ok) {
        throw new Error("Error al actualizar el estado");
      }
      // window.location.reload();

      setMetadata({
        ...metadata,
        workshop_status: "en_taller",
        workshop_status_display: "En Taller",
        workshop_status_updated_at: new Date().toISOString(),
      });

      toast.success("Orden marcada como 'En Taller'");
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveWorkshopStatus = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/admin/orders/${data.id}/workshop-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      if (!response.ok) {
        throw new Error("Error al eliminar el estado");
      }

      toast.success("Orden marcada como 'No en Taller'");

      // Actualizamos la metadata local
      setMetadata((prev) => {
        const updated = { ...prev };
        delete updated.workshop_status;
        delete updated.workshop_status_display;
        delete updated.workshop_status_updated_at;
        return updated;
      });
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="shadow-elevation-card-rest bg-ui-bg-base w-full rounded-lg divide-y divide-dashed p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="inter-base-semibold">Estado de taller</h2>
          {hasWorkshopStatus ? (
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge color="green">En Taller</StatusBadge>
              {workshopStatusDate && (
                <span className="text-ui-fg-subtle text-sm">
                  Desde: {workshopStatusDate}
                </span>
              )}
            </div>
          ) : (
            <span className="text-ui-fg-subtle text-sm">No está en taller</span>
          )}
        </div>
        <div className="flex gap-4">
          <Button
            variant={hasWorkshopStatus ? "secondary" : "primary"}
            size="small"
            onClick={handleSetWorkshopStatus}
            disabled={isUpdating}
          >
            {hasWorkshopStatus
              ? "Actualizar estado"
              : 'Marcar como "En Taller"'}
          </Button>
          {hasWorkshopStatus && (
            <Button
              variant={hasWorkshopStatus ? "secondary" : "primary"}
              size="small"
              onClick={handleRemoveWorkshopStatus}
              disabled={isUpdating}
            >
              {hasWorkshopStatus ? "Eliminar estado" : ""}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Configuración del widget
export const config = defineWidgetConfig({
  zone: "order.details.after",
});

export default WorkshopStatusWidget;
