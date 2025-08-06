import { PerformanceMetrics, TokenMetrics, HealthStatus, ProcessingTimer, PERFORMANCE_THRESHOLDS } from './types';
import { SUPPORTED_TOKENS } from '../config/tokens';
import chalk from 'chalk';

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private startTime: number;
  private processingTimers: Map<string, ProcessingTimer> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
    this.startPeriodicReporting();
  }

  private initializeMetrics(): PerformanceMetrics {
    const tokenMetrics: Record<string, TokenMetrics> = {};
    
    // Initialize metrics for all supported tokens
    Object.values(SUPPORTED_TOKENS).forEach(token => {
      tokenMetrics[token.symbol] = {
        symbol: token.symbol,
        accountUpdates: 0,
        transactions: 0,
        averageTransactionSize: 0,
        largestTransaction: 0,
        lastActivity: new Date()
      };
    });

    return {
      messagesPerSecond: 0,
      totalMessagesProcessed: 0,
      averageProcessingTime: 0,
      databaseLatency: 0,
      databaseOperationsPerSecond: 0,
      failedDatabaseOperations: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: 0,
      connectionUptime: 0,
      lastMessageTime: new Date(),
      streamErrors: 0,
      reconnectionCount: 0,
      alertsSent: 0,
      alertsFailedToSend: 0,
      tokenMetrics
    };
  }

  // Start timing a processing operation
  startTimer(operationId: string, operation: string): void {
    this.processingTimers.set(operationId, {
      start: performance.now(),
      operation
    });
  }

  // End timing and record the duration
  endTimer(operationId: string): number {
    const timer = this.processingTimers.get(operationId);
    if (!timer) return 0;

    const duration = performance.now() - timer.start;
    this.processingTimers.delete(operationId);
    
    // Update average processing time
    this.updateAverageProcessingTime(duration);
    
    return duration;
  }

  // Record message processing
  recordMessageProcessed(): void {
    this.metrics.totalMessagesProcessed++;
    this.metrics.lastMessageTime = new Date();
    this.updateMessagesPerSecond();
  }

  // Record database operation
  recordDatabaseOperation(latency: number, success: boolean = true): void {
    if (success) {
      this.updateAverageDatabaseLatency(latency);
      this.metrics.databaseOperationsPerSecond++;
    } else {
      this.metrics.failedDatabaseOperations++;
    }
  }

  // Record token activity
  recordTokenActivity(symbol: string, type: 'account' | 'transaction', amount?: number): void {
    const tokenMetric = this.metrics.tokenMetrics[symbol];
    if (!tokenMetric) return;

    tokenMetric.lastActivity = new Date();
    
    if (type === 'account') {
      tokenMetric.accountUpdates++;
    } else if (type === 'transaction') {
      tokenMetric.transactions++;
      
      if (amount) {
        // Update average transaction size
        const totalAmount = tokenMetric.averageTransactionSize * (tokenMetric.transactions - 1) + amount;
        tokenMetric.averageTransactionSize = totalAmount / tokenMetric.transactions;
        
        // Update largest transaction
        if (amount > tokenMetric.largestTransaction) {
          tokenMetric.largestTransaction = amount;
        }
      }
    }
  }

  // Record stream events
  recordStreamError(): void {
    this.metrics.streamErrors++;
  }

  recordReconnection(): void {
    this.metrics.reconnectionCount++;
  }

  // Record alert events
  recordAlertSent(success: boolean = true): void {
    if (success) {
      this.metrics.alertsSent++;
    } else {
      this.metrics.alertsFailedToSend++;
    }
  }

  // Update system metrics
  updateSystemMetrics(): void {
    this.metrics.memoryUsage = process.memoryUsage();
    this.metrics.connectionUptime = Date.now() - this.startTime;
    
    // Get CPU usage (simplified)
    const usage = process.cpuUsage();
    this.metrics.cpuUsage = (usage.user + usage.system) / 1000000; // Convert to seconds
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    this.updateSystemMetrics();
    return { ...this.metrics };
  }

  // Get health status
  getHealthStatus(): HealthStatus {
    this.updateSystemMetrics();
    
    const issues: string[] = [];
    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check database health
    const dbHealth = this.checkDatabaseHealth(issues);
    
    // Check stream health
    const streamHealth = this.checkStreamHealth(issues);
    
    // Check memory health
    const memoryHealth = this.checkMemoryHealth(issues);
    
    // Check alert system health
    const alertHealth = this.checkAlertHealth(issues);

    // Determine overall health
    const healthLevels = [dbHealth, streamHealth, memoryHealth, alertHealth];
    if (healthLevels.includes('critical')) {
      overallHealth = 'critical';
    } else if (healthLevels.includes('warning')) {
      overallHealth = 'warning';
    }

    return {
      overall: overallHealth,
      services: {
        database: dbHealth,
        grpcStream: streamHealth,
        memory: memoryHealth,
        alertSystem: alertHealth
      },
      issues,
      uptime: this.metrics.connectionUptime
    };
  }

  // Health check methods
  private checkDatabaseHealth(issues: string[]): 'healthy' | 'warning' | 'critical' {
    if (this.metrics.databaseLatency > PERFORMANCE_THRESHOLDS.MAX_DATABASE_LATENCY) {
      issues.push(`High database latency: ${this.metrics.databaseLatency}ms`);
      return 'warning';
    }
    
    const errorRate = this.metrics.failedDatabaseOperations / 
      (this.metrics.databaseOperationsPerSecond + this.metrics.failedDatabaseOperations);
    
    if (errorRate > PERFORMANCE_THRESHOLDS.MAX_ERROR_RATE) {
      issues.push(`High database error rate: ${(errorRate * 100).toFixed(2)}%`);
      return 'critical';
    }
    
    return 'healthy';
  }

  private checkStreamHealth(issues: string[]): 'healthy' | 'warning' | 'critical' {
    const timeSinceLastMessage = Date.now() - this.metrics.lastMessageTime.getTime();
    
    if (timeSinceLastMessage > PERFORMANCE_THRESHOLDS.MAX_STREAM_SILENCE) {
      issues.push(`Stream silent for ${Math.round(timeSinceLastMessage / 1000)}s`);
      return 'critical';
    }
    
    if (this.metrics.streamErrors > 5) {
      issues.push(`Multiple stream errors: ${this.metrics.streamErrors}`);
      return 'warning';
    }
    
    return 'healthy';
  }

  private checkMemoryHealth(issues: string[]): 'healthy' | 'warning' | 'critical' {
    const memoryUsed = this.metrics.memoryUsage.heapUsed;
    
    if (memoryUsed > PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE) {
      issues.push(`High memory usage: ${Math.round(memoryUsed / 1024 / 1024)}MB`);
      return 'warning';
    }
    
    return 'healthy';
  }

  private checkAlertHealth(issues: string[]): 'healthy' | 'warning' | 'critical' {
    const totalAlerts = this.metrics.alertsSent + this.metrics.alertsFailedToSend;
    if (totalAlerts === 0) return 'healthy';
    
    const failureRate = this.metrics.alertsFailedToSend / totalAlerts;
    
    if (failureRate > 0.5) {
      issues.push(`High alert failure rate: ${(failureRate * 100).toFixed(2)}%`);
      return 'critical';
    } else if (failureRate > 0.1) {
      issues.push(`Some alert failures: ${(failureRate * 100).toFixed(2)}%`);
      return 'warning';
    }
    
    return 'healthy';
  }

  // Helper methods
  private updateAverageProcessingTime(duration: number): void {
    const total = this.metrics.averageProcessingTime * (this.metrics.totalMessagesProcessed - 1) + duration;
    this.metrics.averageProcessingTime = total / this.metrics.totalMessagesProcessed;
  }

  private updateMessagesPerSecond(): void {
    const uptimeSeconds = (Date.now() - this.startTime) / 1000;
    this.metrics.messagesPerSecond = this.metrics.totalMessagesProcessed / uptimeSeconds;
  }

  private updateAverageDatabaseLatency(latency: number): void {
    const total = this.metrics.databaseLatency * (this.metrics.databaseOperationsPerSecond - 1) + latency;
    this.metrics.databaseLatency = total / this.metrics.databaseOperationsPerSecond;
  }

  // Periodic reporting
  private startPeriodicReporting(): void {
    this.intervalId = setInterval(() => {
      this.printPerformanceReport();
    }, 60000); // Report every minute
  }

  printPerformanceReport(): void {
    const metrics = this.getMetrics();
    const health = this.getHealthStatus();
    
    console.log("\n" + "=".repeat(60));
    console.log(chalk.blue("📊 PERFORMANCE REPORT"));
    console.log("=".repeat(60));
    
    // Overall health
    const healthColor = health.overall === 'healthy' ? chalk.green : 
                       health.overall === 'warning' ? chalk.yellow : chalk.red;
    console.log(`${healthColor(`🏥 Overall Health: ${health.overall.toUpperCase()}`)}`);
    
    if (health.issues.length > 0) {
      console.log(chalk.red("⚠️  Issues:"));
      health.issues.forEach(issue => console.log(chalk.red(`   • ${issue}`)));
    }
    
    // Performance metrics
    console.log(`\n${chalk.cyan("⚡ Performance:")}`);
    console.log(`   Messages/sec: ${metrics.messagesPerSecond.toFixed(2)}`);
    console.log(`   Avg processing: ${metrics.averageProcessingTime.toFixed(2)}ms`);
    console.log(`   DB latency: ${metrics.databaseLatency.toFixed(2)}ms`);
    console.log(`   Memory: ${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`);
    
    // Token activity
    console.log(`\n${chalk.cyan("🪙 Token Activity:")}`);
    Object.values(metrics.tokenMetrics).forEach(token => {
      if (token.accountUpdates > 0 || token.transactions > 0) {
        console.log(`   ${token.symbol}: ${token.accountUpdates} accounts, ${token.transactions} txs`);
      }
    });
    
    // Uptime
    const uptimeHours = (metrics.connectionUptime / (1000 * 60 * 60)).toFixed(2);
    console.log(`\n${chalk.cyan("⏱️  Uptime:")} ${uptimeHours} hours`);
    
    console.log("=".repeat(60) + "\n");
  }

  // Cleanup
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function initializeMonitoring(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}
