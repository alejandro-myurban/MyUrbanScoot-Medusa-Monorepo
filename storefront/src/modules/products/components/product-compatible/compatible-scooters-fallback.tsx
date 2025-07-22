"use client";

import React from "react";
import { HttpTypes } from '@medusajs/types';

interface CompatibleScootersFallbackProps {
  category?: HttpTypes.StoreProductCategory; 
}

const CompatibleScootersFallback: React.FC<CompatibleScootersFallbackProps> = ({ category }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 4 }).map((_, i) => ( // Muestra 4 esqueletos de carga
        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
          <div className="w-full aspect-square bg-gray-200"></div>
          <div className="p-3 sm:p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CompatibleScootersFallback;
