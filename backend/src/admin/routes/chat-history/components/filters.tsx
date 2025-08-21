import { Input } from "@medusajs/ui";
import { CalendarDays, Search } from "lucide-react";
import { Department } from "../types/chat";

type Props = {
  searchUserId: string;
  setSearchUserId: (val: string) => void;
  searchDate: string;
  setSearchDate: (val: string) => void;
  searchKeyword: string;
  setSearchKeyword: (val: string) => void;
  filterDepartment: "TODOS" | Department;
  setFilterDepartment: (val: "TODOS" | Department) => void;
  filterStatus: "TODOS" | "IA" | "AGENTE";
  setFilterStatus: (val: "TODOS" | "IA" | "AGENTE") => void;
};

const Filters = ({
  searchUserId,
  setSearchUserId,
  searchDate,
  setSearchDate,
  searchKeyword,
  setSearchKeyword,
  filterDepartment,
  setFilterDepartment,
  filterStatus,
  setFilterStatus,
}: Props) => {
  return (
    <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:flex-wrap">
      {/* Grupo de filtros de búsqueda (text-based) */}
      <div className="flex flex-col gap-4 w-full sm:flex-row sm:flex-1">
        {/* ID usuario */}
        <div className="relative flex-1 w-full">
          <Input
            type="text"
            placeholder="Filtrar por número de usuario..."
            value={searchUserId}
            onChange={(e) => setSearchUserId(e.target.value)}
            className="pl-8 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-400" />
        </div>

        {/* Fecha */}
        <div className="relative flex-1 w-full">
          <Input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="pl-8 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
          <CalendarDays className="w-4 h-4 absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-400" />
        </div>

        {/* Palabra clave */}
        <div className="relative flex-1 w-full">
          <Input
            type="text"
            placeholder="Filtrar por palabra clave..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-8 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Grupo de selectores */}
      <div className="flex flex-col gap-4 w-full sm:flex-row sm:flex-1">
        {/* Departamento */}
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value as "TODOS" | Department)}
          className="flex-1 w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        >
          <option value="TODOS">Todos los departamentos</option>
          <option value="Consultas generales sobre productos">Consultas generales sobre productos</option>
          <option value="Consultas pedidos web">Consultas pedidos web</option>
          <option value="Financiacion">Financiación</option>
          <option value="Modificacion / recogida + entrega">Modificación / recogida + entrega</option>
          <option value="Otros">Otros</option>
        </select>

        {/* Estado */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "TODOS" | "IA" | "AGENTE")}
          className="flex-1 w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        >
          <option value="TODOS">Todos los estados</option>
          <option value="AGENTE">Chats en AGENTE</option>
          <option value="IA">Chats en IA</option>
        </select>
      </div>
    </div>
  );
};

export default Filters;