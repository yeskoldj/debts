
import { getUpcomingDueDates } from './utils';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showNotification = async (title: string, body: string, data?: any) => {
  if (Notification.permission !== 'granted') return;

  try {
    // Verificar si hay un service worker activo
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      
      // Usar la API del service worker
      await registration.showNotification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data,
        requireInteraction: true,
        tag: 'debt-reminder',
        actions: [
          {
            action: 'view',
            title: 'Ver deuda'
          },
          {
            action: 'dismiss',
            title: 'Cerrar'
          }
        ]
      });
    } else {
      // Fallback a la API nativa si no hay service worker
      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data,
        requireInteraction: true,
        tag: 'debt-reminder'
      });

      notification.onclick = () => {
        window.focus();
        if (data?.debtId) {
          window.location.href = `/debt/${data.debtId}`;
        }
        notification.close();
      };
    }
  } catch (error) {
    console.error('Error mostrando notificación:', error);
  }
};

export const checkAndShowDueNotifications = async () => {
  const upcomingDues = getUpcomingDueDates();
  
  for (const { debt, daysLeft } of upcomingDues) {
    const storageKey = `notification_${debt.id}_${debt.dueDate}`;
    const today = new Date().toDateString();
    const lastNotified = localStorage.getItem(storageKey);

    // Solo notificar una vez por día
    if (lastNotified === today) continue;

    let title = '';
    let body = '';

    if (daysLeft === 0) {
      title = '¡Deuda vence hoy!';
      body = `La deuda "${debt.name}" vence hoy`;
    } else if (daysLeft > 0 && daysLeft <= 3) {
      title = 'Recordatorio de deuda';
      body = `La deuda "${debt.name}" vence en ${daysLeft} día${daysLeft > 1 ? 's' : ''}`;
    } else if (daysLeft < 0) {
      title = '¡Deuda vencida!';
      body = `La deuda "${debt.name}" está vencida desde hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) > 1 ? 's' : ''}`;
    }

    if (title && body) {
      await showNotification(title, body, { debtId: debt.id });
      localStorage.setItem(storageKey, today);
    }
  }
};

export const scheduleNotificationCheck = () => {
  // Verificar notificaciones cada hora
  setInterval(checkAndShowDueNotifications, 60 * 60 * 1000);
  
  // Verificar inmediatamente al cargar
  setTimeout(checkAndShowDueNotifications, 2000);
};

export const initNotifications = async () => {
  const hasPermission = await requestNotificationPermission();
  if (hasPermission) {
    scheduleNotificationCheck();
  }
  return hasPermission;
};
