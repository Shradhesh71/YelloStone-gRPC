export interface PerformanceMetrics {
  // Data processing metrics
  messagesPerSecond: number;
  totalMessagesProcessed: number;
  averageProcessingTime: number;
  
  // Database metrics
  databaseLatency: number;
  databaseOperationsPerSecond: number;
  failedDatabaseOperations: number;
  
  // Memory and system metrics
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  
  // Stream health metrics
  connectionUptime: number;
  lastMessageTime: Date;
  streamErrors: number;
  reconnectionCount: number;
  
  // Alert metrics
  alertsSent: number;
  alertsFailedToSend: number;
  
  // Token-specific metrics
  tokenMetrics: Record<string, TokenMetrics>;
}

export interface TokenMetrics {
  symbol: string;
  accountUpdates: number;
  transactions: number;
  averageTransactionSize: number;
  largestTransaction: number;
  lastActivity: Date;
}

export interface HealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  services: {
    database: 'healthy' | 'warning' | 'critical';
    grpcStream: 'healthy' | 'warning' | 'critical';
    alertSystem: 'healthy' | 'warning' | 'critical';
    memory: 'healthy' | 'warning' | 'critical';
  };
  issues: string[];
  uptime: number;
}

export interface ProcessingTimer {
  start: number;
  operation: string;
}

// Performance thresholds for health checks
export const PERFORMANCE_THRESHOLDS = {
  MAX_PROCESSING_TIME: 1000, // 1 second
  MAX_DATABASE_LATENCY: 500, // 500ms
  MAX_MEMORY_USAGE: 512 * 1024 * 1024, // 512MB
  MIN_MESSAGES_PER_MINUTE: 60, // At least 1 msg/sec
  MAX_STREAM_SILENCE: 30000, // 30 seconds without messages
  MAX_ERROR_RATE: 0.05 // 5% error rate
};
