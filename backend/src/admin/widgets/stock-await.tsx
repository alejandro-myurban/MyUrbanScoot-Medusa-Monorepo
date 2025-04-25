import React, { useState } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Button, toast, StatusBadge, Heading, Select } from "@medusajs/ui";
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types";

const StockAwaitWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  // 1) Early return si no está en "espera de stock"
  //   if (data.metadata?.production_status !== "espera_stock") {
  //     return null;
  //   }

//   const [isUpdating, setIsUpdating] = useState(false);
//   const [metadata, setMetadata] = useState(data.metadata);
//   const hasSent = Boolean(metadata.stock_await_updated_at) || null;

//   const initialMonth = (data.metadata?.stock_await_month as string) ?? "1";
//   const initialDay = (data.metadata?.stock_await_day as string) ?? "1";

//   const [month, setMonth] = useState<string>(initialMonth);
//   const [day, setDay] = useState<string>(initialDay);
//   const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
//   const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

//   // aquí `hasStockAwait` ya será siempre true, porque solo se renderiza si production_status es "espera_stock"
//   const stockAwaitDate = metadata.stock_await_updated_at
//     ? new Date(metadata.stock_await_updated_at as string).toLocaleString()
//     : null;

//   const handleSetStockAwait = async () => {
//     setIsUpdating(true);
//     try {
//       const res = await fetch(`/admin/orders/${data.id}/stock-await`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ month, day }),
//       });
//       if (!res.ok) {
//         const err = await res.json();
//         throw new Error(err.message || "Error al guardar fecha");
//       }
//       const { metadata: updated } = await res.json();
//       setMetadata(updated);

//       toast.success("Fecha de espera guardada correctamente");
//     } catch (e) {
//       toast.error((e as Error).message);
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleRemoveStockAwait = async () => {
//     setIsUpdating(true);
//     try {
//       const res = await fetch(`/admin/orders/${data.id}/stock-await`, {
//         method: "DELETE",
//       });
//       if (!res.ok) throw new Error("Error eliminando fecha");

//       setMetadata((prev) => {
//         const m = { ...prev };
//         delete m.stock_await_month;
//         delete m.stock_await_day;
//         delete m.stock_await_display;
//         delete m.stock_await_updated_at;
//         return m;
//       });

//       toast.success("Leyenda de espera eliminada");
//     } catch (e) {
//       toast.error((e as Error).message);
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   return (
//     <div className="shadow-elevation-card-rest bg-ui-bg-base w-full rounded-lg divide-y divide-dashed">
//       <div className="flex items-center justify-between px-6 py-4">
//         <div>
//           <h2 className="inter-base-semibold">
//             Enviar al cliente email con fecha de stock disponible.
//           </h2>
//           <div className="flex items-center gap-2 mt-1">
//             <StatusBadge color="orange">En Espera de Stock</StatusBadge>
//             {stockAwaitDate && (
//               <span className="text-ui-fg-subtle text-sm">
//                 {stockAwaitDate}
//               </span>
//             )}
//           </div>
//         </div>
//         <div className="flex gap-4">
//           <Button
//             variant="primary"
//             size="small"
//             onClick={handleSetStockAwait}
//             disabled={hasSent || isUpdating}
//           >
//             Enviar email de fecha
//           </Button>
//           {/* <Button
//             variant="danger"
//             size="small"
//             onClick={handleRemoveStockAwait}
//             disabled={isUpdating}
//           >
//             Eliminar
//           </Button> */}
//         </div>
//       </div>
//       <div className="px-6 py-4 flex gap-4">
//         <div className="w-1/6">
//           <label className="text-ui-fg-subtle mb-1 block text-sm">Día</label>
//           <Select value={day} onValueChange={setDay}>
//             <Select.Trigger>
//               <Select.Value placeholder="Día" />
//             </Select.Trigger>
//             <Select.Content>
//               {days.map((d) => (
//                 <Select.Item key={d} value={d}>
//                   {d}
//                 </Select.Item>
//               ))}
//             </Select.Content>
//           </Select>
//         </div>
//         <div className="w-1/6">
//           <label className="text-ui-fg-subtle mb-1 block text-sm">Mes</label>
//           <Select value={month} onValueChange={setMonth}>
//             <Select.Trigger>
//               <Select.Value placeholder="Mes" />
//             </Select.Trigger>
//             <Select.Content>
//               {months.map((m) => (
//                 <Select.Item key={m} value={m}>
//                   {m}
//                 </Select.Item>
//               ))}
//             </Select.Content>
//           </Select>
//         </div>
//       </div>
//     </div>
//   );
};

export const config = defineWidgetConfig({
  zone: "order.details.after",
});

export default StockAwaitWidget;
