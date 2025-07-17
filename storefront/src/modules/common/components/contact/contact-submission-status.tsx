"use client";

import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner, // Icono para el estado de carga
  faCheckCircle, // Icono para el estado de éxito
  faTimesCircle // Icono para el estado de error
} from '@fortawesome/free-solid-svg-icons';
import { SubmitButton } from "@/modules/checkout/components/submit-button"; // Asegúrate de que esta ruta sea correcta

interface SubmissionStatusDisplayProps {
  loading: boolean;
  submissionStatus: "idle" | "success" | "error";
  errorMessage: string;
  onTryAgain: () => void;
}

const SubmissionStatusDisplay: React.FC<SubmissionStatusDisplayProps> = ({
  loading,
  submissionStatus,
  errorMessage,
  onTryAgain,
}) => {
  if (loading) {
    return (
      <div className="text-center py-10">
        <FontAwesomeIcon icon={faSpinner} spin className="text-gray-800 w-16 h-16 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Enviando tu mensaje...
        </h2>
      </div>
    );
  }

  if (submissionStatus === "success") {
    return (
      <div className="text-center py-10">
        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 w-16 h-16 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ¡Mensaje enviado! 🎉
        </h2>
        <p className="text-gray-600 mb-4">
          Gracias por contactarnos. Te responderemos a la brevedad.
        </p>
      </div>
    );
  }

  if (submissionStatus === "error") {
    return (
      <div className="text-center py-10">
        <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 w-16 h-16 mx-auto mb-6" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Error al enviar el mensaje
        </h2>
        <p className="text-red-600 mb-4">{errorMessage}</p>
        <button
          onClick={onTryAgain}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
        >
          Intentar nuevamente
        </button>
      </div>
    );
  }

  return null;
};

export default SubmissionStatusDisplay;