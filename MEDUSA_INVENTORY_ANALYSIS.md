# Análisis del Sistema de Inventarios de MedusaJS

## 🔍 Hallazgos del Análisis Técnico

### Módulos Nativos Disponibles
MedusaJS 2.0 incluye los siguientes módulos relevantes para nuestro sistema:

```javascript
// Módulos clave identificados:
- INVENTORY        // ✅ Gestión de inventario nativo
- STOCK_LOCATION   // ✅ Múltiples almacenes
- FULFILLMENT      // ✅ Gestión de envíos
- PRODUCT          // ✅ Gestión de productos
- ORDER            // ✅ Pedidos (para referencia)
```

### Workflows Existentes para Inventario
Del análisis del archivo `seed.ts`, se identificaron estos workflows nativos:

```javascript
// Workflows disponibles:
- createStockLocationsWorkflow      // Crear almacenes/ubicaciones
- createInventoryLevelsWorkflow     // Niveles de inventario
- linkSalesChannelsToStockLocationWorkflow // Vincular canales con almacenes
- createShippingOptionsWorkflow     // Opciones de envío
- createFulfillmentSets            // Sets de fulfillment
```

### Estructura Actual de Stock Locations
```javascript
// Configuración actual en seed.ts:
{
  locations: [
    {
      name: "European Warehouse",
      address: {
        address_1: "Warehouse Street 1",
        city: "Copenhagen", 
        country_code: "dk",
        postal_code: "2100"
      }
    }
  ]
}
```

### Integración con Fulfillment
El sistema actual ya vincula:
- **Stock Locations** ↔ **Fulfillment Providers**
- **Stock Locations** ↔ **Sales Channels** 
- **Inventory Levels** por ubicación con cantidades

## 🏗️ Arquitectura Propuesta para Sistema de Proveedores

### 1. Aprovechamiento de Módulos Existentes

#### ✅ Módulos que podemos usar directamente:
- **`INVENTORY`**: Para actualizaciones de stock
- **`STOCK_LOCATION`**: Para múltiples almacenes
- **`PRODUCT`**: Para vincular con proveedores

#### 🔨 Módulos que necesitamos crear:
- **`SUPPLIER`**: Gestión de proveedores
- **`SUPPLIER_ORDER`**: Pedidos a proveedores
- **`PURCHASE_WORKFLOW`**: Workflows de compra

### 2. Flujo de Datos Propuesto

```
[Supplier Order] → [Reception] → [Inventory Update] → [Stock Location]
      ↓                ↓              ↓                     ↓
   Tracking         Validation    Native Module        Multi-warehouse
```

### 3. Estructura de Entidades

```typescript
// Supplier (Proveedor)
interface Supplier {
  id: string;
  name: string;
  legal_name: string;        // Razón social
  tax_id: string;           // SIF
  address: Address;
  contact_info: ContactInfo;
  default_payment_terms?: string;
  created_at: Date;
  updated_at: Date;
}

// Supplier Order (Pedido Proveedor) 
interface SupplierOrder {
  id: string;
  supplier_id: string;
  order_number: string;
  status: SupplierOrderStatus;
  order_date: Date;
  expected_delivery?: Date;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  notes?: string;
  created_by: string;        // Usuario que creó
  received_by?: string;      // Usuario que recepcionó
  received_at?: Date;
  details: SupplierOrderDetail[];
}

// Supplier Order Detail (Detalle del Pedido)
interface SupplierOrderDetail {
  id: string;
  supplier_order_id: string;
  product_id: string;        // Vinculación con Product de MedusaJS
  variant_id?: string;       // Variante específica si aplica
  quantity_ordered: number;
  quantity_received?: number;
  unit_cost: number;
  line_total: number;
  supplier_sku?: string;     // Código del proveedor
}

// Estados del pedido
enum SupplierOrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed", 
  PARTIALLY_RECEIVED = "partially_received",
  RECEIVED = "received",
  INCIDENT = "incident",
  CANCELLED = "cancelled"
}
```

### 4. Integración con Inventario Existente

#### Flujo de Recepción:
1. **Crear Supplier Order** → Estado "pending"
2. **Confirmar con proveedor** → Estado "confirmed" 
3. **Recepcionar productos** → Estado "received"
4. **Trigger automático** → Actualizar `INVENTORY` module
5. **Update Stock Location** → Usar workflows nativos

#### Código de integración propuesto:
```typescript
// Workflow de recepción que integra con inventario nativo
async function processSupplierOrderReception(orderId: string) {
  const order = await supplierOrderService.retrieve(orderId);
  
  // Para cada producto recibido
  for (const detail of order.details) {
    if (detail.quantity_received > 0) {
      // Usar módulo nativo de INVENTORY
      await inventoryModuleService.adjustInventory({
        inventory_item_id: detail.product_id,
        location_id: order.destination_location_id,
        adjustment: detail.quantity_received
      });
    }
  }
  
  // Actualizar estado del pedido
  await supplierOrderService.update(orderId, {
    status: SupplierOrderStatus.RECEIVED,
    received_at: new Date()
  });
}
```

### 5. Productos No Visibles Online (Consumibles Taller)

#### Estrategia propuesta:
```typescript
// Extender metadata de productos existentes
interface ProductMetadata {
  is_workshop_consumable?: boolean;  // Flag para productos de taller
  workshop_category?: string;        // Categoría específica
  exclude_from_storefront?: boolean; // Excluir de tienda online
}

// En el storefront, filtrar automáticamente
const products = await productModuleService.list({
  metadata: {
    exclude_from_storefront: { $ne: true }
  }
});
```

### 6. Traspasos Entre Almacenes

MedusaJS ya soporta múltiples Stock Locations, podemos crear workflows para:

```typescript
// Workflow de traspaso
async function transferBetweenLocations({
  product_id,
  from_location_id, 
  to_location_id,
  quantity
}) {
  // Reducir stock en origen
  await inventoryModuleService.adjustInventory({
    inventory_item_id: product_id,
    location_id: from_location_id,
    adjustment: -quantity
  });
  
  // Aumentar stock en destino
  await inventoryModuleService.adjustInventory({
    inventory_item_id: product_id,
    location_id: to_location_id,
    adjustment: quantity
  });
  
  // Registrar movimiento para auditoría
  await createInventoryMovement({
    type: 'transfer',
    from_location_id,
    to_location_id,
    product_id,
    quantity
  });
}
```

## 🎯 Conclusiones del Análisis

### ✅ Ventajas de la Arquitectura MedusaJS:
1. **Módulos nativos robustos** para inventario y stock locations
2. **Workflows existentes** para gestión de inventario
3. **Múltiples almacenes** ya soportados
4. **Extensibilidad** mediante módulos custom

### 🔨 Desarrollo Necesario:
1. **Módulo Supplier**: CRUD de proveedores
2. **Módulo SupplierOrder**: Gestión de pedidos
3. **Workflows de Compra**: Integración con inventario
4. **Admin UI**: Interfaces para gestión
5. **Reportes**: Analytics y exportaciones

### 🚀 Siguiente Paso:
**FASE 2**: Diseñar e implementar la estructura de base de datos para los módulos de proveedores, aprovechando al máximo la arquitectura existente de MedusaJS.

---
*Análisis completado: [FECHA]*
*Versión MedusaJS: 2.0*