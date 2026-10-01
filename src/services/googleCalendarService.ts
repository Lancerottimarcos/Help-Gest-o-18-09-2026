import { AgencyAppointment, AppointmentCategory, Client } from '../types';
import { getGoogleCalendarAccessToken } from './googleCalendarAuth';

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const LOCAL_STORAGE_KEY = 'agency_appointments_cache_v1';
const DELETED_IDS_STORAGE_KEY = 'agency_deleted_appointment_ids_v1';

export interface GoogleCalendarApiEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  htmlLink?: string;
  hangoutLink?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'accepted' | 'declined' | 'tentative';
    self?: boolean;
  }>;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
    conferenceSolution?: {
      name?: string;
    };
  };
}

export interface CreateAppointmentInput {
  title: string;
  category: AppointmentCategory;
  clientId?: string;
  clientName?: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string;   // YYYY-MM-DD
  endTime: string;   // HH:mm
  addGoogleMeet?: boolean;
  location?: string;
  attendeesEmails?: string[];
}

/**
 * Initial sample appointments for digital agency operations
 */
export const INITIAL_AGENCY_APPOINTMENTS: AgencyAppointment[] = [
  {
    id: 'apt-sample-1',
    title: 'Apresentação de Métricas & Tráfego Pago',
    category: 'trafego',
    clientId: 'client-1',
    clientName: 'Apolar Imóveis',
    description: 'Apresentação dos resultados de conversão das campanhas de Meta Ads e Google Ads do mês anterior. Análise de CPL e ROI.',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '11:00',
    meetLink: 'https://meet.google.com/hel-pide-ias',
    location: 'Google Meet',
    attendees: [
      { email: 'marcos@helpideias.com.br', name: 'Marcos Lancerotti', responseStatus: 'accepted' },
      { email: 'diretoria@apolar.com.br', name: 'Diretoria Apolar', responseStatus: 'accepted' }
    ],
    status: 'confirmed',
    syncedWithGoogle: false,
  },
  {
    id: 'apt-sample-2',
    title: 'Briefing de Novo Site Institucional',
    category: 'briefing',
    clientId: 'client-2',
    clientName: 'Dr. Marcelo Clínica',
    description: 'Coleta de requisitos para novo site médico em WordPress com foco em captação e SEO local.',
    startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '14:30',
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    endTime: '15:30',
    meetLink: 'https://meet.google.com/doc-clin-ica',
    location: 'Google Meet',
    attendees: [
      { email: 'contato@drmarcelo.com.br', name: 'Dr. Marcelo', responseStatus: 'needsAction' }
    ],
    status: 'confirmed',
    syncedWithGoogle: false,
  },
  {
    id: 'apt-sample-3',
    title: 'Alinhamento Semanal da Equipe de Criação',
    category: 'sprint_interna',
    description: 'Sprint planning da agência: revisão de prazos das demandas no Kanban, prioridades da semana e novos criativos.',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '16:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '17:00',
    location: 'Sala de Reuniões Principal • Help Agência',
    attendees: [
      { email: 'equipe@helpideias.com.br', name: 'Time Help Ideias', responseStatus: 'accepted' }
    ],
    status: 'confirmed',
    syncedWithGoogle: false,
  },
];

/**
 * Loads persistent set of deleted appointment IDs (tombstones)
 */
export function getDeletedAppointmentIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter(Boolean));
      }
    }
  } catch (err) {
    console.warn('Failed to parse deleted appointments cache:', err);
  }
  return new Set<string>();
}

/**
 * Marks appointment IDs as permanently deleted
 */
export function markAppointmentAsDeleted(appointmentId: string, googleEventId?: string): void {
  const current = getDeletedAppointmentIds();
  if (appointmentId) {
    current.add(appointmentId);
    if (appointmentId.startsWith('gcal-')) {
      current.add(appointmentId.replace('gcal-', ''));
    }
  }
  if (googleEventId) {
    current.add(googleEventId);
    current.add(`gcal-${googleEventId}`);
  }

  try {
    localStorage.setItem(DELETED_IDS_STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn('Failed to save deleted appointment IDs:', err);
  }
}

/**
 * Loads appointments cached locally
 */
export function getLocalAppointments(): AgencyAppointment[] {
  const deletedIds = getDeletedAppointmentIds();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Return stored items, strictly filtering out any deleted or cancelled ones
        return parsed.filter((a: AgencyAppointment) => {
          if (!a || a.status === 'cancelled') return false;
          if (a.id && deletedIds.has(a.id)) return false;
          if (a.googleEventId && deletedIds.has(a.googleEventId)) return false;
          return true;
        });
      }
    }
  } catch (err) {
    console.warn('Failed to parse local appointments cache:', err);
  }

  // First time initial seed: filter out any that might have been marked deleted
  const initial = INITIAL_AGENCY_APPOINTMENTS.filter((a) => {
    if (deletedIds.has(a.id)) return false;
    if (a.googleEventId && deletedIds.has(a.googleEventId)) return false;
    return true;
  });
  saveLocalAppointments(initial);
  return initial;
}

