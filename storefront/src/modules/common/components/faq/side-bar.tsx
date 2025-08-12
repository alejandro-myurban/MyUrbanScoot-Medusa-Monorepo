"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faQuestion,
  faCircleQuestion,
  faFilter,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

interface CategoryItem {
  name: string;
  count: number;
}

interface SidebarProps {
  categories: CategoryItem[];
  popularQuestions: { id: string; question: string }[];
}

const SidebarFAQ: React.FC<SidebarProps> = ({ categories, popularQuestions }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  return (
    <>
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={toggleModal}
          className="bg-red-500 text-white p-4 rounded-full shadow-2xl hover:bg-red-600 transition-all duration-300 transform hover:scale-110 active:scale-95"
        >
          <FontAwesomeIcon icon={faFilter} className="text-xl" />
        </button>
      </div>

      <div className="hidden lg:block lg:col-span-1 bg-white rounded-xl shadow-lg p-6 h-fit sticky top-4">
        {/* Categorías */}
        <h2 className="text-xl font-bold font-archivoBlack uppercase text-gray-800 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faCog} className="text-gray-600" />
          {t("sidebar.categories.title")}
        </h2>
        <ul className="space-y-1 mb-8">
          {categories.map((category, index) => (
            <li key={index}>
              <a
                href="#"
                className={`
                  flex items-center justify-between py-2 px-3 font-archivo rounded-lg
                  text-gray-700 hover:bg-gray-100 transition-colors duration-200
                  ${category.name === "Todas" ? "bg-red-500 text-white font-semibold relative" : ""}
                `}
              >
                <span className={`${category.name === "Todas" ? "text-white" : "text-gray-700"}`}>
                  {category.name === "Todas" ? t("sidebar.allCategories") : category.name}
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
        <h2 className="text-xl font-bold text-gray-800 font-archivoBlack uppercase mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faCircleQuestion} className="text-gray-600" />
          {t("sidebar.popular.title")}
        </h2>
        <ul className="space-y-2">
          {popularQuestions.map((q) => (
            <li key={q.id}>
              <a
                href="#"
                className="text-gray-700 font-archivo transition-colors duration-200 text-lg hover:text-gray-900 block py-1"
              >
                {q.question}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Modal */}
      {isModalOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={toggleModal}
          />
          
          <div className="relative bg-white w-full max-h-[85vh] rounded-t-3xl shadow-2xl transform transition-all duration-300 ease-out animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold font-archivoBlack uppercase text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} className="text-gray-600" />
                {t("sidebar.filter")}
              </h2>
              <button
                onClick={toggleModal}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faTimes} className="text-gray-600 text-lg" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              {/* Categorías */}
              <div className="mb-8">
                <h3 className="text-lg font-bold font-archivoBlack uppercase text-gray-800 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCog} className="text-gray-600" />
                  {t("sidebar.categories.title")}
                </h3>
                <ul className="space-y-2">
                  {categories.map((category, index) => (
                    <li key={index}>
                      <a
                        href="#"
                        className={`
                          flex items-center justify-between py-3 px-4 font-archivo rounded-xl
                          text-gray-700 hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02]
                          ${category.name === "Todas" ? "bg-red-500 text-white font-semibold shadow-lg" : "border border-gray-200"}
                        `}
                        onClick={toggleModal}
                      >
                        <span className={`${category.name === "Todas" ? "text-white" : "text-gray-700"}`}>
                          {category.name === "Todas" ? t("sidebar.allCategories") : category.name}
                        </span>
                        <span className={`
                          text-sm px-3 py-1 rounded-full font-medium
                          ${category.name === "Todas" ? "bg-white text-red-500" : "bg-gray-100 text-gray-600"}
                        `}>
                          {category.count}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Más Populares */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 font-archivoBlack uppercase mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCircleQuestion} className="text-gray-600" />
                  {t("sidebar.popular.title")}
                </h3>
                <ul className="space-y-3">
                  {popularQuestions.map((q) => (
                    <li key={q.id}>
                      <a
                        href="#"
                        className="block text-gray-700 font-archivo transition-all duration-200 text-base py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transform hover:scale-[1.02]"
                        onClick={toggleModal}
                      >
                        {q.question}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default SidebarFAQ;