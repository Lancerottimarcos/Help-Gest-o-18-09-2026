/**
 * Browser Notification Manager using the Web Notifications API
 * Alerts the agency manager whenever a client approves or rejects a demand.
 */

export interface BrowserNotificationPreferences {
  enabled: boolean;
  sound: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
  notifyOnChangeRequest: boolean;
}

const STORAGE_KEY = 'agency_browser_notifications_config';

export const DEFAULT_NOTIFICATION_PREFERENCES: BrowserNotificationPreferences = {
  enabled: true,
  sound: true,
  notifyOnApproval: true,
  notifyOnRejection: true,
  notifyOnChangeRequest: true,
};

/**
 * Check if the browser supports the Notifications API
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get the current permission status for Notifications
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Get stored preferences for browser notifications
 */
export function getNotificationPreferences(): BrowserNotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Failed to load notification preferences from localStorage:', err);
  }
  return { ...DEFAULT_NOTIFICATION_PREFERENCES };
}

/**
 * Save preferences for browser notifications
 */
export function saveNotificationPreferences(prefs: Partial<BrowserNotificationPreferences>): BrowserNotificationPreferences {
  const current = getNotificationPreferences();
  const updated = { ...current, ...prefs };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save notification preferences:', err);
  }
  return updated;
}

/**
 * Synthesize a clean, pleasant notification chime using Web Audio API
 * No external sound files required!
 */
export function playNotificationSound(type: 'approval' | 'rejection' | 'alert'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (type === 'approval') {
      // Cheerful ascending triad (C5 -> E5 -> G5)
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
      });
    } else if (type === 'rejection') {
      // Alert descending chime (A4 -> F4)
      const notes = [440, 349.23];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.14);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.14 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.14);
        osc.stop(ctx.currentTime + idx * 0.14 + 0.35);
      });
    } else {
      // Single alert chime (659.25Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.26);
    }
  } catch (err) {
    // AudioContext may be blocked before user interaction in some browsers
    console.debug('Audio chime skipped or not allowed yet:', err);
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      saveNotificationPreferences({ enabled: true });
    }
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

export interface InAppNotificationPayload {
  id: string;
  type: 'approval' | 'rejection' | 'change_request' | 'test';
  title: string;
  body: string;
  demandId?: string;
  clientName?: string;
  timestamp: string;
}

/**
 * Broadcast an in-app notification event so toast / UI can display it
 */
export function dispatchInAppNotification(payload: InAppNotificationPayload): void {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('help_manager_notification', { detail: payload });
    window.dispatchEvent(event);
  }
}

/**
 * Base method to dispatch a notification via the Browser Notifications API
 */
export function sendNotification(
  title: string,
  options: NotificationOptions & { soundType?: 'approval' | 'rejection' | 'alert'; demandId?: string; clientName?: string }
): boolean {
  const prefs = getNotificationPreferences();
  if (!prefs.enabled) return false;

  // Play audio chime if configured
  if (prefs.sound && options.soundType) {
    playNotificationSound(options.soundType);
  }

  // Always emit in-app notification event for instant visual feedback inside the UI
  dispatchInAppNotification({
    id: `notif-${Date.now()}`,
    type: options.soundType === 'approval' ? 'approval' : options.soundType === 'rejection' ? 'rejection' : 'change_request',
    title,
    body: options.body || '',
    demandId: options.demandId,
    clientName: options.clientName,
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  });

  // Attempt native browser notification if supported and granted
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      const nativeNotification = new Notification(title, {
        icon: '/logo.svg',
        badge: '/logo.svg',
        silent: !prefs.sound, // respect browser setting
        tag: options.tag || 'help-ideias-notification',
        ...options,
      });

      nativeNotification.onclick = () => {
        window.focus();
        if (options.demandId) {
          const selectDemandEvent = new CustomEvent('help_select_demand_detail', {
            detail: { demandId: options.demandId },
          });
          window.dispatchEvent(selectDemandEvent);
        }
        nativeNotification.close();
      };

      return true;
    } catch (err) {
      console.warn('Native browser notification failed (possibly iframe restriction):', err);
      return false;
    }
  }

  return false;
}

/**
 * Trigger notification when a client approves a demand
 */
export function notifyDemandApproved(demand: {
  id: string;
  title: string;
  client: string;
  clientProject?: string;
}): void {
  const prefs = getNotificationPreferences();
  if (!prefs.notifyOnApproval) return;

  const title = `✅ Demanda Aprovada: ${demand.client}`;
  const body = `O cliente ${demand.client} aprovou a demanda "${demand.title}". O card foi movido automaticamente para Agendamento.`;

  sendNotification(title, {
    body,
    soundType: 'approval',
    tag: `demand-approved-${demand.id}`,
    demandId: demand.id,
    clientName: demand.client,
  });
}

/**
 * Trigger notification when a client rejects a demand
 */
export function notifyDemandRejected(demand: {
  id: string;
  title: string;
  client: string;
  clientProject?: string;
  reason?: string;
}): void {
  const prefs = getNotificationPreferences();
  if (!prefs.notifyOnRejection) return;

  const title = `❌ Demanda Reprovada: ${demand.client}`;
  const reasonText = demand.reason ? ` Motivo: "${demand.reason}".` : '';
  const body = `O cliente ${demand.client} reprovou a demanda "${demand.title}".${reasonText} Retornada para a fila de Produção.`;

  sendNotification(title, {
    body,
    soundType: 'rejection',
    tag: `demand-rejected-${demand.id}`,
    demandId: demand.id,
    clientName: demand.client,
  });
}

/**
 * Trigger notification when a client requests changes
 */
export function notifyDemandChangeRequested(demand: {
  id: string;
  title: string;
  client: string;
  clientProject?: string;
  feedback?: string;
}): void {
  const prefs = getNotificationPreferences();
  if (!prefs.notifyOnChangeRequest) return;

  const title = `✏️ Alteração Solicitada: ${demand.client}`;
  const feedbackText = demand.feedback ? ` Ajuste: "${demand.feedback}".` : '';
  const body = `O cliente ${demand.client} solicitou modificações na demanda "${demand.title}".${feedbackText}`;

  sendNotification(title, {
    body,
    soundType: 'alert',
    tag: `demand-changes-${demand.id}`,
    demandId: demand.id,
    clientName: demand.client,
  });
}

/**
 * Send a test notification to verify audio and browser integration
 */
export function sendTestNotification(type: 'approval' | 'rejection' = 'approval'): void {
  if (type === 'approval') {
    notifyDemandApproved({
      id: 'TEST-APP-01',
      title: 'Campanha de Primavera no Instagram',
      client: 'Studio Glamour',
      clientProject: 'Social Media',
    });
  } else {
    notifyDemandRejected({
      id: 'TEST-REJ-01',
      title: 'Vídeo Promocional Reels',
      client: 'Alpha Motors',
      clientProject: 'Vídeos',
      reason: 'Ajustar a vinheta final com o novo slogan da marca.',
    });
  }
}
