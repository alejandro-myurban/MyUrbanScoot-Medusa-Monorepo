'use client';

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Workshop } from "../types/types";

const API_URL = "https://backend-production-9e9f.up.railway.app";

/**
 * Hook personalizado para manejar toda la lógica de la página de citas.
 * Encapsula estados, efectos y funciones de negocio.
 */
export const useAppointments = () => {
  // Estados para los datos del formulario y la selección
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [description, setDescription] = useState("");
  const [honeypot, setHoneypot] = useState("");

  // Estados para la carga y errores de la UI
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [workshopsLoading, setWorkshopsLoading] = useState(false);
  const [workshopsError, setWorkshopsError] = useState<string | null>(null);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Estados para errores de validación
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [workshopError, setWorkshopError] = useState<string | null>(null);

  // Fechas para el control de la entrada de fecha
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = format(tomorrow, "yyyy-MM-dd");

  // Función para filtrar horarios pasados si es el día actual
  const filterPastSlots = (slots: string[], selectedDate: string): string[] => {
    const today = new Date();
    const selectedDateObj = new Date(selectedDate);
    
    // Si la fecha seleccionada es hoy, filtrar horarios pasados
    if (selectedDateObj.toDateString() === today.toDateString()) {
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      
      return slots.filter(slot => {
        const [hour, minute] = slot.split(':').map(Number);
        const slotTimeInMinutes = hour * 60 + minute;
        // Agregar un buffer de 30 minutos para evitar citas muy cercanas
        return slotTimeInMinutes > (currentTimeInMinutes + 30);
      });
    }
    
    return slots;
  };

  // Función para formatear número de teléfono español
  const formatPhoneNumber = (phone: string): string => {
    // Remover espacios y caracteres especiales excepto +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Si tiene 9 dígitos y no empieza con +, agregar +34
    if (cleaned.length === 9 && /^[6-9]/.test(cleaned)) {
      return `+34${cleaned}`;
    }
    
    // Si ya tiene +34 o otro código, mantenerlo
    return phone.trim();
  };

  // Efecto para cargar la lista de talleres al montar el componente
  useEffect(() => {
    const fetchWorkshops = async () => {
      setWorkshopsLoading(true);
      setWorkshopsError(null);
      try {
        const response = await fetch(`${API_URL}/workshops`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setWorkshops(data.workshops || []);
      } catch (err) {
        setWorkshopsError(
          "Error al cargar los talleres. Por favor, intenta nuevamente."
        );
        console.error("Error fetching workshops:", err);
      } finally {
        setWorkshopsLoading(false);
      }
    };
    fetchWorkshops();
  }, []);

  // Efecto para cargar los horarios disponibles cuando se selecciona un taller y una fecha
  useEffect(() => {
    if (!selectedWorkshopId || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const response = await fetch(
          `${API_URL}/workshops/${selectedWorkshopId}/slots?date=${selectedDate}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const slots = data.availableSlots || [];
        // Filtrar horarios pasados si es necesario
        const filteredSlots = filterPastSlots(slots, selectedDate);
        setAvailableSlots(filteredSlots);
      } catch (err) {
        setSlotsError(
          "Error al cargar los horarios disponibles. Por favor, intenta nuevamente."
        );
        console.error("Error fetching slots:", err);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedWorkshopId, selectedDate]);

  // Función de validación del formulario
  const validateFields = () => {
    let isValid = true;
    setSubmitError(null);
    setNameError(null);
    setPhoneError(null);
    setWorkshopError(null);
    setDateError(null);
    setSlotError(null);

    if (!selectedWorkshopId) {
      setWorkshopError("Por favor, selecciona un taller.");
      isValid = false;
    }

    if (!selectedDate) {
      setDateError("Por favor, selecciona una fecha.");
      isValid = false;
    }

    if (!selectedSlot) {
      setSlotError("Por favor, selecciona un horario disponible.");
      isValid = false;
    }

    if (!customerName.trim()) {
      setNameError("El nombre es un campo obligatorio.");
      isValid = false;
    }

    const phoneRegex = /^\+?[0-9\s()+-]+$/;
    if (!customerPhone.trim() || !phoneRegex.test(customerPhone.trim())) {
      setPhoneError("Ingresa un número de teléfono válido.");
      isValid = false;
    }

    return isValid;
  };

  // Manejador del envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) {
      console.log("Honeypot field was filled. This is likely a bot.");
      return;
    }

    if (!validateFields()) {
      setSubmitError("Por favor, corrige los campos marcados antes de continuar.");
      setSubmitSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const [hour, minute] = selectedSlot.split(":").map(Number);
      const [year, month, day] = selectedDate.split("-").map(Number);
      const start_time = new Date(year, month - 1, day, hour, minute);
      const end_time = new Date(start_time);
      end_time.setMinutes(start_time.getMinutes() + 30);

      // Formatear el teléfono antes de enviarlo
      const formattedPhone = formatPhoneNumber(customerPhone);

      const appointmentData = {
        customer_name: customerName.trim(),
        customer_phone: formattedPhone,
        description: description.trim() || "Cita agendada",
        start_time,
        end_time,
        workshop_id: selectedWorkshopId,
      };

      const response = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      // Redirigir a página de éxito con los datos de la cita
      const appointmentInfo = {
        customerName: customerName.trim(),
        customerPhone: formattedPhone,
        workshopName: selectedWorkshop?.name || '',
        workshopAddress: selectedWorkshop?.address || '',
        workshopPhone: selectedWorkshop?.phone || '',
        date: formattedDate,
        time: selectedSlot,
        description: description.trim() || "Cita agendada"
      };

      // Guardar en sessionStorage para la página de éxito
      sessionStorage.setItem('appointmentInfo', JSON.stringify(appointmentInfo));
      
      // Redirigir a página de éxito
      window.location.href = '/appointments/succes';

    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error desconocido al reservar la cita.";
      setSubmitError(errorMessage);
      console.error("Error al reservar la cita:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejadores de cambios en los campos
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerName(e.target.value);
    if (e.target.value.trim()) {
      setNameError(null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Permitir solo números, espacios, +, (, ), -
    const phoneRegex = /^[\d\s()+-]*$/;
    if (value && !phoneRegex.test(value)) {
      return; // No actualizar si contiene caracteres inválidos
    }
    
    setCustomerPhone(value);
    
    // Limpiar error si el teléfono parece válido
    if (value.trim()) {
      const cleaned = value.replace(/[^\d+]/g, '');
      if (cleaned.length >= 9 || cleaned.startsWith('+')) {
        setPhoneError(null);
      }
    }
  };

  const handleWorkshopChange = (value: string) => {
    setSelectedWorkshopId(value);
    setSelectedDate("");
    setSelectedSlot("");
    setAvailableSlots([]);
    setWorkshopError(null);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setSelectedSlot("");
    setDateError(null);
  };

  const handleSlotChange = (slot: string) => {
    setSelectedSlot(slot);
    setSlotError(null);
  };

  // Datos para la UI
  const selectedWorkshop = workshops.find((w: Workshop) => w.id === selectedWorkshopId);
  const formattedDate = selectedDate.split("-").reverse().join("/");

  return {
    // Estados
    selectedWorkshopId,
    selectedDate,
    selectedSlot,
    customerName,
    customerPhone,
    description,
    honeypot,
    workshops,
    workshopsLoading,
    workshopsError,
    availableSlots,
    slotsLoading,
    slotsError,
    isSubmitting,
    submitError,
    submitSuccess,
    nameError,
    phoneError,
    dateError,
    slotError,
    workshopError,
    tomorrowFormatted,

    // Manejadores
    setHoneypot,
    handleNameChange,
    handlePhoneChange,
    handleWorkshopChange,
    handleDateChange,
    handleSlotChange,
    handleSubmit,
    setDescription,

    // Datos derivados
    selectedWorkshop,
    formattedDate,
  };
};