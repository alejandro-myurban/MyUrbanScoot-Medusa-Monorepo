# Sistema de Compras a Proveedores e Integración con Inventario MedusaJS

## 🎯 Objetivo Principal
Desarrollar un sistema completo de compras a proveedores que se integre nativamente con el sistema de inventarios de MedusaJS, incluyendo gestión de traspasos entre almacenes y productos de taller no disponibles para venta online.

## 📋 Fases de Desarrollo

### FASE 0: Preparación del Entorno ✅
- [x] Crear tag de backup: `v-pre-supplier-system`
- [x] Crear rama principal: `feature/supplier-management-system`
- [x] Setup inicial de documentación

### FASE 1: Análisis y Arquitectura del Sistema MedusaJS
**Rama**: `feature/supplier-management-system/phase1-analysis`

#### Objetivos:
1. Estudiar módulos de inventario de MedusaJS (`@medusajs/inventory`, `@medusajs/stock-location`)
2. Evaluar sistema de traspasos entre almacenes
3. Definir arquitectura de integración
4. Documentar APIs existentes y capacidades

#### Deliverables:
- Documento de análisis técnico de MedusaJS
- Arquitectura del sistema de proveedores
- Plan de integración con inventario existente

### FASE 2: Diseño de Base de Datos y Entidades
**Rama**: `feature/supplier-management-system/phase2-database`

#### Entidades Principales:
- `Supplier` - Información de proveedores
- `SupplierOrder` - Pedidos a proveedores  
- `SupplierOrderDetail` - Detalles de pedidos
- `SupplierOrderStatus` - Estados del pedido
- `InventoryMovement` - Movimientos de inventario

#### Deliverables:
- Migraciones de base de datos
- Modelos de datos con TypeScript
- Relaciones con entidades existentes de MedusaJS

### FASE 3: Módulo de Gestión de Proveedores
**Rama**: `feature/supplier-management-system/phase3-suppliers`

#### Funcionalidades:
- CRUD completo de proveedores
- Validaciones fiscales (SIF, razón social)
- Integración con productos (proveedores preferentes, historial de precios)
- APIs RESTful siguiendo patrones MedusaJS

### FASE 4: Sistema de Pedidos a Proveedores
**Rama**: `feature/supplier-management-system/phase4-orders`

#### Workflow:
- Creación de pedidos con productos y cantidades
- Estados: pendiente → confirmado → recepcionado
- Estados especiales: incidencia, recepción parcial
- Cálculo de impuestos y descuentos

### FASE 5: Integración con Sistema de Inventario
**Rama**: `feature/supplier-management-system/phase5-inventory`

#### Integración:
- Actualización automática de stock al recepcionar
- Traspasos entre almacenes (stock locations)
- Productos de taller (flag para no mostrar online)
- Integración con `@medusajs/inventory`

### FASE 6: Interfaces de Administración
**Rama**: `feature/supplier-management-system/phase6-admin-ui`

#### Interfaces:
- Dashboard de compras y métricas
- Gestión completa de pedidos
- Interface de recepciones
- Gestión de traspasos entre almacenes

### FASE 7: Reportes y Analíticas
**Rama**: `feature/supplier-management-system/phase7-reports`

#### Reportes:
- Compras por período y proveedor
- Valoración de inventario
- Rotación de productos
- Exportaciones para contabilidad

## 🏗️ Arquitectura del Sistema

### Estructura de Requisitos (Del análisis inicial):

1. **Pedidos Proveedores**: ID del pedido, proveedor, impuestos, fecha, importe, descuento, notas
2. **Estado y Recepción**: Estados detallados, auditoría de quién y cuándo
3. **Detalles del Pedido**: Relación con productos, unidades, precio unitario
4. **Estados**: "pedido confirmado", "recepcionado", "incidencia", "recepción parcial"
5. **Proveedores**: Nombre, razón social, dirección fiscal, SIF, contacto

### Consideraciones Especiales:

- **Productos de Taller**: Flag para excluir de venta online
- **Múltiples Almacenes**: Aprovechar capacidades nativas de MedusaJS
- **Auditoría Completa**: Tracking de cambios y responsables
- **Integraciones Futuras**: Preparado para ERP externos

## 📅 Cronograma

- **Fase 1**: 1-2 semanas (Análisis)
- **Fase 2**: 1 semana (Diseño BD)
- **Fase 3**: 2 semanas (Proveedores)
- **Fase 4**: 3 semanas (Pedidos)
- **Fase 5**: 3 semanas (Inventario)
- **Fase 6**: 3 semanas (Admin UI)
- **Fase 7**: 2 semanas (Reportes)

**Total estimado: 15-16 semanas**

## 🛠️ Tecnologías

- **Backend**: MedusaJS + TypeScript
- **Base de Datos**: PostgreSQL
- **Frontend**: React + MedusaJS Admin
- **APIs**: RESTful siguiendo patrones MedusaJS
- **Testing**: Jest
- **Validaciones**: Joi/Zod

## 📝 Estado Actual

- ✅ **FASE 0 COMPLETADA**: Setup de ramas y documentación
- 🔄 **SIGUIENTE**: FASE 1 - Análisis de MedusaJS

---
*Última actualización: [FECHA]*
*Rama actual: feature/supplier-management-system*