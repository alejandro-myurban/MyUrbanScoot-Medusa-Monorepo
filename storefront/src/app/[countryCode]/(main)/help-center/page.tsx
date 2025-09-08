"use client";

import CTACards from "@/modules/common/components/faq/cta-cards";
import FAQsSection from "@/modules/common/components/faq/faq-section";
import HeroSection from "@/modules/common/components/faq/hero-section";
import SidebarFAQ from "@/modules/common/components/faq/side-bar";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function HelpCenterPage() {
  const t = useTranslation().t;
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { name: t("faqs.categories.general"), count: 3 },
    { name: t("faqs.categories.orders"), count: 5 },
    { name: t("faqs.categories.shipping"), count: 4 },
    { name: t("faqs.categories.returns"), count: 2 },
    { name: t("faqs.categories.warranty"), count: 1 },
    { name: t("faqs.categories.scooters"), count: 6 },
    { name: t("faqs.categories.accessories"), count: 3 },
  ];

  const popularQuestions = [
    { id: "p1", question: t("faqs.questions.cancel_order") },
    { id: "p2", question: t("faqs.questions.get_refund") },
    { id: "p3", question: t("faqs.questions.contact") },
  ];

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
