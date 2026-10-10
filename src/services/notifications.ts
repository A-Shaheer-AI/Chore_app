// Notification service for Chore Roulette
// Supports: WhatsApp 1-Click Nudges, Telegram House Bot, Discord Webhooks, Ntfy.sh Mobile Push, and CallMeBot WhatsApp

export interface HouseNotificationSettings {
  enableWhatsAppNudges: boolean;
  // Telegram
  enableTelegram: boolean;
  telegramBotToken?: string;
  telegramChatId?: string; // Group ID (e.g. -100...) or personal chat ID
  // Discord
  enableDiscord: boolean;
  discordWebhookUrl?: string;
  // Ntfy.sh
  enableNtfy: boolean;
  ntfyTopic?: string;
  // CallMeBot (Automated WhatsApp DMs)
  enableCallMeBot: boolean;
}

export interface RoommateContact {
  userId: string;
  phone?: string;
  whatsappApiKey?: string;
  telegramUsername?: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: HouseNotificationSettings = {
  enableWhatsAppNudges: true,
  enableTelegram: false,
  telegramBotToken: '',
  telegramChatId: '',
  enableDiscord: false,
  discordWebhookUrl: '',
  enableNtfy: false,
  ntfyTopic: 'chore-roulette-house',
  enableCallMeBot: false,
};

/**
 * Format raw phone number into clean E.164 digits for WhatsApp URL
 */
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/[^\d]/g, '');
};

/**
 * Generates direct WhatsApp URL (wa.me) with pre-encoded message.
 * If phone is provided, directs to specific contact; otherwise opens WhatsApp recipient picker.
 */
export const generateWhatsAppLink = (phone: string | undefined, message: string): string => {
  const encodedText = encodeURIComponent(message);
  if (phone) {
    const clean = cleanPhoneNumber(phone);
    if (clean) {
      return `https://wa.me/${clean}?text=${encodedText}`;
    }
  }
  return `https://wa.me/?text=${encodedText}`;
};

/**
 * Creates friendly, structured nudge message for roommates
 */
export const generateChoreNudgeMessage = (options: {
  assigneeName: string;
  choreName: string;
  isOverdue: boolean;
  hoursOverdue?: number;
  totalPenalty?: number;
  senderName?: string;
}): string => {
  const { assigneeName, choreName, isOverdue, hoursOverdue = 0, totalPenalty, senderName } = options;
  const daysOverdue = Math.floor(hoursOverdue / 24);

  if (isOverdue) {
    if (hoursOverdue >= 48) {
      const penaltyText = totalPenalty ? `-${totalPenalty} pts` : '-4 pts';
      return `🚨 *Chore Alert — Treat Penalty!* 🍩\n\nHey *${assigneeName}*! "${choreName}" is currently ${daysOverdue} days overdue (${penaltyText})!\n\nYou officially owe the house a treat! Please get it done as soon as you can so the rotation stays fair. 🎲\n\n${senderName ? `— Sent by ${senderName} via Chore Roulette` : '— Sent via Chore Roulette'}`;
    }

    if (hoursOverdue >= 24) {
      return `⚠️ *Chore Warning (24h Late)*\n\nHey *${assigneeName}*! Friendly reminder that "${choreName}" is over 24 hours overdue.\n\nHeads up: Crossing 48 hours triggers a Treat Penalty (-4 pts)! Please mark it done soon! 🧹\n\n${senderName ? `— Sent by ${senderName} via Chore Roulette` : '— Sent via Chore Roulette'}`;
    }

    return `⏰ *Chore Due Reminder*\n\nHey *${assigneeName}*! Just a friendly nudge from the house that "${choreName}" is now due.\n\nTake a quick minute to knock it out today! 🧼\n\n${senderName ? `— Sent by ${senderName} via Chore Roulette` : '— Sent via Chore Roulette'}`;
  }

  return `👋 *Chore Reminder*\n\nHey *${assigneeName}*! "${choreName}" is scheduled for your turn. Hope you have a great day! ✨\n\n${senderName ? `— Sent by ${senderName} via Chore Roulette` : '— Sent via Chore Roulette'}`;
};

/**
 * Send notification to Telegram bot or house group
 */
export const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  if (!botToken || !chatId) {
    return { success: false, error: 'Telegram Bot Token or Chat ID is missing.' };
  }
  try {
    const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { success: false, error: data.description || 'Failed to send Telegram message.' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
};

/**
 * Send notification to Discord channel via webhook
 */
export const sendDiscordMessage = async (
  webhookUrl: string,
  content: string
): Promise<{ success: boolean; error?: string }> => {
  if (!webhookUrl) {
    return { success: false, error: 'Discord Webhook URL is missing.' };
  }
  try {
    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      return { success: false, error: `Discord webhook failed with status ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
};

/**
 * Send notification to free Ntfy.sh topic
 */
export const sendNtfyMessage = async (
  topic: string,
  title: string,
  message: string,
  priority = 3
): Promise<{ success: boolean; error?: string }> => {
  if (!topic) {
    return { success: false, error: 'Ntfy topic is missing.' };
  }
  try {
    const cleanTopic = topic.trim().replace(/^\//, '');
    const res = await fetch(`https://ntfy.sh/${cleanTopic}`, {
      method: 'POST',
      headers: {
        Title: title,
        Priority: String(priority),
        Tags: 'house,alarm_clock',
      },
      body: message,
    });
    if (!res.ok) {
      return { success: false, error: `Ntfy request failed with status ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
};

/**
 * Send WhatsApp DM via CallMeBot (Free personal WhatsApp gateway)
 */
export const sendCallMeBotWhatsApp = async (
  phone: string,
  apiKey: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  if (!phone || !apiKey) {
    return { success: false, error: 'Phone number or CallMeBot API key missing.' };
  }
  try {
    const clean = cleanPhoneNumber(phone);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${clean}&text=${encodeURIComponent(message)}&apikey=${apiKey.trim()}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { success: false, error: `CallMeBot failed with status ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
};

/**
 * Dispatch automated alert across all enabled channels
 */
export const dispatchHouseAlert = async (
  settings: HouseNotificationSettings,
  contacts: Record<string, RoommateContact>,
  alert: {
    title: string;
    message: string;
    recipientUserId?: string;
    priority?: number;
  }
): Promise<void> => {
  const promises: Promise<unknown>[] = [];
  const fullText = `*${alert.title}*\n${alert.message}`;

  // 1. Telegram
  if (settings.enableTelegram && settings.telegramBotToken && settings.telegramChatId) {
    promises.push(sendTelegramMessage(settings.telegramBotToken, settings.telegramChatId, fullText));
  }

  // 2. Discord
  if (settings.enableDiscord && settings.discordWebhookUrl) {
    promises.push(sendDiscordMessage(settings.discordWebhookUrl, `📢 **${alert.title}**\n${alert.message}`));
  }

  // 3. Ntfy.sh
  if (settings.enableNtfy && settings.ntfyTopic) {
    promises.push(sendNtfyMessage(settings.ntfyTopic, alert.title, alert.message, alert.priority || 3));
  }

  // 4. CallMeBot WhatsApp DM (if specific user targeted and has credentials)
  if (settings.enableCallMeBot && alert.recipientUserId) {
    const contact = contacts[alert.recipientUserId];
    if (contact?.phone && contact?.whatsappApiKey) {
      promises.push(sendCallMeBotWhatsApp(contact.phone, contact.whatsappApiKey, `${alert.title}: ${alert.message}`));
    }
  }

  await Promise.allSettled(promises);
};
