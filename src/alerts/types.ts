// Alert types and interfaces
export interface AlertData {
  type: 'large_transaction' | 'whale_movement' | 'new_token_activity';
  token: {
    symbol: string;
    name: string;
    mintAddress: string;
  };
  amount: number;
  formattedAmount: string;
  transactionSignature?: string;
  accountAddress?: string;
  timestamp: Date;
  slot: string;
}

export interface WebhookConfig {
  discord?: {
    enabled: boolean;
    webhookUrl: string;
  };
  telegram?: {
    enabled: boolean;
    botToken: string;
    chatId: string;
  };
  custom?: {
    enabled: boolean;
    webhookUrl: string;
  };
}

// Alert formatting utilities
export class AlertFormatter {
  static formatDiscordMessage(alert: AlertData): any {
    const emoji = this.getEmojiForToken(alert.token.symbol);
    const color = this.getColorForAlert(alert.type);
    
    return {
      embeds: [{
        title: `🚨 ${alert.type.replace('_', ' ').toUpperCase()} Alert`,
        color: color,
        fields: [
          {
            name: `${emoji} Token`,
            value: `${alert.token.symbol} (${alert.token.name})`,
            inline: true
          },
          {
            name: "💰 Amount",
            value: alert.formattedAmount,
            inline: true
          },
          {
            name: "⏰ Time",
            value: `<t:${Math.floor(alert.timestamp.getTime() / 1000)}:f>`,
            inline: true
          },
          {
            name: "🔗 Signature",
            value: alert.transactionSignature ? 
              `[View on Explorer](https://explorer.solana.com/tx/${alert.transactionSignature})` : 
              "N/A",
            inline: false
          }
        ],
        footer: {
          text: `Slot: ${alert.slot} | Solana Indexer Alert`
        },
        timestamp: alert.timestamp.toISOString()
      }]
    };
  }

  static formatTelegramMessage(alert: AlertData): string {
    const emoji = this.getEmojiForToken(alert.token.symbol);
    
    return `🚨 *${alert.type.replace('_', ' ').toUpperCase()} ALERT*
    
    ${emoji} *Token:* ${alert.token.symbol} (${alert.token.name})
    💰 *Amount:* ${alert.formattedAmount}
    ⏰ *Time:* ${alert.timestamp.toLocaleString()}
    🔗 *Slot:* ${alert.slot}

    ${alert.transactionSignature ? 
    `[View Transaction](https://explorer.solana.com/tx/${alert.transactionSignature})` : 
    ''
    }`;
  }

  private static getEmojiForToken(symbol: string): string {
    const emojiMap: Record<string, string> = {
      'USDC': '🟢',
      'USDT': '🟡', 
      'SOL': '🔵',
      'BONK': '🐕',
      'JUP': '🪐'
    };
    return emojiMap[symbol] || '🪙';
  }

  private static getColorForAlert(type: string): number {
    const colorMap: Record<string, number> = {
      'large_transaction': 0xFF6B35, // Orange
      'whale_movement': 0xFF0000,    // Red
      'new_token_activity': 0x00FF00 // Green
    };
    return colorMap[type] || 0x0099FF; // Blue default
  }
}
