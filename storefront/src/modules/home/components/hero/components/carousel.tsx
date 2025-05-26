import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Zap, Shield, Truck, Smartphone } from 'lucide-react';

// Componente Carrusel Hero
export const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Diseñados para que tus patinetes duren más",
      subtitle: "(con tu ayuda)",
      description: "Hemos unido fuerzas con las mejores marcas para ofrecer patinetes eléctricos de máxima calidad y durabilidad.",
      buttonText: "Haz que duren",
      bgColor: "from-blue-100 to-purple-100",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=400&fit=crop"
    },
    {
      title: "Tecnología de vanguardia",
      subtitle: "(para tu comodidad)",
      description: "Descubre los patinetes más avanzados con la última tecnología en movilidad urbana sostenible.",
      buttonText: "Explorar ahora",
      bgColor: "from-green-100 to-blue-100",
      image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&h=400&fit=crop"
    },
    {
      title: "Movilidad sostenible",
      subtitle: "(para tu ciudad)",
      description: "Únete a la revolución de la movilidad urbana con nuestros patinetes eléctricos ecológicos.",
      buttonText: "Ver modelos",
      bgColor: "from-purple-100 to-pink-100",
      image: "https://images.unsplash.com/photo-1544191696-15693b87eb82?w=800&h=400&fit=crop"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-2xl mb-12">
      <div className="flex transition-transform duration-500 ease-in-out h-full"
           style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {slides.map((slide, index) => (
          <div key={index} className={`w-full h-full flex-shrink-0 bg-gradient-to-r ${slide.bgColor} relative`}>
            <div className="flex h-full">
              <div className="flex-1 flex flex-col justify-center px-12">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  {slide.title}
                </h1>
                <h2 className="text-2xl font-light text-gray-700 mb-4 italic">
                  {slide.subtitle}
                </h2>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed max-w-md">
                  {slide.description}
                </p>
                <button className="bg-gray-800 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors w-fit font-medium">
                  {slide.buttonText}
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center p-8">
                <img 
                  src={slide.image} 
                  alt="Patinete eléctrico"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Controles de navegación */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>
      
      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              currentSlide === index ? 'bg-gray-800' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};