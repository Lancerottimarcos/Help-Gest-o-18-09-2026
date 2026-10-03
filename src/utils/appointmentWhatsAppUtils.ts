import { AgencyAppointment } from '../types';
import { formatWhatsAppCleanDigits } from './notificationSettings';

/**
 * Builds a friendly, professional Portuguese WhatsApp message for an online meeting with Google Meet
 */
export function buildAppointmentWhatsAppMessage(
  appointment: AgencyAppointment,
  clientName?: string
): string {
  const dateFormatted = appointment.startDate
    ? new Date(`${appointment.startDate}T12:00:00`).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : appointment.startDate;

  const greeting = clientName ? `Olá, *${clientName}*! Tudo bem? 👋` : 'Olá! Tudo bem? 👋';
  const meetUrl = appointment.meetLink || 'https://meet.google.com/new';

  let msg = `${greeting}

Agendamos a nossa reunião online com a equipe da *Help Ideias Digitais* 🚀

📌 *Assunto:* ${appointment.title}
📅 *Data:* ${dateFormatted}
⏰ *Horário:* ${appointment.startTime} às ${appointment.endTime}
🎥 *Link da Videoconferência (Google Meet):*
${meetUrl}`;

  if (appointment.description && appointment.description.trim()) {
    msg += `\n\n📝 *Pauta:* \n${appointment.description.trim()}`;
  }

  msg += `\n\nCaso precise reagendar ou tenha alguma dúvida, é só nos responder por aqui.\nAté lá! ✨`;

  return msg;
}

/**
 * Returns the deep-link URL to send via WhatsApp Web / App
 */
export function getAppointmentWhatsAppUrl(
  appointment: AgencyAppointment,
  phone: string,
  clientName?: string
): string {
  const cleanDigits = formatWhatsAppCleanDigits(phone);
  const message = buildAppointmentWhatsAppMessage(appointment, clientName);
  const encoded = encodeURIComponent(message);
  return cleanDigits
    ? `https://api.whatsapp.com/send?phone=${cleanDigits}&text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;
}

/**
 * Opens WhatsApp in a new tab with the pre-filled appointment details and Google Meet link
 */
export function openAppointmentWhatsApp(
  appointment: AgencyAppointment,
  phone: string,
  clientName?: string
): boolean {
  try {
    const url = getAppointmentWhatsAppUrl(appointment, phone, clientName);
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  } catch (err) {
    console.error('Failed to open WhatsApp window:', err);
    return false;
  }
}
