"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faPhone, faBook, faCheckCircle, faTimes } from "@fortawesome/free-solid-svg-icons"; // Añadido faCheckCircle y faTimes
import LocalizedClientLink from "@modules/common/components/localized-client-link";

const CTACards: React.FC = () => {
  const phoneNumber = "+312312412"; // Definir el número de teléfono
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Contactar al soporte */}
      <div className="bg-white rounded-xl shadow-lg p-6 text-center flex flex-col items-center">
        <FontAwesomeIcon
          icon={faEnvelope}
          className="text-gray-900 text-5xl mb-4"
        />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Contactar al soporte
        </h3>
        <p className="text-gray-600 mb-4">
          ¿No encuentras lo que buscas?
        </p>
        <LocalizedClientLink
          href="/contact"
          className="bg-gray-800 text-white px-6 py-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
        >
          Enviar Mensaje
        </LocalizedClientLink>
      </div>

      {/* Llamar Ahora */}
      <div className="bg-white rounded-xl shadow-lg p-6 text-center flex flex-col items-center">
        <FontAwesomeIcon
          icon={faPhone}
          className="text-gray-900 text-5xl mb-4"
        />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Llamar Ahora
        </h3>
        <p className="text-gray-600 mb-4">
          Habla directamente con nosotros
        </p>
        <button
          onClick={copyToClipboard}
          className="bg-gray-800 text-white px-6 py-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
        >
          {phoneNumber}
        </button>
      </div>

      {/* Guías y Tutoriales */}
      <div className="bg-white rounded-xl shadow-lg p-6 text-center flex flex-col items-center">
        <FontAwesomeIcon
          icon={faBook}
          className="text-gray-900 text-5xl mb-4"
        />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Guías y Tutoriales
        </h3>
        <p className="text-gray-600 mb-4">
          Aprende paso a paso
        </p>
        <LocalizedClientLink
          href="/guides"
          className="bg-gray-800 text-white px-6 py-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
        >
          Ver Guías
        </LocalizedClientLink>
      </div>

      {/* Modal de Confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
            </button>
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-4xl mb-4" />
            <p className="text-gray-800 text-lg font-semibold mb-4">{modalMessage}</p>
            <button
              onClick={closeModal}
              className="bg-mysGreen-100 text-gray-900 px-6 py-2 rounded-full hover:bg-mysGreen-200 transition-colors duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CTACards;
