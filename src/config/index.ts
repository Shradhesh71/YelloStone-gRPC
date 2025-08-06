import dotenv from "dotenv";

dotenv.config();

export const ENDPOINT = process.env.ENDPOINT;

// Alert configuration
export const ALERT_CONFIG = {
  discord: {
    enabled: process.env.DISCORD_WEBHOOK_ENABLED === 'true',
    webhookUrl: process.env.DISCORD_WEBHOOK_URL || ''
  },
  telegram: {
    enabled: process.env.TELEGRAM_ENABLED === 'true',
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || ''
  },
  custom: {
    enabled: process.env.CUSTOM_WEBHOOK_ENABLED === 'true',
    webhookUrl: process.env.CUSTOM_WEBHOOK_URL || ''
  }
};
