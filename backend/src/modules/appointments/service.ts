// src/modules/appointments/service.ts
import { MedusaService, InjectManager, MedusaContext } from "@medusajs/framework/utils"
import { DAL, InferTypeOf, FindConfig, Context } from "@medusajs/framework/types"
import { Appointment, AppointmentState } from "./models/appointment"
import { Workshop } from "./models/workshop"

type AppointmentType = InferTypeOf<typeof Appointment>
type WorkshopType = InferTypeOf<typeof Workshop>

type InjectedDependencies = {
  appointmentRepository: DAL.RepositoryService<AppointmentType>
  workshopRepository: DAL.RepositoryService<WorkshopType>
}

interface TimeSlot {
  start: string
  end: string
}

interface OpeningHours {
  mon_fri: TimeSlot[]
  sat: TimeSlot[]
  sun: TimeSlot[]
}

export default class AppointmentsModuleService extends MedusaService({
  Appointment,
  Workshop,
}) {
  protected appointmentRepository_: DAL.RepositoryService<AppointmentType>
  protected workshopRepository_: DAL.RepositoryService<WorkshopType>

  constructor({ appointmentRepository, workshopRepository }: InjectedDependencies) {
    super(...arguments)
    this.appointmentRepository_ = appointmentRepository
    this.workshopRepository_ = workshopRepository
  }
  
  @InjectManager()
  async createAppointment(
    data: {
      customer_name: string
      customer_phone: string
      description?: string
      start_time: Date
      end_time: Date
      workshop_id: string
    },
    @MedusaContext() sharedContext?: Context
  ): Promise<AppointmentType> {
    console.log("🔍 createAppointment called with data:", data);
    console.log("🔍 sharedContext:", sharedContext);
    
    const workshop = await this.retrieveWorkshop(data.workshop_id, {}, sharedContext)
    
    if (!workshop) {
      throw new Error(`Workshop with id ${data.workshop_id} not found`)
    }

    if (data.start_time >= data.end_time) {
      throw new Error("Start time must be before end time")
    }

    const isAvailable = await this.isTimeSlotAvailable(
      data.workshop_id,
      data.start_time,
      data.end_time,
      sharedContext
    )

    if (!isAvailable) {
      throw new Error("Time slot is not available")
    }
    
    console.log("🔍 About to create appointment with repository...");
    
    const [appointment] = await this.appointmentRepository_.create([
      { 
        ...data,
        state: AppointmentState.PENDING 
      },
    ], sharedContext)
    
    console.log("🔍 Appointment created by repository:", appointment);
    
    try {
      const verifyAppointment = await this.appointmentRepository_.find({
        where: { id: appointment.id }
      }, sharedContext);
      console.log("🔍 Verification - appointments found:", verifyAppointment.length);
      console.log("🔍 Verification - appointment data:", verifyAppointment[0]);
    } catch (verifyError) {
      console.error("🔍 Error verifying appointment:", verifyError);
    }
    
    return appointment
  }

  @InjectManager()
  async confirmAppointment(
    id: string,
    @MedusaContext() sharedContext?: Context
  ): Promise<AppointmentType> {
    console.log("✅ confirmAppointment called for ID:", id);
    
    console.log("🔍 Buscando la cita con ID:", id);
    
    // SOLUCIÓN: Recuperar la entidad completa, no usar retrieveAppointment que puede devolver un objeto plano
    const appointments = await this.appointmentRepository_.find({
      where: { id }
    }, sharedContext)
    
    if (!appointments || appointments.length === 0) {
      console.error("❌ Appointment not found in repository");
      throw new Error(`Appointment with id ${id} not found`)
    }

    const appointment = appointments[0]
    
    console.log("🔍 Appointment entity retrieved:", appointment);
    console.log("🔍 Appointment entity type:", typeof appointment);
    console.log("🔍 Appointment has __meta?:", !!(appointment as any).__meta);
    console.log("🔍 Appointment constructor:", appointment.constructor?.name);

    if (appointment.state === AppointmentState.CONFIRMED) {
      console.log("ℹ️ Appointment already confirmed");
      return appointment;
    }

    if (appointment.state === AppointmentState.CANCELED || appointment.state === AppointmentState.COMPLETED) {
      throw new Error(`Cannot confirm appointment with state: ${appointment.state}`)
    }

    console.log("🔍 About to update appointment entity...");
    console.log("🔍 Update data:", { state: AppointmentState.CONFIRMED, completed: false });

    try {
      // SOLUCIÓN: Usar la entidad completa del repository, no un objeto plano
      const [confirmedAppointment] = await this.appointmentRepository_.update([{
        entity: appointment, // Esta es la entidad completa con metadatos
        update: { 
          state: AppointmentState.CONFIRMED,
          completed: false
        },
      }], sharedContext)
      
      console.log("✅ Appointment confirmed successfully:", confirmedAppointment);
      return confirmedAppointment
    } catch (updateError) {
      console.error("❌ Error during update:", updateError);
      console.error("❌ Error stack:", updateError.stack);
      console.error("❌ Entity passed to update:", appointment);
      console.error("❌ Entity keys:", Object.keys(appointment));
      throw updateError;
    }
  }

  @InjectManager()
  async cancelAppointment(
    id: string,
    @MedusaContext() sharedContext?: Context
  ): Promise<AppointmentType> {
    console.log("❌ cancelAppointment called for ID:", id);
    
    console.log("🔍 Buscando la cita con ID:", id);
    
    // SOLUCIÓN: Usar el mismo patrón que confirmAppointment
    const appointments = await this.appointmentRepository_.find({
      where: { id }
    }, sharedContext)
    
    if (!appointments || appointments.length === 0) {
      console.error("❌ Appointment not found in repository");
      throw new Error(`Appointment with id ${id} not found`)
    }

    const appointment = appointments[0]
    
    console.log("🔍 Cita recuperada antes de la cancelación:", appointment);

    if (appointment.state === AppointmentState.CANCELED) {
      console.log("ℹ️ Appointment already canceled");
      return appointment;
    }

    if (appointment.state === AppointmentState.COMPLETED) {
      throw new Error(`Cannot cancel completed appointment`)
    }

    try {
      const [canceledAppointment] = await this.appointmentRepository_.update([{
        entity: appointment, // Entidad completa
        update: { 
          state: AppointmentState.CANCELED,
          completed: false
        },
      }], sharedContext)
      
      console.log("❌ Appointment canceled:", canceledAppointment);
      return canceledAppointment
    } catch (updateError) {
      console.error("❌ Error during cancel:", updateError);
      throw updateError;
    }
  }

  @InjectManager()
  async updateAppointment(
    id: string,
    data: Partial<AppointmentType>,
    @MedusaContext() sharedContext?: Context
  ): Promise<AppointmentType> {
    console.log("🔧 updateAppointment called for ID:", id, "with data:", data);
    
    // SOLUCIÓN: Usar el mismo patrón
    const appointments = await this.appointmentRepository_.find({
      where: { id }
    }, sharedContext)
    
    if (!appointments || appointments.length === 0) {
      throw new Error(`Appointment with id ${id} not found`)
    }

    const appointment = appointments[0]

    const newStartTime = data.start_time || appointment.start_time
    const newEndTime = data.end_time || appointment.end_time

    if (newStartTime >= newEndTime) {
      throw new Error("Start time must be before end time")
    }

    if (data.start_time || data.end_time) {
      const isAvailable = await this.isTimeSlotAvailable(
        appointment.workshop_id,
        newStartTime,
        newEndTime,
        sharedContext,
        id
      )

      if (!isAvailable) {
        throw new Error("New time slot is not available")
      }
    }
    
    try {
      const [updatedAppointment] = await this.appointmentRepository_.update([{
        entity: appointment, // Entidad completa
        update: data,
      }], sharedContext)
      
      console.log("🔧 Appointment updated:", updatedAppointment);
      return updatedAppointment
    } catch (updateError) {
      console.error("❌ Error during update:", updateError);
      throw updateError;
    }
  }

  @InjectManager()
  async deleteAppointment(
    id: string,
    @MedusaContext() sharedContext?: Context
  ): Promise<void> {
    console.log("🗑️ deleteAppointment called for ID:", id);
    
    const appointments = await this.appointmentRepository_.find({
      where: { id }
    }, sharedContext)
    
    if (!appointments || appointments.length === 0) {
      throw new Error(`Appointment with id ${id} not found`)
    }

    await this.appointmentRepository_.delete({ id }, sharedContext)
    console.log("🗑️ Appointment deleted successfully");
  }

  @InjectManager()
  async list(
    filters: { 
      workshop_id?: string; 
      date?: Date; 
      state?: string;
      state_in?: string[]; 
      customer_phone?: string; 
    } = {},
    config?: FindConfig<AppointmentType>,
    @MedusaContext() sharedContext?: Context
  ): Promise<AppointmentType[]> {
    console.log("🔍 list method called with:");
    console.log("  - filters:", filters);
    console.log("  - config:", config);
    console.log("  - sharedContext:", sharedContext);
    
    const where: any = {}
    
    if (filters.workshop_id) {
      where.workshop_id = filters.workshop_id
    }

    if (filters.state) {
      where.state = filters.state
    }

    if (filters.state_in && filters.state_in.length > 0) {
      where.state = { $in: filters.state_in }
    }

    if (filters.customer_phone) {
      const phone = filters.customer_phone.replace("whatsapp:", "");
      where.$or = [
        { customer_phone: filters.customer_phone },
        { customer_phone: phone },
        { customer_phone: `whatsapp:${phone}` }
      ];
    }
    
    if (filters.date) {
      const startOfDay = new Date(filters.date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(filters.date)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.start_time = { $gte: startOfDay, $lte: endOfDay }
    }

    console.log("🔍 Final where clause:", where);
    
    const result = await this.appointmentRepository_.find({
      where,
      relations: ["workshop"],
      ...config
    }, sharedContext)
    
    console.log("🔍 Repository returned:", result.length, "appointments");
    console.log("🔍 Repository result:", result);
    
    return result
  }

  @InjectManager()
  async getAvailableTimeSlots(
    workshopId: string,
    date: Date,
    @MedusaContext() sharedContext?: Context
  ): Promise<string[]> {
    console.log("⏰ getAvailableTimeSlots called for workshop:", workshopId, "date:", date);
    
    const workshop = await this.retrieveWorkshop(workshopId, {}, sharedContext);

    if (!workshop) {
      throw new Error(`Workshop with id ${workshopId} not found`);
    }

    const utcDate = new Date(date.toISOString().split('T')[0] + 'T00:00:00Z');
    
    const existingAppointments = await this.list({ 
      workshop_id: workshopId, 
      date: utcDate,
      state: AppointmentState.CONFIRMED 
    }, {}, sharedContext);
    
    console.log("⏰ Found", existingAppointments.length, "confirmed appointments for date");
    
    const openingHours = (workshop.opening_hours as unknown) as OpeningHours;
    
    if (!openingHours || typeof openingHours !== 'object') {
      throw new Error(`Invalid opening hours format for workshop ${workshopId}`);
    }

    const dayOfWeek = utcDate.getUTCDay();
    let timeRanges: TimeSlot[] = [];

    if (dayOfWeek === 0) { 
      timeRanges = openingHours.sun || [];
    } else if (dayOfWeek === 6) { 
      timeRanges = openingHours.sat || [];
    } else { 
      timeRanges = openingHours.mon_fri || [];
    }

    console.log("⏰ Time ranges for day", dayOfWeek, ":", timeRanges);

    const allPossibleSlots: string[] = [];
    const slotDurationMinutes = 30; 

    for (const range of timeRanges) {
      if (!range.start || !range.end) continue;

      const [startHour, startMinute] = range.start.split(':').map(Number);
      const [endHour, endMinute] = range.end.split(':').map(Number);

      let current = new Date(date);
      current.setHours(startHour, startMinute, 0, 0);

      let end = new Date(date);
      end.setHours(endHour, endMinute, 0, 0);

      while (current.getTime() < end.getTime()) {
        const formattedTime = `${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`;
        allPossibleSlots.push(formattedTime);
        current.setMinutes(current.getMinutes() + slotDurationMinutes);
      }
    }

    console.log("⏰ All possible slots:", allPossibleSlots);

    const bookedSlots = new Set<string>();
    for (const appointment of existingAppointments) {
      const aptStart = new Date(appointment.start_time);
      const aptEnd = new Date(appointment.end_time);

      let currentAptTime = new Date(aptStart);
      while(currentAptTime.getTime() < aptEnd.getTime()){
        const bookedTime = `${String(currentAptTime.getHours()).padStart(2, '0')}:${String(currentAptTime.getMinutes()).padStart(2, '0')}`;
        bookedSlots.add(bookedTime);
        currentAptTime.setMinutes(currentAptTime.getMinutes() + slotDurationMinutes);
      }
    }

    console.log("⏰ Booked slots:", Array.from(bookedSlots));

    const availableSlots = allPossibleSlots.filter(slot => !bookedSlots.has(slot));
    console.log("⏰ Available slots:", availableSlots);

    return availableSlots;
  }

  @InjectManager()
  async isTimeSlotAvailable(
    workshopId: string,
    startTime: Date,
    endTime: Date,
    @MedusaContext() sharedContext?: Context,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    console.log("🔍 Checking time slot availability:");
    console.log("  - Workshop:", workshopId);
    console.log("  - Start:", startTime);
    console.log("  - End:", endTime);
    console.log("  - Exclude:", excludeAppointmentId);

    const whereClause: any = {
      workshop_id: workshopId,
      state: AppointmentState.CONFIRMED, 
      $or: [
        {
          start_time: { $lt: endTime },
          end_time: { $gt: startTime }
        }
      ]
    }

    if (excludeAppointmentId) {
      whereClause.id = { $ne: excludeAppointmentId }
    }

    console.log("🔍 Where clause for availability check:", whereClause);

    const conflictingAppointments = await this.appointmentRepository_.find(
      { where: whereClause },
      sharedContext
    )

    console.log("🔍 Found", conflictingAppointments.length, "conflicting appointments");
    
    if (conflictingAppointments.length > 0) {
      console.log("🔍 Conflicting appointments:", conflictingAppointments);
    }

    return conflictingAppointments.length === 0
  }

  // Método auxiliar para debug - puedes llamarlo cuando necesites verificar el estado
  @InjectManager()
  async debugAppointment(
    id: string,
    @MedusaContext() sharedContext?: Context
  ): Promise<void> {
    console.log("🐛 DEBUG: Investigating appointment", id);
    
    try {
      // Método 1: usando find directo
      const directFind = await this.appointmentRepository_.find({
        where: { id }
      }, sharedContext);
      console.log("🐛 Direct find result:", directFind);
      
      if (directFind.length > 0) {
        const entity = directFind[0];
        console.log("🐛 Entity type:", typeof entity);
        console.log("🐛 Entity constructor:", entity.constructor?.name);
        console.log("🐛 Has __meta?:", !!(entity as any).__meta);
        console.log("🐛 Entity keys:", Object.keys(entity));
        console.log("🐛 Entity prototype:", Object.getPrototypeOf(entity));
      }

      // Método 2: usando retrieveAppointment si existe
      try {
        const retrievedAppointment = await this.retrieveAppointment(id, {}, sharedContext);
        console.log("🐛 Retrieved appointment:", retrievedAppointment);
        console.log("🐛 Retrieved type:", typeof retrievedAppointment);
        console.log("🐛 Retrieved has __meta?:", !!(retrievedAppointment as any).__meta);
      } catch (e) {
        console.log("🐛 Error with retrieveAppointment:", e.message);
      }

    } catch (error) {
      console.error("🐛 Debug error:", error);
    }
  }
}