import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Zap, Shield, Truck, Smartphone } from 'lucide-react';

export const ProductSection = () => {
  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Reacondicionado por profesionales",
      description: "Cada producto revisado y certificado"
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Envío gratuito",
      description: "En pedidos superiores a 99€"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Carga rápida",
      description: "Batería completa en 3-4 horas"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "App exclusiva",
      description: "Control total desde tu móvil"
    }
  ];

  const products = [
    {
      id: 1,
      name: "Xiaomi Mi Electric Scooter Pro 2",
      brand: "Xiaomi",
      price: 399,
      originalPrice: 499,
      rating: 4.5,
      reviews: 2847,
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop",
      specs: "25km autonomía • 25 km/h • Plegable",
      badge: "Top ventas"
    },
    {
      id: 2,
      name: "Segway Ninebot Max G30",
      brand: "Segway",
      price: 549,
      originalPrice: 649,
      rating: 4.7,
      reviews: 1923,
      image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=400&fit=crop",
      specs: "65km autonomía • 30 km/h • IPX7",
      badge: "Más popular"
    },
    {
      id: 3,
      name: "Cecotec Bongo Serie A Connected",
      brand: "Cecotec",
      price: 279,
      originalPrice: 349,
      rating: 4.3,
      reviews: 856,
      image: "https://images.unsplash.com/photo-1544191696-15693b87eb82?w=400&h=400&fit=crop",
      specs: "25km autonomía • 25 km/h • App conectada",
      badge: "Mejor precio"
    },
    {
      id: 4,
      name: "KUGOO Kirin M4 Pro",
      brand: "Kugoo",
      price: 459,
      originalPrice: 599,
      rating: 4.6,
      reviews: 743,
      image: "https://images.unsplash.com/photo-1603349136914-8c3d4b2fd460?w=400&h=400&fit=crop",
      specs: "45km autonomía • 45 km/h • Suspensión dual",
      badge: "Premium"
    }
  ];

  const categories = [
    {
      name: "Urbanos",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
      bgColor: "bg-gradient-to-br from-blue-400 to-blue-600"
    },
    {
      name: "Todoterreno",
      image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=300&h=200&fit=crop",
      bgColor: "bg-gradient-to-br from-green-400 to-green-600"
    },
    {
      name: "Plegables",
      image: "https://images.unsplash.com/photo-1544191696-15693b87eb82?w=300&h=200&fit=crop",
      bgColor: "bg-gradient-to-br from-purple-400 to-purple-600"
    },
    {
      name: "Accesorios", 
      image: "https://images.unsplash.com/photo-1603349136914-8c3d4b2fd460?w=300&h=200&fit=crop",
      bgColor: "bg-gradient-to-br from-orange-400 to-orange-600"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Título principal */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          Sácale partido a la movilidad eléctrica con nosotros
        </h2>
        <p className="text-xl text-gray-600">
          Compra y vende patinetes eléctricos que son mejores para el planeta.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {features.map((feature, index) => (
          <div key={index} className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm border">
            <div className="bg-gray-100 p-3 rounded-full mb-4 text-gray-700">
              {feature.icon}
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Productos sugeridos */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800">Sugerencias para ti</h3>
          <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all group">
              <div className="relative p-4">
                {product.badge && (
                  <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full z-10">
                    {product.badge}
                  </span>
                )}
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform"
                />
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 font-medium">{product.brand}</div>
                  <h4 className="font-semibold text-gray-800 line-clamp-2">{product.name}</h4>
                  <p className="text-sm text-gray-600">{product.specs}</p>
                  
                  <div className="flex items-center space-x-1 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.rating} ({product.reviews.toLocaleString()})
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-gray-800">{product.price}€</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          {product.originalPrice}€
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 mt-4">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Añadir al carrito</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categorías más buscadas */}
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-8">Compra los "más buscados"</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <div key={index} className="relative overflow-hidden rounded-2xl h-40 group cursor-pointer">
              <div className={`absolute inset-0 ${category.bgColor} opacity-80`}></div>
              <img 
                src={category.image} 
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <h4 className="text-white text-xl font-bold text-center">{category.name}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};