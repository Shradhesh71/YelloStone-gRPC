// Token configuration and metadata
export interface TokenConfig {
  mintAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  enabled: boolean;
  alertThreshold?: number; 
}

export const SUPPORTED_TOKENS: Record<string, TokenConfig> = {
  // Stablecoins
  USDC: {
    mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    enabled: true,
    alertThreshold: 10000 // $10k+ transactions
  },
  USDT: {
    mintAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT", 
    name: "Tether USD",
    decimals: 6,
    enabled: true,
    alertThreshold: 10000 // $10k+ transactions
  },
  
  // Native SOL (special case - no mint address)
  SOL: {
    mintAddress: "So11111111111111111111111111111111111111112", // Wrapped SOL
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    enabled: true,
    alertThreshold: 100 // 100+ SOL transactions
  },
  
  // Meme tokens
  BONK: {
    mintAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
    enabled: true,
    alertThreshold: 1000000 // 1M+ BONK
  },
  
  // DeFi tokens
  JUP: {
    mintAddress: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    symbol: "JUP",
    name: "Jupiter",
    decimals: 6,
    enabled: true,
    alertThreshold: 10000 // 10k+ JUP
  }
};

// Helper functions
export function getTokenByMint(mintAddress: string): TokenConfig | undefined {
  return Object.values(SUPPORTED_TOKENS).find(token => token.mintAddress === mintAddress);
}

export function getEnabledTokens(): TokenConfig[] {
  return Object.values(SUPPORTED_TOKENS).filter(token => token.enabled);
}

export function getAllTokenMints(): string[] {
  return getEnabledTokens().map(token => token.mintAddress);
}

export function formatTokenAmount(amount: string, token: TokenConfig): number {
  const lamports = BigInt(amount);
  const divisor = BigInt(10 ** token.decimals);
  return Number(lamports) / Number(divisor);
}

export function shouldAlert(amount: string, token: TokenConfig): boolean {
  if (!token.alertThreshold) return false;
  const formattedAmount = formatTokenAmount(amount, token);
  return formattedAmount >= token.alertThreshold;
}
