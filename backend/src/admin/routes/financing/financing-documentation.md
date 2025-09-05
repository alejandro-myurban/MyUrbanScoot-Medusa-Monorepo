# 📋 Documentación del Módulo Financing

## 🎯 Descripción General

El módulo **Financing** es una funcionalidad administrativa que gestiona solicitudes de financiación de clientes. Permite revisar, procesar y administrar solicitudes que incluyen información personal, documentación, datos laborales y extracto automático de información mediante IA.

## 📁 Arquitectura y Estructura

El módulo está organizado siguiendo un patrón modular que separa responsabilidades:

### 📂 Estructura de Archivos

```
backend/src/admin/routes/financing/
├── page.tsx                       # 🏠 Punto de entrada principal
├── types.ts                       # 📝 Definiciones de tipos TypeScript
├── constants.ts                   # ⚙️ Constantes y configuraciones
├── components/                    # 🧩 Componentes UI modulares
│   ├── list/                      # 📋 Vista de lista de solicitudes
│   │   ├── FinancingListView.tsx  #   Contenedor principal de lista
│   │   ├── FinancingTable.tsx     #   Tabla de solicitudes
│   │   └── Pagination.tsx         #   Controles de paginación
│   ├── detail/                    # 🔍 Vista de detalle individual
│   │   └── FinancingDetailView.tsx#   Pantalla de detalle completo
│   └── filters/                   # 🎛️ Sistema de filtros
│       └── FinancingFilters.tsx   #   Barra de filtros y búsqueda
├── hooks/                         # 🎣 Lógica de negocio
│   ├── useFinancingData.ts        #   Gestión de datos y API calls
│   └── useFinancingFilters.ts     #   Filtrado y paginación
└── utils/                         # 🛠️ Utilidades helpers
    ├── formatters.ts              #   Formateo de datos (fechas, dinero)
    ├── documentHelpers.ts         #   Gestión de documentos
    ├── validationHelpers.ts       #   Validaciones de datos
    └── extractionHelpers.ts       #   Extracción de datos IA
```

## 🔄 Flujo de Funcionamiento

### 1. **Entrada del Usuario**
```
/admin/financing → page.tsx → FinancingListView
```

### 2. **Carga de Datos**
```
useFinancingData hook → API call → Datos de solicitudes
```

### 3. **Filtrado y Búsqueda**
```
FinancingFilters → useFinancingFilters → Datos filtrados → FinancingTable
```

### 4. **Vista de Detalle**
```
Click en solicitud → URL con ID → FinancingDetailView → Datos específicos
```

## 🧩 Componentes Principales

### 📋 **Lista de Solicitudes** (`list/`)
- **`FinancingListView`**: Orquestador principal que contiene filtros, tabla y paginación
- **`FinancingTable`**: Tabla responsive con scroll horizontal para mostrar todas las solicitudes
- **`Pagination`**: Controles de navegación entre páginas de resultados

### 🔍 **Vista de Detalle** (`detail/`)  
- **`FinancingDetailView`**: Pantalla completa con información detallada de una solicitud
  - Información personal extraída de DNI
  - Datos laborales y financieros  
  - Documentos subidos con enlaces de descarga
  - Notas administrativas editables
  - Control de estado y contacto

### 🎛️ **Sistema de Filtros** (`filters/`)
- **`FinancingFilters`**: Barra completa de filtros con:
  - Filtro por tipo de contrato
  - Filtro por estado (pendiente, aprobado, etc.)
  - Filtro por contactado/no contactado
  - Búsqueda por texto (email, teléfono, DNI)
  - Toggle para mostrar canceladas/entregadas

## 🎣 Hooks Personalizados

### **`useFinancingData`** - Gestión de Datos
```typescript
// Funcionalidades principales:
- Carga de todas las solicitudes (GET /admin/financing-data)
- Carga específica por ID (GET /admin/financing-data/:id)  
- Actualización de campos (PUT /admin/financing-data/:id)
- Actualización de estado y contactado
- Gestión de notas administrativas
- Estados de loading, error y success
```

### **`useFinancingFilters`** - Filtrado y Paginación  
```typescript
// Funcionalidades principales:
- Estado de filtros (tipo contrato, estado, contactado, búsqueda)
- Lógica de filtrado en tiempo real
- Paginación automática con recálculo
- Persistencia de filtros en URL
- Reset y limpieza de filtros
```

## 🛠️ Utilidades (helpers)

### **`documentHelpers.ts`** - Gestión de Documentos
```typescript
// Funciones disponibles:
- downloadAll(): Descarga masiva de todos los documentos
- hasDocuments(): Cuenta documentos disponibles  
- getDocumentsList(): Lista completa de documentos
- downloadSingle(): Descarga individual con nombres organizados
```

### **`extractionHelpers.ts`** - Datos Extraídos por IA
```typescript
// Funciones disponibles:
- extractDniInfo(): Información del DNI (nombre, número, fecha)
- extractPayrollInfo(): Datos de nómina (empresa, sueldo, puesto)
- extractAddressInfo(): Direcciones del DNI trasero
```

### **`formatters.ts`** - Formateo de Datos
```typescript
// Funciones disponibles:
- currency(): Formato de moneda (€1.234,56)
- date(): Formato de fecha localizada
- phone(): Formato de teléfono
- percentage(): Formato de porcentaje
```

## 🎯 Características Destacadas

### **🤖 Extracción Automática con IA**
- Procesamiento automático de documentos DNI y nóminas
- Extracción de información personal, laboral y financiera  
- Modo manual para casos donde la IA falla
- Validación y corrección de datos extraídos

### **📱 Diseño Responsive**  
- Tabla con scroll horizontal en pantallas pequeñas
- Filtros que se adaptan a dispositivos móviles
- Interfaz optimizada para tablet y desktop

### **🔍 Sistema de Búsqueda Avanzado**
- Búsqueda en tiempo real por múltiples campos
- Filtrado combinado (estado + tipo contrato + contactado)
- URL shareable con filtros persistentes
- Paginación inteligente que se recalcula automáticamente

### **📄 Gestión de Documentos**
- Descarga individual por documento  
- Descarga masiva con nombres organizados
- Previsualización de documentos
- Validación de tipos de archivo

### **⚡ Performance Optimizada**
- Carga lazy de datos
- React Query para cache inteligente
- Componentes memoizados para evitar re-renders
- Paginación server-side

## 🔧 APIs y Endpoints

```typescript
// Endpoints utilizados:
GET    /admin/financing-data          // Lista de solicitudes
GET    /admin/financing-data/:id      // Solicitud específica  
PUT    /admin/financing-data/:id      // Actualizar campos
PUT    /store/financing-data/:id/status     // Cambiar estado
PUT    /store/financing-data/:id/contacted  // Marcar contactado
PUT    /store/financing-data/:id/notes      // Guardar notas
```

## 🏗️ Patrones de Arquitectura

### **Separation of Concerns**
- UI components enfocados solo en renderizado
- Business logic centralizada en hooks
- Utilidades reutilizables en helpers

### **Container/Presentational Pattern**
- Containers manejan estado y lógica
- Components presentacionales reciben props
- Fácil testing y reutilización

### **Custom Hooks Pattern**  
- Lógica compleja encapsulada en hooks
- State compartido entre componentes
- Side effects centralizados

---

*Documentación actualizada para reflejar la arquitectura modular y funcionalidades del módulo Financing*