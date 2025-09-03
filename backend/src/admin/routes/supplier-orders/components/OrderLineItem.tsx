import React from "react";
import { Button, Text } from "@medusajs/ui";
import { Package, XCircle, Trash2 } from "lucide-react";

// Types
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

interface OrderLineItemProps {
  index: number;
  line: Partial<SupplierOrderLine>;
  supplierId: string;
  globalTaxRate: number;
  productSearchTerm: string;
  showProductDropdown: boolean;
  autocompletedPrice?: { display_id: string, date: string };
  priceComparison?: any;
  products: any[];
  productPrices: any;
  onLineUpdate: (index: number, field: string, value: any) => void;
  onMultipleFieldsUpdate: (index: number, fields: Record<string, any>) => void;
  onRemove: (index: number) => void;
  onProductSearch: (index: number, searchTerm: string) => void;
  onProductSelect: (index: number, product: any) => void;
  formatCurrency: (amount: number, currency: string) => string;
  calculateLineTotal: (line: Partial<SupplierOrderLine>) => number;
}

export const OrderLineItem: React.FC<OrderLineItemProps> = ({
  index,
  line,
  supplierId,
  globalTaxRate,
  productSearchTerm,
  showProductDropdown,
  autocompletedPrice,
  priceComparison,
  products,
  productPrices,
  onLineUpdate,
  onMultipleFieldsUpdate,
  onRemove,
  onProductSearch,
  onProductSelect,
  formatCurrency,
  calculateLineTotal,
}) => {
  console.log(`🔍 OrderLineItem ${index} render - product_id:`, line.product_id, "product_title:", line.product_title);
  const getFilteredProducts = () => {
    if (!productSearchTerm.trim() || productSearchTerm.length < 2) return [];
    
    // Verificar que products es un array
    if (!Array.isArray(products)) {
      console.warn("Products is not an array:", products);
      return [];
    }
    
    const filtered = products.filter(product => 
      product.title && product.title.toLowerCase().includes(productSearchTerm.toLowerCase())
    ).slice(0, 15);
    
    return filtered;
  };

  const clearProduct = () => {
    console.log("🗑️ BEFORE clearing product for line", index, "- product_id:", line.product_id);
    
    // Clear all product fields in one atomic update
    const clearedFields = {
      product_id: "",
      product_title: "",
      product_thumbnail: "",
      supplier_sku: "",
      unit_price: 0
    };
    
    onMultipleFieldsUpdate(index, clearedFields);
    onProductSearch(index, "");
    console.log("✅ AFTER clearing product for line", index, "- should be empty now");
  };

  return (
    <div className="border-b border-gray-100 bg-white hover:bg-gray-50">
      {/* Main row */}
      <div className="grid grid-cols-[4fr,1.5fr,1fr,1fr,1fr,1fr,1fr,1fr] gap-3 px-4 py-3">
        {/* Product */}
      <div className="relative">
        {/* Show product image and name if selected */}
        {(() => {
          const showContainer = !!line.product_id;
          console.log(`🔵 Line ${index} - showContainer:`, showContainer, "product_id:", line.product_id);
          return showContainer;
        })() && (
          <div className="flex items-center gap-2 mb-2 p-2 border border-gray-500 rounded">
            <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
              <img 
                className="w-full h-full object-cover rounded" 
                src={line.product_thumbnail} 
                alt={line.product_title}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                }}
              />
            </div>
            <div className="flex-1">
              <Text size="small" className="font-medium text-black/90">{line.product_title}</Text>
            </div>
            <button
              type="button"
              onClick={(e) => {
                console.log("❌ X button clicked for line", index);
                e.preventDefault();
                e.stopPropagation();
                clearProduct();
              }}
              className="text-red-600 hover:text-red-800 p-1"
              title="Quitar producto"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Show search input only if NO product selected */}
        {!line.product_id && (
          <input
            type="text"
            value={productSearchTerm || line.product_title || ""}
            onChange={(e) => {
              onProductSearch(index, e.target.value);
              onLineUpdate(index, "product_title", e.target.value);
            }}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            placeholder="Buscar producto..."
            required
          />
        )}
        
        {/* Filtered products dropdown */}
        {showProductDropdown && (
          <div className="absolute z-50 w-full min-w-[600px] mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {getFilteredProducts().length > 0 ? (
              getFilteredProducts().map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onProductSelect(index, product)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <img className="w-8 h-8 rounded object-cover" src={product.thumbnail} alt={product.title} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-xs">{product.title}</div>
                      {productPrices[product.id] && (
                        <div className="text-xs text-green-600 font-medium">
                          €{productPrices[product.id].last_price} 
                          <span className="text-gray-400 ml-1">
                            (último: {new Date(productPrices[product.id].last_order_date).toLocaleDateString()})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                No se encontraron productos para "{productSearchTerm || ""}"
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* SKU */}
      <div>
        <input
          type="text"
          value={line.supplier_sku || ""}
          onChange={(e) => onLineUpdate(index, "supplier_sku", e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="SKU"
        />
      </div>
      
      {/* Quantity */}
      <div>
        <input
          type="number"
          min="1"
          value={line.quantity_ordered || 1}
          onChange={(e) => onLineUpdate(index, "quantity_ordered", parseInt(e.target.value) || 1)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          required
        />
      </div>
      
        {/* Unit Price */}
        <div>
          <input
            type="number"
            step="0.01"
            value={line.unit_price || ""}
            onChange={(e) => {
              const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
              onLineUpdate(index, "unit_price", value);
            }}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            placeholder="0.00"
          />
        </div>
      
      {/* Tax Rate % */}
      <div>
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={line.tax_rate || 0}
          onChange={(e) => onLineUpdate(index, "tax_rate", parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="21"
        />
      </div>
      
      {/* Discount % */}
      <div>
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={line.discount_rate || ""}
          onChange={(e) => {
            const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
            onLineUpdate(index, "discount_rate", value);
          }}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="0"
        />
      </div>
      
      {/* Total */}
      <div className="text-sm font-medium">
        {(line.quantity_ordered && line.unit_price) ? (
          <div className="text-blue-800">
            {formatCurrency(calculateLineTotal(line), "EUR")}
          </div>
        ) : (
          <span className="text-gray-400">€0.00</span>
        )}
      </div>
      
      {/* Actions */}
      <div>
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={() => onRemove(index)}
          className="px-2 py-1 text-xs"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
        </div>
      </div>
      
      {/* Price information sub-row */}
      {autocompletedPrice && (
        <div className="px-4 pb-2 bg-gray-50">
          <div className="flex items-center gap-4 text-xs">
            <div className="text-green-600 flex items-center gap-1">
              <span className="text-green-500">✅</span>
              <span>Precio anterior: {formatCurrency(line.unit_price || 0, "EUR")} ({autocompletedPrice.date})</span>
            </div>
            {priceComparison?.cheapest_option && (
              <div className="text-red-600 font-medium flex items-center gap-1">
                <span className="text-red-500">⚠️</span>
                <span>MÁS BARATO: {priceComparison.cheapest_option.supplier_name} - Ahorras {formatCurrency(priceComparison.cheapest_option.savings, "EUR")}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderLineItem;