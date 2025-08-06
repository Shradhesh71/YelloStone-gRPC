import { getPerformanceMonitor } from './monitor';
import { PerformanceMetrics, HealthStatus } from './types';

export class PerformanceDashboard {
  // Get performance metrics in JSON format
  static getMetricsJSON(): PerformanceMetrics | null {
    const monitor = getPerformanceMonitor();
    return monitor ? monitor.getMetrics() : null;
  }

  // Get health status in JSON format
  static getHealthJSON(): HealthStatus | null {
    const monitor = getPerformanceMonitor();
    return monitor ? monitor.getHealthStatus() : null;
  }

  // Get formatted metrics for console display
  static getFormattedMetrics(): string {
    const metrics = this.getMetricsJSON();
    const health = this.getHealthJSON();
    
    if (!metrics || !health) {
      return "Performance monitoring not initialized";
    }

    const uptimeMinutes = (metrics.connectionUptime / (1000 * 15)).toFixed(2);
    const memoryMB = Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024);
    
    return `
        📊 PERFORMANCE DASHBOARD
        ========================

        🏥 Health Status: ${health.overall.toUpperCase()}
        ⚡ Messages/sec: ${metrics.messagesPerSecond.toFixed(2)}
        ⏱️  Avg Processing: ${metrics.averageProcessingTime.toFixed(2)}ms
        💾 Database Latency: ${metrics.databaseLatency.toFixed(2)}ms
        🧠 Memory Usage: ${memoryMB}MB
        📡 Uptime: ${uptimeMinutes} minutes
        📨 Total Messages: ${metrics.totalMessagesProcessed}
        🚨 Alerts Sent: ${metrics.alertsSent}
        ❌ Stream Errors: ${metrics.streamErrors}

        🪙 Token Activity:
        ${Object.values(metrics.tokenMetrics)
            .filter(token => token.accountUpdates > 0 || token.transactions > 0)
            .map(token => `   ${token.symbol}: ${token.accountUpdates} accounts, ${token.transactions} txs`)
            .join('\n')
          }

        ${health.issues.length > 0 ? `⚠️  Issues:\n${health.issues.map(issue => `   • ${issue}`).join('\n')}` : '✅ No issues detected'}
        `;
  }

  // Export metrics to CSV format
  static exportMetricsCSV(): string {
    const metrics = this.getMetricsJSON();
    if (!metrics) return "";

    const timestamp = new Date().toISOString();
    
    return `timestamp,messages_per_second,total_messages,avg_processing_time,db_latency,memory_mb,alerts_sent,stream_errors
${timestamp},${metrics.messagesPerSecond},${metrics.totalMessagesProcessed},${metrics.averageProcessingTime},${metrics.databaseLatency},${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)},${metrics.alertsSent},${metrics.streamErrors}`;
  }

  // Get token-specific metrics
  static getTokenMetrics(symbol: string): any {
    const metrics = this.getMetricsJSON();
    if (!metrics || !metrics.tokenMetrics[symbol]) {
      return null;
    }

    const tokenMetric = metrics.tokenMetrics[symbol];
    return {
      symbol: tokenMetric.symbol,
      accountUpdates: tokenMetric.accountUpdates,
      transactions: tokenMetric.transactions,
      averageTransactionSize: tokenMetric.averageTransactionSize,
      largestTransaction: tokenMetric.largestTransaction,
      lastActivity: tokenMetric.lastActivity,
      activityRate: this.calculateActivityRate(tokenMetric)
    };
  }

  // Calculate activity rate (transactions per hour)
  private static calculateActivityRate(tokenMetric: any): number {
    const now = new Date();
    const lastActivity = new Date(tokenMetric.lastActivity);
    const minutesSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 15);

    if (minutesSinceLastActivity === 0) return 0;
    return tokenMetric.transactions / minutesSinceLastActivity;
  }

  // Get performance summary for alerting
  static getPerformanceSummary(): {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    metrics: any;
  } {
    const health = this.getHealthJSON();
    const metrics = this.getMetricsJSON();
    
    if (!health || !metrics) {
      return {
        status: 'critical',
        message: 'Performance monitoring unavailable',
        metrics: null
      };
    }

    let message = `System ${health.overall}`;
    if (health.issues.length > 0) {
      message += `: ${health.issues.join(', ')}`;
    }

    return {
      status: health.overall,
      message,
      metrics: {
        messagesPerSecond: metrics.messagesPerSecond,
        databaseLatency: metrics.databaseLatency,
        memoryUsageMB: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024),
        uptime: Math.round(metrics.connectionUptime / (1000 * 15)), // minutes
        totalMessages: metrics.totalMessagesProcessed
      }
    };
  }

  // Check if performance has degraded significantly
  static checkPerformanceDegradation(): {
    degraded: boolean;
    issues: string[];
  } {
    const health = this.getHealthJSON();
    const metrics = this.getMetricsJSON();
    
    if (!health || !metrics) {
      return { degraded: true, issues: ['Monitoring unavailable'] };
    }

    const issues: string[] = [];
    
    // Check for critical performance issues
    if (metrics.messagesPerSecond < 0.5) {
      issues.push('Very low message throughput');
    }
    
    if (metrics.averageProcessingTime > 2000) {
      issues.push('High processing latency');
    }
    
    if (metrics.databaseLatency > 1000) {
      issues.push('High database latency');
    }
    
    const memoryMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryMB > 1024) {
      issues.push('High memory usage');
    }

    return {
      degraded: health.overall === 'critical' || issues.length > 0,
      issues: [...health.issues, ...issues]
    };
  }
}
