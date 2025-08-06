import { createGrpcClient } from "./grpc/client";
import { createSubscribeRequest } from "./grpc/requestMain";
import { createAccountOnlySubscription } from "./grpc/requestAcc";
import { createTokenProgramSubscription } from "./grpc/requestToken";
import { createMinimalSubscribeRequest, createWhaleSubscribeRequest } from "./grpc/requestWhale";
import { sendSubscribeRequest, handleStreamEvents } from "./grpc/stream";
import { initializeAlerts } from "./alerts/sender";
import { ALERT_CONFIG } from "./config";
import { initializeMonitoring } from "./monitoring/monitor";
import chalk from "chalk";

async function main(): Promise<void> {
  console.log(chalk.blue("🚀 Starting Solana Indexer with Performance Monitoring"));
  console.log("=" .repeat(60));

  // Initialize performance monitoring
  const monitor = initializeMonitoring();
  console.log(chalk.green("✅ Performance monitoring started"));
  initializeAlerts(ALERT_CONFIG); // Initialize alert system

  const enabledChannels = [];
  if (ALERT_CONFIG.discord.enabled) enabledChannels.push('Discord');
  if (ALERT_CONFIG.telegram.enabled) enabledChannels.push('Telegram');
  if (ALERT_CONFIG.custom.enabled) enabledChannels.push('Custom Webhook');
  
  if (enabledChannels.length > 0) {
    console.log(chalk.green(`✅ Alerts enabled for: ${enabledChannels.join(', ')}`));
  } else {
    console.log(chalk.yellow("⚠️  No alert channels configured"));
  }

  console.log(chalk.blue("🔗 Connecting to Yellowstone gRPC..."));
  const client = createGrpcClient();
  const stream = await client.subscribe();
  
  // Choose subscription type based on your needs:
  
  // 1. MINIMAL - Only account updates for your tokens (RECOMMENDED for whale tracking)
  const request = createMinimalSubscribeRequest();
  const mode = "MINIMAL - Account updates only";
  
  // 2. WHALE FOCUSED - Only account updates (no slots)
  // const request = createWhaleSubscribeRequest();
  // const mode = "WHALE FOCUSED - Account updates only";
  
  // 3. FULL DATA - All transactions (WARNING: High volume!)
  // const request = createSubscribeRequest();
  // const mode = "FULL DATA - All transactions (High volume!)";
  
  try {
    await sendSubscribeRequest(stream, request);
    console.log(chalk.green(`✅ Subscribed in ${mode} mode`));
    console.log(chalk.cyan("🎯 Tracking: USDC, USDT, SOL, BONK, JUP"));
    console.log(chalk.gray("📊 Performance reports will be displayed every minute"));
    console.log("=" .repeat(60));
    
    // Set up graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow("\n🛑 Shutting down gracefully..."));
      monitor.stop();
      stream.end();
      process.exit(0);
    });
    
    await handleStreamEvents(stream);
  } catch (error) {
    console.error(chalk.red("❌ Subscription error:"), error);
    monitor?.recordStreamError();
    stream.end();
  }
}

main();
