"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
 
 interface HeroSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
 }
 
 const HeroSection: React.FC<HeroSectionProps> = ({
  searchTerm,
  setSearchTerm,
 }) => {
  return (
   <div className="py-16 sm:px-6 lg:px-8 text-center text-gray-800">
    <h1 className="
     text-4xl sm:text-5xl font-archivoBlack uppercase font-bold text-gray-800 mb-4
     relative
     inline-block
     lg:after:content-['']
     lg:after:absolute
     lg:after:left-0 after:bottom-0
     lg:after:w-full
     lg:after:h-1
     lg:after:bg-mysGreen-100
    ">
     Centro de Ayuda
    </h1>
    <p className="text-lg sm:text-xl font-archivo text-gray-800-300 mb-8">
     Encuentra respuestas rápidas a tus preguntas más frecuentes
    </p>
    <div className="relative max-w-2xl mx-auto">
     <input
      type="text"
      placeholder="Busca tu pregunta aquí..."
      className="w-full py-3 pl-12 pr-4 rounded-full bg-white text-gray-900 placeholder-gray-500 outline-none ring-2 ring-mysGreen-100 border-transparent"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
     />
     <FontAwesomeIcon
      icon={faSearch}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
     />
    </div>
   </div>
  );
 };
 
 export default HeroSection;