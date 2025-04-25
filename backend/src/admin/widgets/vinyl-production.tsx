// src/admin/widgets/vinyl-production.tsx
import React, { useState } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Button, StatusBadge, toast } from "@medusajs/ui";
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types";

const VinylProductionWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const [isLoading, setIsLoading] = useState(false);
  const currentStatus = data.metadata?.production_status;
  const isStarted = currentStatus === "produccion_vinilos";

  const handleStartProduction = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/admin/orders/${data.id}/production/vinyl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al iniciar producción");
      }

      toast.success("Producción de vinilos iniciada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="shadow-elevation-card-rest bg-ui-bg-base w-full rounded-lg p-4">
      {isStarted ? (
        <>
          <p className="inter-base-regular mb-4">
            Este producto ya está en <strong>Producción de Vinilos</strong>
          </p>
          <div className="flex items-center gap-2">
            <StatusBadge color="green">Producción de Vinilos</StatusBadge>
          </div>
        </>
      ) : (
        <div className="flex gap-4 flex-col">
          <p className="inter-base-regular">
            ¿Quieres iniciar la producción de vinilos para este pedido?
          </p>
          <div className="flex items-center gap-2">
            <StatusBadge color="orange">Producción de Vinilos</StatusBadge>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={handleStartProduction}
            isLoading={isLoading}
          >
            Iniciar producción de vinilos
          </Button>
        </div>
      )}
    </div>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.after",
});

export default VinylProductionWidget;