/**
 * Saves appointments to local cache
 */
export function saveLocalAppointments(appointments: AgencyAppointment[]): void {
  const deletedIds = getDeletedAppointmentIds();
  const clean = (appointments || []).filter((a) => {
    if (!a || a.status === 'cancelled') return false;
    if (a.id && deletedIds.has(a.id)) return false;
    if (a.googleEventId && deletedIds.has(a.googleEventId)) return false;
    return true;
  });

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clean));
  } catch (err) {
    console.warn('Failed to save local appointments cache:', err);
  }
}

/**
 * Determines an appointment category based on summary/description
 */
function inferCategory(summary?: string, description?: string): AppointmentCategory {
  const text = `${summary || ''} ${description || ''}`.toLowerCase();
  if (text.includes('briefing') || text.includes('onboarding')) return 'briefing';
  if (text.includes('apresenta') || text.includes('métrica') || text.includes('relatório')) return 'apresentacao';
  if (text.includes('tráfego') || text.includes('ads') || text.includes('meta') || text.includes('google ads')) return 'trafego';
  if (text.includes('design') || text.includes('site') || text.includes('layout') || text.includes('logo')) return 'design_web';
  if (text.includes('comercial') || text.includes('proposta') || text.includes('venda')) return 'comercial';
  if (text.includes('daily') || text.includes('sprint') || text.includes('equipe') || text.includes('alinhamento')) return 'sprint_interna';
  return 'outro';
}

/**
 * Converts a Google Calendar API event into an AgencyAppointment
 */
export function mapGoogleEventToAppointment(
  event: GoogleCalendarApiEvent,
  availableClients?: Client[]
): AgencyAppointment {
  const startRaw = event.start?.dateTime || event.start?.date || '';
  const endRaw = event.end?.dateTime || event.end?.date || '';

  const startDate = startRaw.includes('T') ? startRaw.split('T')[0] : startRaw || new Date().toISOString().split('T')[0];
  const startTime = startRaw.includes('T') ? startRaw.split('T')[1].substring(0, 5) : '09:00';

  const endDate = endRaw.includes('T') ? endRaw.split('T')[0] : startDate;
  const endTime = endRaw.includes('T') ? endRaw.split('T')[1].substring(0, 5) : '10:00';

  // Find Meet link
  let meetLink = event.hangoutLink;
  if (!meetLink && event.conferenceData?.entryPoints) {
    const videoEntry = event.conferenceData.entryPoints.find((ep) => ep.entryPointType === 'video');
    if (videoEntry) meetLink = videoEntry.uri;
  }

  // Try to match with existing client
  let clientId: string | undefined;
  let clientName: string | undefined;

  const fullText = `${event.summary || ''} ${event.description || ''}`.toLowerCase();
  if (availableClients && availableClients.length > 0) {
    const matchedClient = availableClients.find((c) => {
      const nameMatch = fullText.includes(c.name.toLowerCase());
      const emailMatch = event.attendees?.some((a) => a.email.toLowerCase() === c.email?.toLowerCase());
      return nameMatch || emailMatch;
    });

    if (matchedClient) {
      clientId = matchedClient.id;
      clientName = matchedClient.name;
    }
  }

  return {
    id: `gcal-${event.id}`,
    googleEventId: event.id,
    title: event.summary || 'Compromisso sem título',
    category: inferCategory(event.summary, event.description),
    clientId,
    clientName,
    description: event.description || '',
    startDate,
    startTime,
    endDate,
    endTime,
    meetLink,
    location: event.location || (meetLink ? 'Google Meet' : 'Presencial / Remoto'),
    attendees: (event.attendees || []).map((a) => ({
      email: a.email,
      name: a.displayName || a.email.split('@')[0],
      responseStatus: a.responseStatus,
    })),
    status: (event.status === 'confirmed' || event.status === 'tentative' || event.status === 'cancelled')
      ? event.status
      : 'confirmed',
    htmlLink: event.htmlLink,
    syncedWithGoogle: true,
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Fetches events from primary Google Calendar
 */
export async function fetchGoogleCalendarEvents(
  availableClients?: Client[]
): Promise<{
  success: boolean;
  events: AgencyAppointment[];
  error?: string;
  isUnauthorized?: boolean;
}> {
  const token = getGoogleCalendarAccessToken();
  if (!token) {
    return {
      success: false,
      events: [],
      error: 'Token do Google Calendar não encontrado na memória.',
      isUnauthorized: true,
    };
  }

  try {
    // Look 30 days into the past and 90 days into the future
    const now = new Date();
    const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const url = new URL(GOOGLE_CALENDAR_API_BASE);
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('timeMax', timeMax);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '150');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 401) {
      return {
        success: false,
        events: [],
        error: 'Sessão expirada com o Google. Por favor, reconecte sua conta.',
        isUnauthorized: true,
      };
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        events: [],
        error: errData.error?.message || `Erro ao consultar Google Calendar (${response.status})`,
      };
    }

    const data = await response.json();
    const items: GoogleCalendarApiEvent[] = data.items || [];
    const deletedIds = getDeletedAppointmentIds();

    const activeItems = items.filter((it) => {
      if (!it || it.status === 'cancelled') return false;
      if (it.id && deletedIds.has(it.id)) return false;
      if (it.id && deletedIds.has(`gcal-${it.id}`)) return false;
      return true;
    });

    const mapped = activeItems.map((it) => mapGoogleEventToAppointment(it, availableClients));

    return {
      success: true,
      events: mapped,
    };
  } catch (err: any) {
    console.error('fetchGoogleCalendarEvents error:', err);
    return {
      success: false,
      events: [],
      error: err.message || 'Falha de comunicação com os servidores do Google Calendar.',
    };
  }
}

