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
    const appointment = await this.retrieveAppointment(id, {}, sharedContext)
    
    if (!appointment) {
      throw new Error(`Appointment with id ${id} not found`)
    }

    console.log("🔍 Cita recuperada antes de la actualización:", appointment);

    if (appointment.state === AppointmentState.CONFIRMED) {
      console.log("ℹ️ Appointment already confirmed");
      return appointment;
    }

    if (appointment.state === AppointmentState.CANCELED || appointment.state === AppointmentState.COMPLETED) {
      throw new Error(`Cannot confirm appointment with state: ${appointment.state}`)
    }

    // 🚨 CORRECCIÓN DEFINITIVA: 
    // Ahora, en el `update`, el campo `entity` recibe la entidad COMPLETA,
    // y el campo `update` recibe solo las propiedades a modificar.
    const [confirmedAppointment] = await this.appointmentRepository_.update([{
      entity: appointment,
      update: { 
        state: AppointmentState.CONFIRMED,
        completed: false
      },
    }], sharedContext)
    
    console.log("✅ Appointment confirmed:", confirmedAppointment);
    return confirmedAppointment
  }

  @InjectManager()
  async cancelAppointment(
    id: string,
    @MedusaContext() sharedContext?: Context
  ): Promise<AppointmentType> {
    console.log("❌ cancelAppointment called for ID:", id);
    
    console.log("🔍 Buscando la cita con ID:", id);
    const appointment = await this.retrieveAppointment(id, {}, sharedContext)
    
    if (!appointment) {
      throw new Error(`Appointment with id ${id} not found`)
    }

    console.log("🔍 Cita recuperada antes de la cancelación:", appointment);

    if (appointment.state === AppointmentState.CANCELED) {
      console.log("ℹ️ Appointment already canceled");
      return appointment;
    }

    if (appointment.state === AppointmentState.COMPLETED) {
      throw new Error(`Cannot cancel completed appointment`)
    }

    // 🚨 CORRECCIÓN DEFINITIVA:
    // Al igual que en `confirmAppointment`, pasamos la entidad completa.
    const [canceledAppointment] = await this.appointmentRepository_.update([{
      entity: appointment,
      update: { 
        state: AppointmentState.CANCELED,
        completed: false
      },
    }], sharedContext)
    
    console.log("❌ Appointment canceled:", canceledAppointment);
    return canceledAppointment
  }

  @InjectManager()
  async updateAppointment(
    id: string,
    data: Partial<AppointmentType>,
    @MedusaContext() sharedContext?: Context
  ): Promise<AppointmentType> {
    const appointment = await this.retrieveAppointment(id, {}, sharedContext)
    
    if (!appointment) {
      throw new Error(`Appointment with id ${id} not found`)
    }

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
    
    const [updatedAppointment] = await this.appointmentRepository_.update([{
      entity: { id },
      update: data,
    }], sharedContext)
    
    return updatedAppointment
  }

  @InjectManager()
  async deleteAppointment(
    id: string,
    @MedusaContext() sharedContext?: Context
  ): Promise<void> {
    const appointment = await this.retrieveAppointment(id, {}, sharedContext)
    
    if (!appointment) {
      throw new Error(`Appointment with id ${id} not found`)
    }

    await this.appointmentRepository_.delete({ id }, sharedContext)
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
    console.log("  - filters:", filters);
    console.log("  - config:", config);
    console.log("  - sharedContext:", sharedContext);
    
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

    return allPossibleSlots.filter(slot => !bookedSlots.has(slot));
  }

  @InjectManager()
  async isTimeSlotAvailable(
    workshopId: string,
    startTime: Date,
    endTime: Date,
    @MedusaContext() sharedContext?: Context,
    excludeAppointmentId?: string
  ): Promise<boolean> {
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

    const conflictingAppointments = await this.appointmentRepository_.find(
      { where: whereClause },
      sharedContext
    )

    return conflictingAppointments.length === 0
  }
}