"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faQuestion,
} from "@fortawesome/free-solid-svg-icons";

interface CategoryItem {
  name: string;
  count: number;
}

interface SidebarProps {
  categories: CategoryItem[];
  popularQuestions: { id: string; question: string }[];
}

const SidebarFAQ: React.FC<SidebarProps> = ({ categories, popularQuestions }) => {
  return (
    <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6 h-fit sticky top-4">
      {/* Categorías */}
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faCog} className="text-gray-600" />
        Categorías
      </h2>
      <ul className="space-y-1 mb-8">
        {categories.map((category, index) => (
          <li key={index}>
            <a
              href="#"
              className={`
                flex items-center justify-between py-2 px-3 rounded-lg
                text-gray-700 hover:bg-gray-100 transition-colors duration-200
                ${category.name === "Todas" ? "bg-red-500 text-white font-semibold relative" : ""}
              `}
            >
              <span className={`${category.name === "Todas" ? "text-white" : "text-gray-700"}`}>
                {category.name}
              </span>
              <span className={`
                text-sm px-2 py-0.5 rounded-full
                ${category.name === "Todas" ? "bg-white text-red-500 font-bold" : "bg-gray-200 text-gray-600"}
              `}>
                {category.count}
              </span>
              {category.name === "Todas" && (
                <div className="absolute right-0 top-0 h-full w-1 bg-red-600 rounded-r-lg"></div>
              )}
            </a>
          </li>
        ))}
      </ul>

      {/* Más Populares */}
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faQuestion} className="text-gray-600" />
        Más Populares
      </h2>
      <ul className="space-y-2">
        {popularQuestions.map((q) => (
          <li key={q.id}>
            <a
              href="#"
              className="text-gray-700 hover:text-mysGreen-100 transition-colors duration-200 text-lg"
            >
              {q.question}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarFAQ;
