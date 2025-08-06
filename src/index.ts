import { createGrpcClient } from "./grpc/client";
import { createSubscribeRequest } from "./grpc/requestMain";
import { createAccountOnlySubscription } from "./grpc/requestAcc";
import { createTokenProgramSubscription } from "./grpc/requestToken";
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
  const request = createSubscribeRequest();
  // const request = createAccountOnlySubscription();
  // const request = createTokenProgramSubscription();
  
  try {
    await sendSubscribeRequest(stream, request);
    console.log(chalk.green("✅ Subscribed to multi-token accounts, slots, and transactions."));
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
