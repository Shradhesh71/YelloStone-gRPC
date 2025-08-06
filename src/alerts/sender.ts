import { AlertData, WebhookConfig, AlertFormatter } from './types';

export class AlertSender {
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = config;
  }

  async sendAlert(alert: AlertData): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.config.discord?.enabled) {
      promises.push(this.sendDiscordAlert(alert));
    }

    if (this.config.telegram?.enabled) {
      promises.push(this.sendTelegramAlert(alert));
    }

    if (this.config.custom?.enabled) {
      promises.push(this.sendCustomWebhook(alert));
    }

    try {
      await Promise.allSettled(promises);
      console.log(`✅ Alert sent for ${alert.token.symbol} transaction`);
    } catch (error) {
      console.error('❌ Failed to send alert:', error);
    }
  }

  private async sendDiscordAlert(alert: AlertData): Promise<void> {
    if (!this.config.discord?.webhookUrl) return;

    const payload = AlertFormatter.formatDiscordMessage(alert);
    
    const response = await fetch(this.config.discord.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }
  }

  private async sendTelegramAlert(alert: AlertData): Promise<void> {
    if (!this.config.telegram?.botToken || !this.config.telegram?.chatId) return;

    const message = AlertFormatter.formatTelegramMessage(alert);
    const url = `https://api.telegram.org/bot${this.config.telegram.botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: this.config.telegram.chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });

    if (!response.ok) {
      throw new Error(`Telegram API failed: ${response.status}`);
    }
  }

  private async sendCustomWebhook(alert: AlertData): Promise<void> {
    if (!this.config.custom?.webhookUrl) return;

    const payload = {
      alert_type: alert.type,
      token: alert.token,
      amount: alert.amount,
      formatted_amount: alert.formattedAmount,
      transaction_signature: alert.transactionSignature,
      account_address: alert.accountAddress,
      timestamp: alert.timestamp.toISOString(),
      slot: alert.slot
    };

    const response = await fetch(this.config.custom.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Custom webhook failed: ${response.status}`);
    }
  }
}

// Singleton pattern for global access
let alertSenderInstance: AlertSender | null = null;

export function initializeAlerts(config: WebhookConfig): AlertSender {
  alertSenderInstance = new AlertSender(config);
  return alertSenderInstance;
}

export function getAlertSender(): AlertSender | null {
  return alertSenderInstance;
}
