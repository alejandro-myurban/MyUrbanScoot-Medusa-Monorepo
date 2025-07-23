"use client";

import CTACards from "@/modules/common/components/faq/cta-cards";
import FAQsSection from "@/modules/common/components/faq/faq-section";
import HeroSection from "@/modules/common/components/faq/hero-section";
import SidebarFAQ from "@/modules/common/components/faq/side-bar";

import React, { useState } from "react";

// Ahora los objetos tienen nombre y cantidad
const categories = [
  { name: "General", count: 3 },
  { name: "Pedidos", count: 5 },
  { name: "Envíos", count: 4 },
  { name: "Devoluciones", count: 2 },
  { name: "Garantía", count: 1 },
  { name: "Patinetes", count: 6 },
  { name: "Accesorios", count: 3 },
];

const popularQuestions = [
  { id: "p1", question: "¿Cómo se cancela un pedido?" },
  { id: "p2", question: "¿Cómo se consigue un reembolso?" },
  { id: "p3", question: "¿Cómo contactar con MYURBANSCOOT?" },
];

export default function HelpCenterPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen max-w-screen-large mx-auto px-6 bg-white text-gray-800 font-inter">
      <HeroSection searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <CTACards />
      <div className="container mx-auto py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <SidebarFAQ categories={categories} popularQuestions={popularQuestions} />
        <FAQsSection searchTerm={searchTerm} />
      </div>
    </div>
  );
}
