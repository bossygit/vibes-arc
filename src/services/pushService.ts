import SupabaseDatabaseClient from '@/database/supabase-client';

export interface PushStatus {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  enabled: boolean;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getPushStatus(): PushStatus {
  const enabled = localStorage.getItem('vibes-arc-webpush-enabled') === 'true';
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const permission: any = supported ? Notification.permission : 'unsupported';
  return { supported, permission, enabled };
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (e) {
    console.warn('Service worker registration failed:', e);
    return null;
  }
}

export async function enableWebPush(): Promise<{ ok: boolean; reason?: string }> {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!supported) return { ok: false, reason: 'Web Push non supporté sur ce navigateur.' };

  const vapidPublicKey = (import.meta as any).env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidPublicKey) return { ok: false, reason: 'VITE_VAPID_PUBLIC_KEY manquant.' };

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, reason: 'Permission notifications refusée.' };

  const reg = await registerServiceWorker();
  if (!reg) return { ok: false, reason: 'Service worker non disponible.' };

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const client = SupabaseDatabaseClient.getInstance();
  const user = await client.getCurrentUser();
  if (!user) return { ok: false, reason: 'Utilisateur non authentifié.' };

  const accessToken = await client.getAccessToken();
  if (!accessToken) return { ok: false, reason: 'Token de session indisponible.' };

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ subscription }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    return { ok: false, reason: txt || 'Impossible de sauvegarder la subscription.' };
  }

  localStorage.setItem('vibes-arc-webpush-enabled', 'true');
  return { ok: true };
}

export async function disableWebPush(): Promise<void> {
  localStorage.setItem('vibes-arc-webpush-enabled', 'false');
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  try {
    const client = SupabaseDatabaseClient.getInstance();
    const accessToken = await client.getAccessToken();
    if (accessToken) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
    }
  } catch {}

  try {
    await sub.unsubscribe();
  } catch {}
}

export async function sendWebPushTest(): Promise<{ ok: boolean; reason?: string }> {
  const client = SupabaseDatabaseClient.getInstance();
  const accessToken = await client.getAccessToken();
  if (!accessToken) return { ok: false, reason: 'Non authentifié.' };

  const res = await fetch('/api/push/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) return { ok: false, reason: await res.text().catch(() => 'Erreur') };
  return { ok: true };
}

