import React, { useState, useEffect } from "react";
import { Container, Heading, Button, Text } from "@medusajs/ui";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Plus,
  Package,
} from "lucide-react";
import { sdk } from "../../../lib/sdk";
import OrderLineItem from "./OrderLineItem";

// Types
type Supplier = {
  id: string;
  name: string;
  legal_name: string;
  tax_id: string;
  email: string;
  phone: string;
  is_active: boolean;
};

type StockLocation = {
  id: string;
  name: string;
};

type SupplierOrderLine = {
  id: string;
  product_id: string;
  product_variant_id?: string;
  product_title: string;
  product_thumbnail?: string;
  supplier_sku?: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_pending: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  total_price: number;
  line_status: string;
  received_at?: string;
};

// Props interface
interface CreateOrderFormProps {
  suppliers: Supplier[];
  stockLocations: StockLocation[];
  editingOrder?: any; // Optional order to edit
  onCancel: () => void;
  onSuccess: () => void;
}

export const CreateOrderForm: React.FC<CreateOrderFormProps> = ({
  suppliers,
  stockLocations,
  editingOrder,
  onCancel,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  // Form state
  const [orderFormData, setOrderFormData] = useState({
    supplier_id: "",
    expected_delivery_date: "",
    destination_location_id: "",
    reference: "",
    notes: "",
    created_by: "",
  });

  const [orderLines, setOrderLines] = useState<Partial<SupplierOrderLine>[]>([]);
  const [globalTaxRate, setGlobalTaxRate] = useState(21);

  // Product search state
  const [productSearchTerms, setProductSearchTerms] = useState<{[key: number]: string}>({});
  const [showProductDropdowns, setShowProductDropdowns] = useState<{[key: number]: boolean}>({});
  const [autocompletedPrices, setAutocompletedPrices] = useState<{[key: number]: { display_id: string, date: string }}>({});
  const [priceComparisons, setPriceComparisons] = useState<{[key: string]: any}>({});

  // Fetch products
  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await sdk.admin.product.list({ 
        limit: 1000,
        fields: "id,title,thumbnail,status"
      });
      console.log("Products response:", response);
      return response;
    },
  });

  // Extract products array from response
  let products = [];
  if (productsResponse) {
    if (Array.isArray(productsResponse.products)) {
      products = productsResponse.products;
    } else if (Array.isArray(productsResponse)) {
      products = productsResponse;
    }
  }
  
  console.log("🔍 Products response structure:", productsResponse);
  console.log("🚀 Final products array:", Array.isArray(products), products.length, typeof products);

  // Fetch product prices for selected supplier
  const { data: productPrices = {} } = useQuery({
    queryKey: ["product-prices", orderFormData.supplier_id],
    queryFn: async () => {
      if (!orderFormData.supplier_id) return {};
      const response = await fetch(`/admin/suppliers/${orderFormData.supplier_id}/products/prices`);
      if (!response.ok) return {};
      const data = await response.json();
      return data.success ? data.data : {};
    },
    enabled: !!orderFormData.supplier_id,
  });

  // Get current user effect
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await sdk.client.fetch("/admin/users/me", {
          method: "GET",
        });
        console.log("User response:", response);

        // Type guard to ensure response has 'user'
        if (response && typeof response === "object" && "user" in response) {
          const user = (response as { user: { first_name?: string; last_name?: string; email: string } }).user;
          const userName = user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user.email;
          setOrderFormData(prev => ({ ...prev, created_by: userName }));
        }
      } catch (error) {
        console.error("Error getting current user:", error);
      }
    };
    getCurrentUser();
  }, []);

  // Pre-load data when editing
  useEffect(() => {
    if (editingOrder) {
      console.log("📝 Pre-loading order data for editing:", editingOrder);
      console.log("📅 Expected delivery date:", editingOrder.expected_delivery_date);
      console.log("📦 Order lines:", editingOrder.lines);
      
      // Format delivery date if it exists (handle both ISO and date formats)
      let deliveryDate = "";
      if (editingOrder.expected_delivery_date) {
        const date = new Date(editingOrder.expected_delivery_date);
        if (!isNaN(date.getTime())) {
          deliveryDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD for input
        }
      }
      
      setOrderFormData({
        supplier_id: editingOrder.supplier_id || "",
        expected_delivery_date: deliveryDate,
        destination_location_id: editingOrder.destination_location_id || "",
        reference: editingOrder.reference || "",
        notes: editingOrder.notes || "",
        created_by: editingOrder.created_by || "",
      });
      
      console.log("📋 Setting order form data:", {
        supplier_id: editingOrder.supplier_id,
        expected_delivery_date: deliveryDate,
        destination_location_id: editingOrder.destination_location_id,
        reference: editingOrder.reference,
        notes: editingOrder.notes,
        created_by: editingOrder.created_by,
      });

      // Pre-load order lines if available
      if (editingOrder.lines && editingOrder.lines.length > 0) {
        console.log("🔄 Loading", editingOrder.lines.length, "order lines");
        const loadedLines = editingOrder.lines.map((line, index) => {
          console.log(`📦 Loading line ${index}:`, line);
          
          // Ensure unit_price is a proper number
          const unitPrice = typeof line.unit_price === 'number' ? line.unit_price : parseFloat(line.unit_price) || 0;
          
          return {
            product_id: line.product_id || "",
            product_title: line.product_title || "",
            product_thumbnail: line.product_thumbnail || "",
            supplier_sku: line.supplier_sku || "",
            quantity_ordered: line.quantity_ordered || 1,
            unit_price: unitPrice,
            tax_rate: line.tax_rate || 0, // Use 0 as default since BD shows 0
            discount_rate: line.discount_rate || 0,
          };
        });
        setOrderLines(loadedLines);
        console.log("✅ Order lines loaded:", loadedLines);
      } else {
        console.log("❌ No order lines found in editingOrder.lines");
      }
    }
  }, [editingOrder]);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/admin/suppliers/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          order_lines: orderLines
            .filter(line => line.product_id && line.quantity_ordered && line.unit_price)
            .map(line => ({
              ...line,
              total_price: calculateLineTotal(line),
              quantity_received: 0,
              quantity_pending: line.quantity_ordered || 1,
              line_status: "pending",
              tax_rate: line.tax_rate || 0,
              discount_rate: line.discount_rate || 0
            }))
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error creating order");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
      onSuccess();
      resetOrderForm();
    },
    onError: (error: any) => {
      alert("Error al crear pedido: " + error.message);
    }
  });

  // Helper functions
  const resetOrderForm = () => {
    setOrderFormData({
      supplier_id: "",
      expected_delivery_date: "",
      destination_location_id: "",
      reference: "",
      notes: "",
      created_by: "",
    });
    setOrderLines([]);
    setGlobalTaxRate(21);
    setProductSearchTerms({});
    setShowProductDropdowns({});
    setAutocompletedPrices({});
    setPriceComparisons({});
  };

  const addOrderLine = () => {
    // Reindex existing states (priceComparisons no longer needs reindexing since it uses product_id)
    const newProductSearchTerms = {};
    const newShowDropdowns = {};
    const newAutocompletedPrices = {};
    
    Object.keys(productSearchTerms).forEach(key => {
      const oldIndex = parseInt(key);
      newProductSearchTerms[oldIndex + 1] = productSearchTerms[oldIndex];
    });
    
    Object.keys(showProductDropdowns).forEach(key => {
      const oldIndex = parseInt(key);
      newShowDropdowns[oldIndex + 1] = showProductDropdowns[oldIndex];
    });
    
    Object.keys(autocompletedPrices).forEach(key => {
      const oldIndex = parseInt(key);
      newAutocompletedPrices[oldIndex + 1] = autocompletedPrices[oldIndex];
    });
    
    newProductSearchTerms[0] = "";
    newShowDropdowns[0] = false;
    
    setOrderLines([{
      product_id: "",
      product_title: "",
      supplier_sku: "",
      quantity_ordered: 1,
      unit_price: 0,
      tax_rate: globalTaxRate,
      discount_rate: 0,
    }, ...orderLines]);
    
    setProductSearchTerms(newProductSearchTerms);
    setShowProductDropdowns(newShowDropdowns);
    setAutocompletedPrices(newAutocompletedPrices);
    // priceComparisons doesn't need to be updated since it uses product_id as key
  };

  const removeOrderLine = (index: number) => {
    const lineToRemove = orderLines[index];
    setOrderLines(orderLines.filter((_, i) => i !== index));
    
    const newProductSearchTerms = { ...productSearchTerms };
    const newShowDropdowns = { ...showProductDropdowns };
    const newAutocompletedPrices = { ...autocompletedPrices };
    const newPriceComparisons = { ...priceComparisons };
    
    delete newProductSearchTerms[index];
    delete newShowDropdowns[index];
    delete newAutocompletedPrices[index];
    
    // Remove price comparison by product_id instead of index
    if (lineToRemove?.product_id) {
      delete newPriceComparisons[lineToRemove.product_id];
    }
    
    // Reindex higher indices (except priceComparisons which uses product_id)
    for (let i = index + 1; i < orderLines.length; i++) {
      if (newProductSearchTerms[i]) {
        newProductSearchTerms[i - 1] = newProductSearchTerms[i];
        delete newProductSearchTerms[i];
      }
      if (newShowDropdowns[i]) {
        newShowDropdowns[i - 1] = newShowDropdowns[i];
        delete newShowDropdowns[i];
      }
      if (newAutocompletedPrices[i]) {
        newAutocompletedPrices[i - 1] = newAutocompletedPrices[i];
        delete newAutocompletedPrices[i];
      }
    }
    
    setProductSearchTerms(newProductSearchTerms);
    setShowProductDropdowns(newShowDropdowns);
    setAutocompletedPrices(newAutocompletedPrices);
    setPriceComparisons(newPriceComparisons);
  };

  const updateOrderLine = (index: number, field: string, value: any) => {
    console.log(`🔄 Updating line ${index}, field: ${field}, value:`, value);
    const newLines = [...orderLines];
    newLines[index] = { ...newLines[index], [field]: value };
    setOrderLines(newLines);
    console.log(`✅ Line ${index} updated, new data:`, newLines[index]);
  };

  const updateMultipleOrderLineFields = (index: number, fields: Record<string, any>) => {
    console.log(`🔄 Updating multiple fields for line ${index}:`, fields);
    const newLines = [...orderLines];
    newLines[index] = { ...newLines[index], ...fields };
    setOrderLines(newLines);
    console.log(`✅ Line ${index} updated with multiple fields, new data:`, newLines[index]);
  };

  const applyGlobalTaxToAllLines = () => {
    const newLines = orderLines.map(line => ({
      ...line,
      tax_rate: globalTaxRate
    }));
    setOrderLines(newLines);
  };

  const calculateLineTotal = (line: Partial<SupplierOrderLine>) => {
    const quantity = line.quantity_ordered || 0;
    const unitPrice = line.unit_price || 0;
    const discountRate = line.discount_rate || 0;
    const taxRate = line.tax_rate || 0;

    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discountRate / 100);
    const discountedPrice = subtotal - discountAmount;
    const taxAmount = discountedPrice * (taxRate / 100);
    const total = discountedPrice + taxAmount;

    return total;
  };

  const calculateOrderTotals = () => {
    const subtotal = orderLines.reduce((sum, line) => sum + ((line.quantity_ordered || 0) * (line.unit_price || 0)), 0);
    const totalDiscounts = orderLines.reduce((sum, line) => {
      const lineSubtotal = (line.quantity_ordered || 0) * (line.unit_price || 0);
      const discountAmount = lineSubtotal * ((line.discount_rate || 0) / 100);
      return sum + discountAmount;
    }, 0);
    const subtotalAfterDiscounts = subtotal - totalDiscounts;
    const totalTax = orderLines.reduce((sum, line) => {
      const lineSubtotal = (line.quantity_ordered || 0) * (line.unit_price || 0);
      const discountAmount = lineSubtotal * ((line.discount_rate || 0) / 100);
      const discountedPrice = lineSubtotal - discountAmount;
      const taxAmount = discountedPrice * ((line.tax_rate || 0) / 100);
      return sum + taxAmount;
    }, 0);
    const total = subtotalAfterDiscounts + totalTax;

    return {
      subtotal,
      totalDiscounts,
      totalTax,
      total
    };
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency || "EUR",
    }).format(amount);
  };

  const handleProductSearch = (index: number, searchTerm: string) => {
    setProductSearchTerms({ ...productSearchTerms, [index]: searchTerm });
    setShowProductDropdowns({ ...showProductDropdowns, [index]: searchTerm.length > 0 });
  };

  const selectProduct = async (index: number, product: any) => {
    console.log(`🔍 DEBUG selectProduct - Seleccionando:`, { id: product.id, title: product.title });
    
    // Update multiple fields in a single operation
    const newLines = [...orderLines];
    newLines[index] = { 
      ...newLines[index], 
      product_id: product.id,
      product_title: product.title,
      product_thumbnail: product.thumbnail || "",
      tax_rate: globalTaxRate
    };
    
    setOrderLines(newLines);
    setProductSearchTerms({ ...productSearchTerms, [index]: "" });
    setShowProductDropdowns({ ...showProductDropdowns, [index]: false });

    // Auto-complete price if available
    if (productPrices[product.id] && orderFormData.supplier_id) {
      const priceInfo = productPrices[product.id];
      newLines[index].unit_price = priceInfo.last_price;
      newLines[index].supplier_sku = priceInfo.supplier_sku;  // Add supplier SKU
      setOrderLines(newLines);

      const orderDate = new Date(priceInfo.last_order_date);
      setAutocompletedPrices({
        ...autocompletedPrices,
        [index]: {
          display_id: priceInfo.display_id,
          date: orderDate.toLocaleDateString('es-ES')
        }
      });

      // Call price comparison API
      try {
        const comparisonResponse = await fetch(
          `/admin/suppliers/${orderFormData.supplier_id}/products/${product.id}/price-comparison`
        );
        
        if (comparisonResponse.ok) {
          const comparisonData = await comparisonResponse.json();
          console.log('🖥️ [FRONTEND] Respuesta de comparación:', comparisonData);
          
          if (comparisonData.success && comparisonData.data.cheapest_option) {
            setPriceComparisons(prev => ({
              ...prev,
              [product.id]: comparisonData.data
            }));
          }
        }
      } catch (error) {
        console.error('❌ Error calling price comparison API:', error);
      }
    }
  };


  // Show loading if products are still loading
  if (isLoadingProducts) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="small" onClick={onCancel}>
              ← Volver
            </Button>
            <Heading level="h2">{editingOrder ? "Editar Pedido" : "Crear Nuevo Pedido"}</Heading>
          </div>
        </div>
        <div className="px-6 py-8 text-center">
          <Text>Cargando productos...</Text>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="small" onClick={onCancel}>
            ← Volver
          </Button>
          <Heading level="h2">Crear Nuevo Pedido</Heading>
        </div>
      </div>

      <div className="px-6 py-8">
        <form 
          onSubmit={(e) => { 
            e.preventDefault(); 
            createOrderMutation.mutate(orderFormData); 
          }} 
          className="space-y-6 max-w-7xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Heading level="h3" className="text-lg">Información del Pedido</Heading>
              
              <div>
                <label className="block text-sm font-medium mb-2">Proveedor *</label>
                <select
                  value={orderFormData.supplier_id}
                  onChange={(e) => setOrderFormData({ ...orderFormData, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} - {supplier.tax_id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Referencia del Proveedor</label>
                <input
                  type="text"
                  value={orderFormData.reference}
                  onChange={(e) => setOrderFormData({ ...orderFormData, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Número de referencia del proveedor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Entrega Esperada</label>
                <input
                  type="date"
                  value={orderFormData.expected_delivery_date}
                  onChange={(e) => setOrderFormData({ ...orderFormData, expected_delivery_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Realizado por *</label>
                <input
                  type="text"
                  value={orderFormData.created_by}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-white cursor-not-allowed"
                  placeholder="Cargando usuario..."
                  disabled
                  readOnly
                />
                <Text size="small" className="text-gray-500 mt-1">
                  Usuario logueado automáticamente
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              <Heading level="h3" className="text-lg">Detalles de Entrega</Heading>
              
              <div>
                <label className="block text-sm font-medium mb-2">Ubicación de Destino *</label>
                <select
                  value={orderFormData.destination_location_id}
                  onChange={(e) => setOrderFormData({ ...orderFormData, destination_location_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar almacén</option>
                  {stockLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                <Text size="small" className="text-gray-500 mt-1">
                  Almacén donde se recibirá la mercancía
                </Text>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notas del Pedido</label>
                <textarea
                  value={orderFormData.notes}
                  onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Instrucciones especiales, observaciones..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Heading level="h3" className="text-lg">Líneas del Pedido</Heading>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">IVA por defecto:</label>
                  <select
                    value={globalTaxRate}
                    onChange={(e) => setGlobalTaxRate(parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={0}>0%</option>
                    <option value={21}>21%</option>
                  </select>
                  {orderLines.length > 0 && (
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="small"
                      onClick={applyGlobalTaxToAllLines}
                      className="text-xs"
                    >
                      Aplicar a todas
                    </Button>
                  )}
                </div>
                <Button type="button" variant="secondary" size="small" onClick={addOrderLine}>
                  <Plus className="w-4 h-4" />
                  Agregar Producto
                </Button>
              </div>
            </div>

            {orderLines.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-visible">
                {/* Table headers */}
                <div className="bg-gray-50 grid grid-cols-[4fr,1.5fr,1fr,1fr,1fr,1fr,1fr,1fr] gap-3 px-4 py-3 text-sm font-medium text-gray-700">
                  <div>Producto</div>
                  <div>SKU</div>
                  <div>Cantidad</div>
                  <div>Precio Unit.</div>
                  <div>IVA %</div>
                  <div>Desc. %</div>
                  <div>Total</div>
                  <div>Acciones</div>
                </div>
                
                {/* Product rows */}
                {orderLines.map((line, index) => {
                  // Safety check to ensure products is always an array
                  const safeProducts = Array.isArray(products) ? products : [];
                  console.log("🛡️ Passing products to OrderLineItem:", Array.isArray(safeProducts), safeProducts.length);
                  
                  return (
                    <OrderLineItem
                      key={index}
                      index={index}
                      line={line}
                      supplierId={orderFormData.supplier_id}
                      globalTaxRate={globalTaxRate}
                      productSearchTerm={productSearchTerms[index] || ""}
                      showProductDropdown={showProductDropdowns[index] || false}
                      autocompletedPrice={autocompletedPrices[index]}
                      priceComparison={priceComparisons[line.product_id]}
                      products={safeProducts}
                      productPrices={productPrices}
                      onLineUpdate={(idx, field, value) => {
                        updateOrderLine(idx, field, value);
                        // Clear autocompleted indicator if user modifies price manually
                        if (field === "unit_price" && autocompletedPrices[idx]) {
                          const newAutocompleted = { ...autocompletedPrices };
                          delete newAutocompleted[idx];
                          setAutocompletedPrices(newAutocompleted);
                        }
                        // Clear autocompleted prices and price comparisons when product is cleared
                        if (field === "product_id" && value === "") {
                          const newAutocompleted = { ...autocompletedPrices };
                          const newPriceComparisons = { ...priceComparisons };
                          delete newAutocompleted[idx];
                          // Clear by the old product_id
                          if (line.product_id) {
                            delete newPriceComparisons[line.product_id];
                          }
                          setAutocompletedPrices(newAutocompleted);
                          setPriceComparisons(newPriceComparisons);
                        }
                      }}
                      onMultipleFieldsUpdate={(idx, fields) => {
                        updateMultipleOrderLineFields(idx, fields);
                        // Clear autocompleted prices and price comparisons when product is cleared
                        if (fields.product_id === "") {
                          const newAutocompleted = { ...autocompletedPrices };
                          const newPriceComparisons = { ...priceComparisons };
                          delete newAutocompleted[idx];
                          // Clear by the old product_id
                          if (line.product_id) {
                            delete newPriceComparisons[line.product_id];
                          }
                          setAutocompletedPrices(newAutocompleted);
                          setPriceComparisons(newPriceComparisons);
                        }
                      }}
                      onRemove={removeOrderLine}
                      onProductSearch={handleProductSearch}
                      onProductSelect={selectProduct}
                      formatCurrency={formatCurrency}
                      calculateLineTotal={calculateLineTotal}
                    />
                  );
                })}
                
                {orderLines.length > 0 && (
                  <div className="bg-blue-50 dark:bg-gray-500 p-4 rounded-lg">
                    <div className="text-right space-y-2">
                      {(() => {
                        const totals = calculateOrderTotals();
                        return (
                          <>
                            <div className="text-sm text-gray-600">
                              <div>Subtotal: {formatCurrency(totals.subtotal, "EUR")}</div>
                              {totals.totalDiscounts > 0 && (
                                <div className="text-red-600">Descuentos: -{formatCurrency(totals.totalDiscounts, "EUR")}</div>
                              )}
                              {totals.totalTax > 0 && (
                                <div className="text-green-600">IVA: +{formatCurrency(totals.totalTax, "EUR")}</div>
                              )}
                            </div>
                            <div className="border-t pt-2">
                              <Text className="font-bold text-lg">
                                Total Pedido: {formatCurrency(totals.total, "EUR")}
                              </Text>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <Text className="text-gray-500">No hay productos en el pedido</Text>
                <Button type="button" variant="secondary" size="small" className="mt-2" onClick={addOrderLine}>
                  <Plus className="w-4 h-4" />
                  Agregar primer producto
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 pt-6 border-t">
            <Button
              type="submit"
              disabled={createOrderMutation.isPending || !orderFormData.supplier_id || !orderFormData.created_by || !orderFormData.destination_location_id}
            >
              {createOrderMutation.isPending ? (editingOrder ? "Actualizando..." : "Creando...") : (editingOrder ? "Actualizar Pedido" : "Crear Pedido")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
};

export default CreateOrderForm;