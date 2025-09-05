"use client"

import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationDot,
  faPhone,
  faEnvelope,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import i18n from "@/i18n/config"

const ContactInfoSection: React.FC = () => {
  return (
    <div className="lg:bg-gray-50 lg:p-6 sm:p-8 rounded-2xl lg:shadow-md lg:border border-gray-200 space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold font-archivoBlack text-gray-800 mb-6">
        {i18n.t("contact_info.title")} {/* Título traducido */}
      </h2>
      <div className="space-y-4">
        {/* Address */}
        <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border font-archivo border-gray-100">
          <div className="flex-shrink-0 w-10 h-10 bg-mysGreen-100 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faLocationDot} className="w-6 h-6 text-gray-800" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{i18n.t("contact_info.address_label")}</p> {/* Texto traducido */}
            <p className="text-gray-600">28001 Valencia, España</p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border font-archivo border-gray-100">
          <div className="flex-shrink-0 w-10 h-10 bg-mysGreen-100 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faPhone} className="w-6 h-6 text-gray-800" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{i18n.t("contact_info.phone_label")}</p> {/* Texto traducido */}
            <p className="text-gray-600">+21321415213</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border font-archivo border-gray-100">
          <div className="flex-shrink-0 w-10 h-10 bg-mysGreen-100 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faEnvelope} className="w-6 h-6 text-gray-800" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{i18n.t("contact_info.email_label")}</p> {/* Texto traducido */}
            <p className="text-gray-600">info@myurbanscoot.com</p>
          </div>
        </div>

        {/* Hours */}
        <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border font-archivo border-gray-100">
          <div className="flex-shrink-0 w-10 h-10 bg-mysGreen-100 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faClock} className="w-6 h-6 text-gray-800" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{i18n.t("contact_info.hours_label")}</p> {/* Texto traducido */}
            <p className="text-gray-600">Lun - Vie: 9:00 - 18:00</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoSection;
