# FASE 2: Diseño de Base de Datos y Entidades - COMPLETADO

## 🎯 **Objetivo Alcanzado**
Diseño completo de la estructura de base de datos para el sistema de gestión de proveedores, siguiendo los patrones nativos de MedusaJS y aprovechando al máximo la arquitectura existente.

## 📊 **Entidades Creadas**

### 1. **Supplier** (Proveedor)
```typescript
// Archivo: src/modules/supplier-management/models/supplier.ts
```

**Campos principales:**
- `name`: Nombre comercial
- `legal_name`: Razón social  
- `tax_id`: NIF/CIF/SIF (único)
- `email`, `phone`, `website`: Información de contacto
- `address_*`: Dirección completa
- `payment_terms`: Condiciones de pago
- `currency_code`: Moneda por defecto (EUR)
- `discount_percentage`: Descuento general
- `is_active`: Estado del proveedor
- `metadata`: Extensibilidad JSON

**Relaciones:**
- `hasMany` → SupplierOrder (pedidos del proveedor)

### 2. **SupplierOrder** (Pedido a Proveedor) 
```typescript
// Archivo: src/modules/supplier-management/models/supplier-order.ts
```

**Campos principales:**
- `display_id`: Número de pedido visible (PO-001)
- `supplier`: Relación con proveedor
- `status`: Estados del workflow (draft → pending → confirmed → received)
- Fechas: `order_date`, `expected_delivery_date`, `confirmed_at`, `shipped_at`, `received_at`
- Montos: `subtotal`, `tax_total`, `discount_total`, `total`
- `destination_location_id`: Almacén de destino (integración con MedusaJS)
- `reference`: Referencia del proveedor
- Auditoría: `created_by`, `received_by`

**Estados del workflow:**
```
draft → pending → confirmed → shipped → partially_received/received
                    ↓
                 incident/cancelled
```

**Relaciones:**
- `belongsTo` → Supplier
- `hasMany` → SupplierOrderLine

### 3. **SupplierOrderLine** (Línea de Pedido)
```typescript
// Archivo: src/modules/supplier-management/models/supplier-order-line.ts
```

**Campos principales:**
- `supplier_order`: Relación con pedido
- `product_id`, `product_variant_id`: Vinculación con productos MedusaJS
- `product_title`: Snapshot del producto
- `supplier_sku`: Código del proveedor
- Cantidades: `quantity_ordered`, `quantity_received`, `quantity_pending`
- `unit_price`, `total_price`: Precios
- `line_status`: Estado específico de la línea
- `received_by`, `reception_notes`: Auditoría de recepción

**Relaciones:**
- `belongsTo` → SupplierOrder

### 4. **InventoryMovement** (Movimiento de Inventario)
```typescript
// Archivo: src/modules/supplier-management/models/inventory-movement.ts
```

**Campos principales:**
- `movement_type`: Tipo de movimiento (supplier_receipt, transfer_out/in, adjustment, etc.)
- `reference_id`, `reference_type`: Referencia al origen del movimiento
- `product_id`, `product_variant_id`: Producto afectado
- `from_location_id`, `to_location_id`: Ubicaciones origen/destino
- `quantity`: Cantidad del movimiento (+ o -)
- `unit_cost`, `total_cost`: Costos
- `performed_by`, `performed_at`: Auditoría

**Tipos de movimientos:**
- `supplier_receipt`: Recepción de proveedor
- `transfer_out/in`: Traspasos entre almacenes
- `adjustment`: Ajuste manual
- `sale`, `return`: Venta/devolución
- `damage`, `theft`, `expired`: Pérdidas

### 5. **ProductSupplier** (Relación Producto-Proveedor)
```typescript
// Archivo: src/modules/supplier-management/models/product-supplier.ts
```

**Campos principales:**
- `product_id`, `product_variant_id`: Vinculación con MedusaJS
- `supplier`: Relación con proveedor
- `supplier_sku`: Código del proveedor
- `cost_price`: Precio de costo actual
- `price_history`: Historial de precios (JSON)
- `minimum_order_quantity`: Cantidad mínima
- `lead_time_days`: Tiempo de entrega
- `is_preferred_supplier`: Proveedor preferente
- **Productos de taller:**
  - `is_workshop_consumable`: Flag para consumibles
  - `exclude_from_storefront`: Excluir de tienda online

## 🛠️ **Servicio del Módulo**