/**
 * Creates an event in Google Calendar (or local fallback if offline)
 */
export async function createGoogleCalendarAppointment(
  input: CreateAppointmentInput
): Promise<{
  success: boolean;
  appointment?: AgencyAppointment;
  error?: string;
  isUnauthorized?: boolean;
}> {
  const token = getGoogleCalendarAccessToken();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

  // Format ISO timestamps with local timezone offset
  const startDateTime = `${input.startDate}T${input.startTime}:00`;
  const endDateTime = `${input.endDate}T${input.endTime}:00`;

  // Construct attendees payload
  const attendeesList: Array<{ email: string }> = [];
  if (input.attendeesEmails && input.attendeesEmails.length > 0) {
    input.attendeesEmails.forEach((email) => {
      const clean = email.trim();
      if (clean && clean.includes('@')) {
        attendeesList.push({ email: clean });
      }
    });
  }

  // Prepend client identifier in description for clarity
  let formattedDescription = input.description || '';
  if (input.clientName) {
    formattedDescription = `[Cliente: ${input.clientName}]\n\n${formattedDescription}`;
  }

  // If no Google token is active, save as local appointment
  if (!token) {
    const localApt: AgencyAppointment = {
      id: `local-${Date.now()}`,
      title: input.title,
      category: input.category,
      clientId: input.clientId,
      clientName: input.clientName,
      description: input.description,
      startDate: input.startDate,
      startTime: input.startTime,
      endDate: input.endDate,
      endTime: input.endTime,
      location: input.location || (input.addGoogleMeet ? 'Google Meet (Pendente Sincronização)' : 'Presencial'),
      attendees: attendeesList.map((a) => ({ email: a.email, responseStatus: 'needsAction' as const })),
      status: 'confirmed',
      syncedWithGoogle: false,
      lastSyncedAt: new Date().toISOString(),
    };

    const current = getLocalAppointments();
    saveLocalAppointments([localApt, ...current]);

    return {
      success: true,
      appointment: localApt,
    };
  }

  // Prepare Google Calendar API payload
  const body: any = {
    summary: input.title,
    description: formattedDescription,
    start: {
      dateTime: new Date(startDateTime).toISOString(),
      timeZone,
    },
    end: {
      dateTime: new Date(endDateTime).toISOString(),
      timeZone,
    },
    location: input.location || '',
    attendees: attendeesList,
  };

  if (input.addGoogleMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
      },
    };
  }

  try {
    const url = new URL(GOOGLE_CALENDAR_API_BASE);
    url.searchParams.set('conferenceDataVersion', '1');

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      return {
        success: false,
        error: 'Sessão do Google Calendar expirada. Por favor, autentique-se novamente.',
        isUnauthorized: true,
      };
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.error?.message || `Erro ao criar evento no Google (${res.status})`,
      };
    }

    const createdEvent: GoogleCalendarApiEvent = await res.json();
    const mapped = mapGoogleEventToAppointment(createdEvent);
    mapped.category = input.category;
    mapped.clientId = input.clientId;
    mapped.clientName = input.clientName;

    // Persist in local cache
    const current = getLocalAppointments();
    saveLocalAppointments([mapped, ...current]);

    return {
      success: true,
      appointment: mapped,
    };
  } catch (err: any) {
    console.error('Error creating Google Calendar appointment:', err);
    return {
      success: false,
      error: err.message || 'Erro de conexão ao criar compromisso no Google Calendar.',
    };
  }
}

