"use client";

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQsSectionProps {
  searchTerm: string;
}

const FAQsSection: React.FC<FAQsSectionProps> = ({ searchTerm }) => {
  const { t } = useTranslation();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const contentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  const faqCountMessage = t("faqs.resultsCount", { count: filteredFaqs.length });

  return (
    <div className="lg:col-span-3 space-y-6">
      <h2 className="text-2xl font-bold font-archivoBlack uppercase text-gray-800 mb-6">
        {t("faqs.title")}
        <span className="block text-base font-normal text-gray-600">
          {loading ? t("faqs.loading") : faqCountMessage}
        </span>
      </h2>

      {loading ? (
        <div className="text-center text-gray-600 py-10">{t("faqs.loadingMessage")}</div>
      ) : error ? (
        <div className="text-center text-red-600 py-10">{t("faqs.error", { message: error })}</div>
      ) : filteredFaqs.length === 0 ? (
        <div className="text-center text-gray-600 py-10">
          {t("faqs.noResults")}
        </div>
      ) : (
        filteredFaqs.map((faq) => (
          <div
            key={faq.id}
            className="bg-white rounded-xl shadow-lg border font-archivo border-gray-200 overflow-hidden transform transition-all duration-300 hover:shadow-xl"
          >
            <button
              className="flex justify-between items-center w-full p-6 text-left text-lg font-semibold text-gray-800 focus:outline-none hover:bg-gray-50 transition-colors duration-200"
              onClick={() => toggleFAQ(faq.id)}
            >
              {faq.question}
              <FontAwesomeIcon
                icon={openFAQ === faq.id ? faChevronUp : faChevronDown}
                className={`text-gray-600 ml-4 transform transition-transform duration-300 ${
                  openFAQ === faq.id ? 'rotate-180' : 'rotate-0'
                }`}
              />
            </button>
            
            <div
              ref={(el) => {
                contentRefs.current[faq.id] = el;
              }}
              className="overflow-hidden transition-all duration-500 ease-in-out"
              style={{
                maxHeight: openFAQ === faq.id 
                  ? contentRefs.current[faq.id]?.scrollHeight + 'px' 
                  : '0px',
                opacity: openFAQ === faq.id ? 1 : 0,
              }}
            >
              <div className="px-6 pb-6 text-gray-700">
                <div className="pt-2 border-t border-gray-100">
                  <p className="leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FAQsSection;