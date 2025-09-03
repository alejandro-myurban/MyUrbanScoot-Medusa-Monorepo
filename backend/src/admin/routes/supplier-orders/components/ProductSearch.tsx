import React from "react";

interface ProductSearchProps {
  searchTerm: string;
  products: any[];
  productPrices: any;
  onSearchChange: (searchTerm: string) => void;
  onProductSelect: (product: any) => void;
  showDropdown: boolean;
  placeholder?: string;
  required?: boolean;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  searchTerm,
  products,
  productPrices,
  onSearchChange,
  onProductSelect,
  showDropdown,
  placeholder = "Buscar producto...",
  required = false,
}) => {
  const getFilteredProducts = () => {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];
    
    console.log("🔍 Buscando:", searchTerm, "en", products.length, "productos");
    
    const filtered = products.filter(product => 
      product.title && product.title.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 15); // Show up to 15 results
    
    console.log("✨ Encontrados:", filtered.length, "productos");
    return filtered;
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
        placeholder={placeholder}
        required={required}
      />
      
      {/* Filtered products dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full min-w-[600px] mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {getFilteredProducts().length > 0 ? (
            getFilteredProducts().map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onProductSelect(product)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <img 
                    className="w-8 h-8 rounded object-cover" 
                    src={product.thumbnail} 
                    alt={product.title}
                  />
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
              No se encontraron productos para "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;