import { supabase } from '../supabase';

export interface TelnyxSettings {
  enabled: boolean;
  fromNumber: string;
  apiKey: string;
  proxyUrl?: string;
}

export const DEFAULT_TELNYX_SETTINGS: TelnyxSettings = {
  enabled: false,
  fromNumber: '',
  apiKey: '',
  proxyUrl: '',
};

/**
 * Format raw phone number into clean E.164 format.
 * Automatically handles Australian 04xx xxx xxx -> +614xx xxx xxx.
 */
export const cleanE164Phone = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/[^\d]/g, '');
  }
  const digits = trimmed.replace(/[^\d]/g, '');
  if (digits.startsWith('04') && digits.length === 10) {
    return '+61' + digits.slice(1);
  }
  if (digits.startsWith('4') && digits.length === 9) {
    return '+61' + digits;
  }
  return '+' + digits;
};

/**
 * Dispatches an SMS via Telnyx.
 * Attempts Supabase Edge Function first (safest, no CORS).
 * Falls back to direct Telnyx API or configured proxy.
 */
export const sendTelnyxSMS = async (options: {
  to: string;
  message: string;
  settings: TelnyxSettings;
}): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const { to, message, settings } = options;
  const formattedTo = cleanE164Phone(to);

  if (!formattedTo || formattedTo.length < 8) {
    return { success: false, error: 'Invalid destination phone number.' };
  }

  // 1. Try Supabase Edge Function first if deployed
  try {
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('send-sms', {
      body: {
        to: formattedTo,
        text: message,
        from: settings.fromNumber,
        apiKey: settings.apiKey,
      },
    });

    if (!edgeError && edgeData && (edgeData.success || edgeData.data?.id)) {
      return { success: true, messageId: edgeData.data?.id || edgeData.messageId };
    }
  } catch {
    // Edge function not available; fallback to direct/proxy API
  }

  // 2. Direct / Proxy dispatch using Telnyx API
  if (!settings.apiKey || !settings.fromNumber) {
    return { success: false, error: 'Telnyx API Key or From Phone Number is not configured.' };
  }

  const endpoint = settings.proxyUrl?.trim()
    ? settings.proxyUrl.trim()
    : 'https://api.telnyx.com/v2/messages';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey.trim()}`,
      },
      body: JSON.stringify({
        from: cleanE164Phone(settings.fromNumber),
        to: formattedTo,
        text: message,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg =
        data.errors?.[0]?.detail ||
        data.errors?.[0]?.title ||
        `Telnyx error ${res.status}`;
      return { success: false, error: errMsg };
    }

    return { success: true, messageId: data.data?.id };
  } catch (err) {
    return {
      success: false,
      error: `Network error sending SMS: ${String(err)}`,
    };
  }
};