/**
 * Updates an existing event in Google Calendar
 */
export async function updateGoogleCalendarAppointment(
  appointmentId: string,
  googleEventId: string | undefined,
  input: CreateAppointmentInput
): Promise<{
  success: boolean;
  appointment?: AgencyAppointment;
  error?: string;
  isUnauthorized?: boolean;
}> {
  const token = getGoogleCalendarAccessToken();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

  const startDateTime = `${input.startDate}T${input.startTime}:00`;
  const endDateTime = `${input.endDate}T${input.endTime}:00`;

  const attendeesList: Array<{ email: string }> = [];
  if (input.attendeesEmails && input.attendeesEmails.length > 0) {
    input.attendeesEmails.forEach((email) => {
      const clean = email.trim();
      if (clean && clean.includes('@')) {
        attendeesList.push({ email: clean });
      }
    });
  }

  let formattedDescription = input.description || '';
  if (input.clientName) {
    formattedDescription = `[Cliente: ${input.clientName}]\n\n${formattedDescription}`;
  }

  // If there is no Google Event ID or no active token, update locally
  if (!googleEventId || !token) {
    const current = getLocalAppointments();
    const updated = current.map((a) => {
      if (a.id === appointmentId) {
        return {
          ...a,
          title: input.title,
          category: input.category,
          clientId: input.clientId,
          clientName: input.clientName,
          description: input.description,
          startDate: input.startDate,
          startTime: input.startTime,
          endDate: input.endDate,
          endTime: input.endTime,
          location: input.location || a.location,
          attendees: attendeesList.map((at) => ({ email: at.email, responseStatus: 'needsAction' as const })),
          lastSyncedAt: new Date().toISOString(),
        };
      }
      return a;
    });

    saveLocalAppointments(updated);
    const updatedItem = updated.find((a) => a.id === appointmentId);
    return { success: true, appointment: updatedItem };
  }

  // Google Calendar PATCH
  try {
    const patchBody: any = {
      summary: input.title,
      description: formattedDescription,
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone,
      },
      end: {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone,
      },
      location: input.location || '',
      attendees: attendeesList,
    };

    if (input.addGoogleMeet) {
      patchBody.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    const url = new URL(`${GOOGLE_CALENDAR_API_BASE}/${googleEventId}`);
    url.searchParams.set('conferenceDataVersion', '1');

    const res = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchBody),
    });

    if (res.status === 401) {
      return { success: false, error: 'Sessão expirada.', isUnauthorized: true };
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error?.message || 'Falha ao atualizar evento no Google.' };
    }

    const updatedEvent: GoogleCalendarApiEvent = await res.json();
    const mapped = mapGoogleEventToAppointment(updatedEvent);
    mapped.id = appointmentId;
    mapped.category = input.category;
    mapped.clientId = input.clientId;
    mapped.clientName = input.clientName;

    const current = getLocalAppointments();
    const newItems = current.map((item) => (item.id === appointmentId ? mapped : item));
    saveLocalAppointments(newItems);

    return { success: true, appointment: mapped };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao sincronizar atualização.' };
  }
}

/**
 * Deletes an event from Google Calendar (and local cache)
 * Notice: Workspace skill mandates explicit confirmation before calling this!
 */
export async function deleteGoogleCalendarAppointment(
  appointmentId: string,
  googleEventId?: string
): Promise<{ success: boolean; error?: string; isUnauthorized?: boolean }> {
  // 1. Immediately register in persistent deleted IDs set (tombstone)
  markAppointmentAsDeleted(appointmentId, googleEventId);

  const token = getGoogleCalendarAccessToken();

  // If connected to Google and has a googleEventId, delete remotely from Google Calendar
  if (googleEventId && token) {
    try {
      const res = await fetch(`${GOOGLE_CALENDAR_API_BASE}/${encodeURIComponent(googleEventId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        return { success: false, error: 'Sessão expirada com o Google Calendar.', isUnauthorized: true };
      }

      if (!res.ok && res.status !== 404 && res.status !== 410) {
        const err = await res.json().catch(() => ({}));
        console.warn('Google Calendar delete warning:', err);
      }
    } catch (err: any) {
      console.error('Error deleting from Google Calendar:', err);
    }
  }

  // 2. Remove cleanly from local appointments cache
  const current = getLocalAppointments();
  const filtered = current.filter((a) => {
    if (appointmentId && a.id === appointmentId) return false;
    if (googleEventId && a.googleEventId === googleEventId) return false;
    if (appointmentId && a.googleEventId === appointmentId) return false;
    return true;
  });
  saveLocalAppointments(filtered);

  return { success: true };
}
