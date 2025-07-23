"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faPhone, faBook, faCheckCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import LocalizedClientLink from "@modules/common/components/localized-client-link";

const CTACards: React.FC = () => {
  const phoneNumber = "+312312412";
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const copyToClipboard = () => {
    const el = document.createElement('textarea');
    el.value = phoneNumber;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    
    setModalMessage('¡Número copiado al portapapeles!');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage("");
  };

  return (
    <div className="container mx-auto pb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Contactar al soporte */}
      <div className="group bg-white rounded-xl shadow-lg p-6 text-center flex flex-col items-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
        <div className="transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
          <FontAwesomeIcon
            icon={faEnvelope}
            className="text-gray-900 text-5xl mb-4 transition-colors duration-300 group-hover:text-gray-500"
          />
        </div>
        <h3 className="text-xl font-semibold font-archivoBlack text-gray-800 mb-2 uppercase transition-colors duration-300 group-hover:text-gray-500">
          Contactar al soporte
        </h3>
        <p className="text-gray-600 font-archivo mb-4 transition-colors duration-300 group-hover:text-gray-700">
          ¿No encuentras lo que buscas?
        </p>
        <LocalizedClientLink
          href="/contact"
          className="bg-gray-800 font-archivo text-white px-6 py-2 rounded-full transition-colors duration-300"
        >
          Enviar Mensaje
        </LocalizedClientLink>
      </div>

      {/* Llamar Ahora */}
      <div className="group bg-white rounded-xl shadow-lg p-6 text-center flex flex-col items-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
        <div className="transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
          <FontAwesomeIcon
            icon={faPhone}
            className="text-gray-900 text-5xl mb-4 transition-colors duration-300 group-hover:text-gray-500"
          />
        </div>
        <h3 className="text-xl font-semibold font-archivoBlack uppercase text-gray-800 mb-2 transition-colors duration-300 group-hover:text-gray-500">
          Llamar Ahora
        </h3>
        <p className="text-gray-600 font-archivo mb-4 transition-colors duration-300 group-hover:text-gray-700">
          Habla directamente con nosotros
        </p>
        <button
          onClick={copyToClipboard}
          className="bg-gray-800 font-archivo text-white px-6 py-2 rounded-full transition-colors duration-300"
        >
          {phoneNumber}
        </button>
      </div>

      {/* Guías y Tutoriales */}
      <div className="group bg-white rounded-xl shadow-lg p-6 text-center flex flex-col items-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
        <div className="transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
          <FontAwesomeIcon
            icon={faBook}
            className="text-gray-900 text-5xl mb-4 transition-colors duration-300 group-hover:text-gray-500"
          />
        </div>
        <h3 className="text-xl font-semibold font-archivoBlack uppercase text-gray-800 mb-2 transition-colors duration-300 group-hover:text-gray-500">
          Guías y Tutoriales
        </h3>
        <p className="text-gray-600 font-archivo mb-4 transition-colors duration-300 group-hover:text-gray-700">
          Aprende paso a paso
        </p>
        <LocalizedClientLink
          href="/guides"
          className="bg-gray-800 font-archivo text-white px-6 py-2 rounded-full transition-colors duration-300"
        >
          Ver Guías
        </LocalizedClientLink>
      </div>

      {/* Modal de Confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center relative transform animate-scaleIn">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors hover:scale-110 transform duration-200"
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
            </button>
            <div className="transform animate-bounce">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-4xl mb-4" />
            </div>
            <p className="text-gray-800 text-lg font-semibold mb-4">{modalMessage}</p>
            <button
              onClick={closeModal}
              className="bg-mysGreen-100 text-gray-900 px-6 py-2 rounded-full hover:bg-mysGreen-200 transition-all duration-200 transform hover:scale-105"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.8);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CTACards;