### Archivo: `src/modules/supplier-management/service.ts`

**Métodos principales implementados:**

#### Gestión de Proveedores:
- `createSupplier()`: Crear proveedor
- `getSupplierById()`: Obtener por ID
- `updateSupplier()`: Actualizar datos
- `deactivateSupplier()`: Desactivar

#### Gestión de Pedidos:
- `createSupplierOrder()`: Crear pedido (con display_id automático)
- `getSupplierOrderById()`: Obtener con relaciones
- `updateSupplierOrderStatus()`: Cambiar estado con timestamps

#### Gestión de Líneas de Pedido:
- `addOrderLine()`: Agregar línea y recalcular totales
- `receiveOrderLine()`: Recepcionar con integración a inventario
- Registro automático de `InventoryMovement`

#### Gestión de Relaciones Producto-Proveedor:
- `linkProductToSupplier()`: Vincular producto con proveedor
- `updateProductSupplierCost()`: Actualizar precios con historial

#### Métodos Auxiliares:
- `generateOrderDisplayId()`: PO-000001, PO-000002, etc.
- `recalculateOrderTotals()`: Recalculo automático de totales

## 🔗 **Integración con MedusaJS**

### 1. **Productos y Variantes**
- Vinculación directa con `product_id` y `product_variant_id`
- Snapshots de información para auditoría
- Metadatos JSON para extensibilidad

### 2. **Stock Locations** 
- Campo `destination_location_id` vincula con sistema nativo
- Preparado para traspasos entre almacenes
- Integración con módulo `INVENTORY` de MedusaJS

### 3. **Productos No Visibles Online**
- Flags `is_workshop_consumable` y `exclude_from_storefront`
- Filtros automáticos en el storefront
- Categorías específicas de taller

### 4. **Patrones de MedusaJS**
- ✅ Uso de `model.define()` con tipado correcto
- ✅ Relaciones `belongsTo` y `hasMany` 
- ✅ Campos automáticos: `created_at`, `updated_at`, `deleted_at`
- ✅ Índices únicos y de rendimiento
- ✅ Enums para estados controlados
- ✅ JSON para extensibilidad (`metadata`)

## 📁 **Estructura de Archivos**

```
backend/src/modules/supplier-management/
├── index.ts                    # Configuración del módulo
├── service.ts                  # Lógica de negocio
└── models/
    ├── supplier.ts             # Modelo de proveedor
    ├── supplier-order.ts       # Modelo de pedido
    ├── supplier-order-line.ts  # Modelo de línea de pedido
    ├── inventory-movement.ts   # Modelo de movimiento
    └── product-supplier.ts     # Relación producto-proveedor
```

## ⚙️ **Configuración**

### Registrado en `medusa-config.js`:
```javascript
{
  resolve: "./src/modules/supplier-management",
}
```

### Constante del módulo:
```javascript
export const SUPPLIER_MODULE = "supplier_management";
```

## 🚀 **Flujo de Datos Diseñado**

### Workflow Completo:
```
1. Crear Supplier
2. Vincular ProductSupplier (precios, SKUs)
3. Crear SupplierOrder (estado: draft)
4. Agregar SupplierOrderLines
5. Cambiar estado: pending → confirmed → shipped
6. Recepcionar líneas (quantity_received)
7. AUTO: Crear InventoryMovement
8. AUTO: Actualizar stock en MedusaJS INVENTORY
9. Estado final: received/partially_received
```

### Integración con Inventario:
```
SupplierOrder.receive() → InventoryMovement.create() → MedusaJS.INVENTORY.adjust()
```

## ✅ **Ventajas del Diseño**

1. **Aprovecha MedusaJS nativo**: Máxima compatibilidad
2. **Extensible**: Metadatos JSON en todas las entidades  
3. **Auditable**: Tracking completo de cambios y responsables
4. **Flexible**: Estados configurables y workflow adaptable
5. **Integrado**: Vinculación directa con productos y almacenes existentes
6. **Escalable**: Preparado para múltiples proveedores y almacenes

## 🎯 **Próximos Pasos**

**FASE 3**: Implementación de APIs REST para el sistema de proveedores
- Endpoints CRUD para todas las entidades
- Integración con admin dashboard
- Validaciones de negocio
- Tests unitarios

---

*FASE 2 completada exitosamente*  
*Fundación sólida para el desarrollo del sistema completo*