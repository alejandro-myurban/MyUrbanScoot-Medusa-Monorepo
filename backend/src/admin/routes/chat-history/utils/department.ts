import { ChatMessage, Department } from "../types/chat";

export const departmentKeywords: Record<Department, string[]> = {
  "Consultas generales sobre productos": ["producto", "caracteristicas", "especificaciones", "modelo", "talla", "color"],
  "Consultas pedidos web": ["pedido", "orden", "compra", "rastreo", "envío", "web", "online"],
  "Financiacion": ["financiamiento", "pagos", "cuotas", "crédito", "tarjeta", "intereses", "financiación"],
  "Modificacion / recogida + entrega": ["modificar", "cambiar", "recojo", "recogida", "entrega", "dirección", "cita", "citar"],
  "Otros": [],
};

export const departmentColors: Record<Department, "grey" | "blue" | "green" | "orange" | "purple" | "red"> = {
  "Consultas generales sobre productos": "blue",
  "Consultas pedidos web": "green",
  "Financiacion": "purple",
  "Modificacion / recogida + entrega": "orange",
  "Otros": "grey",
};

export const getDepartment = (messages: ChatMessage[]): Department => {
  for (const message of messages) {
    const text = message.message.toLowerCase();
    for (const department in departmentKeywords) {
      if (department === "Otros") continue;
      for (const keyword of departmentKeywords[department as Department]) {
        if (text.includes(keyword)) {
          return department as Department;
        }
      }
    }
  }
  return "Otros";
};
