"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQsSectionProps {
  searchTerm: string;
}

const FAQsSection: React.FC<FAQsSectionProps> = ({ searchTerm }) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const generatedFaqs: FAQItem[] = Array.from({ length: 10 }).map((_, i) => ({
          id: `faq-${i + 1}`,
          question: `Pregunta frecuente ${i + 1}: ¿Cómo funciona ${Math.random().toString(36).substring(7)}?`,
          answer: `Esta es la respuesta a la pregunta frecuente número ${i + 1}. Aquí se explica cómo funciona ${Math.random().toString(36).substring(7)}. Es una respuesta un poco más larga para demostrar el contenido.`,
        }));

        // 🔴 Esta línea era la responsable del error aleatorio. La eliminamos:
        // if (Math.random() < 0.1) {
        //   throw new Error("Error simulado al cargar las preguntas frecuentes.");
        // }

        setFaqs(generatedFaqs);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="lg:col-span-3 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Todas las preguntas
        <span className="block text-base font-normal text-gray-600">
          {loading ? "Cargando..." : `${filteredFaqs.length} preguntas encontradas`}
        </span>
      </h2>

      {loading ? (
        <div className="text-center text-gray-600 py-10">Cargando preguntas frecuentes...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-10">Error: {error}</div>
      ) : filteredFaqs.length === 0 ? (
        <div className="text-center text-gray-600 py-10">
          No se encontraron preguntas para tu búsqueda.
        </div>
      ) : (
        filteredFaqs.map((faq) => (
          <div
            key={faq.id}
            className="bg-white rounded-xl shadow-lg border border-gray-200"
          >
            <button
              className="flex justify-between items-center w-full p-6 text-left text-lg font-semibold text-gray-800 focus:outline-none"
              onClick={() => toggleFAQ(faq.id)}
            >
              {faq.question}
              <FontAwesomeIcon
                icon={openFAQ === faq.id ? faChevronUp : faChevronDown}
                className="text-gray-600 ml-4"
              />
            </button>
            <div
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${openFAQ === faq.id ? 'max-h-screen px-6 pb-6' : 'max-h-0 px-6'}
                text-gray-700
              `}
            >
              <p>{faq.answer}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FAQsSection;
