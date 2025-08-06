import { SubscribeUpdate } from "@triton-one/yellowstone-grpc";
import chalk from "chalk";
import { PrismaClient } from "@prisma/client";
import { PublicKey } from "@solana/web3.js";
import { getTokenByMint, formatTokenAmount, shouldAlert, SUPPORTED_TOKENS } from "../config/tokens";
import { getAlertSender } from "../alerts/sender";
import { AlertData } from "../alerts/types";
import { getPerformanceMonitor } from "../monitoring/monitor";

const client = new PrismaClient();

export async function handleData(data: SubscribeUpdate): Promise<void> {
  const monitor = getPerformanceMonitor();
  const operationId = `msg-${Date.now()}-${Math.random()}`;
  
  // Start performance monitoring
  monitor?.startTimer(operationId, 'message_processing');
  
  try {
    if (data.account) {
      await handleAccountUpdate(data);
    }
    
    if (data.transaction) {
      await handleTransactionUpdate(data);
    }

    if (data.slot) {
      await handleSlotUpdate(data);
    }

    if (data.block) {
      await handleBlockUpdate(data);
    }
    
    // Record successful message processing
    monitor?.recordMessageProcessed();
    
  } catch (error) {
    console.error(chalk.red("❌ Error processing data:"), error);
    monitor?.recordStreamError();
  } finally {
    // End performance timing
    const duration = monitor?.endTimer(operationId) || 0;
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(chalk.yellow(`⚠️  Slow processing: ${duration.toFixed(2)}ms`));
    }
  }
}

async function handleAccountUpdate(data: SubscribeUpdate): Promise<void> {
  const acc = data.account?.account;
  if (!acc) return;

  const monitor = getPerformanceMonitor();
  const dbOperationId = `db-account-${Date.now()}`;
  
  try {
    monitor?.startTimer(dbOperationId, 'database_account_insert');
    
    const dataPubkey = new PublicKey(acc.pubkey);
    const pubkey = dataPubkey.toBytes();
    const owner = acc.owner;
    const lamports = acc.lamports;
    const executable = acc.executable;
    const rentEpoch = acc.rentEpoch;
    const slot = data.account?.slot;
    const dataLen = acc.data?.length || 0;

    const token = getTokenByMint(dataPubkey.toString());
    
    await client.account.create({
      data: {
        pubkey,
        owner,
        lamports,
        executable,
        rentEpoch,
        slot: slot || "0",
        dataLength: dataLen,
        // tokenMint: token ? dataPubkey.toString() : null,
        // tokenSymbol: token?.symbol || null
      }
    });

    const dbDuration = monitor?.endTimer(dbOperationId) || 0;
    monitor?.recordDatabaseOperation(dbDuration);

    // Record token activity
    if (token) {
      monitor?.recordTokenActivity(token.symbol, 'account');
      
      console.log(chalk.cyan(`📦 ${token.symbol} Account Update:`), dataPubkey.toString());
      
      // Check for large account updates (potential whale movements)
      if (lamports && shouldAlert(lamports, token)) {
        const formattedAmount = formatTokenAmount(lamports, token);
        await sendAlert({
          type: 'whale_movement',
          token: {
            symbol: token.symbol,
            name: token.name,
            mintAddress: token.mintAddress
          },
          amount: formattedAmount,
          formattedAmount: `${formattedAmount.toLocaleString()} ${token.symbol}`,
          accountAddress: dataPubkey.toString(),
          timestamp: new Date(),
          slot: slot || "0"
        });
      }
    }
  } catch (error) {
    const dbDuration = monitor?.endTimer(dbOperationId) || 0;
    monitor?.recordDatabaseOperation(dbDuration, false);
    console.error(chalk.red("❌ Error handling account update:"), error);
    throw error;
  }
}

async function handleTransactionUpdate(data: SubscribeUpdate): Promise<void> {
  const txnInfo = data.transaction?.transaction;
  if (!txnInfo) return;

  const monitor = getPerformanceMonitor();
  const dbOperationId = `db-transaction-${Date.now()}`;

  try {
    monitor?.startTimer(dbOperationId, 'database_transaction_insert');
    
    const sig = txnInfo.signature;
    const slot = data.transaction?.slot;
    const success = txnInfo.meta?.err === null;

    await client.transaction.create({
      data: {
        signature: sig,
        slot: slot || "0",
        success
      }
    });

    // Record database operation timing
    const dbDuration = monitor?.endTimer(dbOperationId) || 0;
    monitor?.recordDatabaseOperation(dbDuration, true);

    console.log(chalk.magenta(`🔁 Transaction:`), 
      sig ? Buffer.from(sig).toString('base64').slice(0, 20) + '...' : 'Unknown',
      success ? chalk.green('✅') : chalk.red('❌')
    );
  } catch (error) {
    const dbDuration = monitor?.endTimer(dbOperationId) || 0;
    monitor?.recordDatabaseOperation(dbDuration, false);
    console.error(chalk.red("❌ Error handling transaction update:"), error);
    throw error;
  }
}

async function handleSlotUpdate(data: SubscribeUpdate): Promise<void> {
  if (!data.slot) return;
  
  const monitor = getPerformanceMonitor();
  const dbOperationId = `db-slot-${Date.now()}`;
  
  try {
    monitor?.startTimer(dbOperationId, 'database_slot_insert');
    
    const { slot, parent } = data.slot;

    await client.slotUpdate.create({
      data: {
        slot: slot?.toString() || "0",
        parent: parent?.toString() || "0"
      }
    });

    // Record database operation timing
    const dbDuration = monitor?.endTimer(dbOperationId) || 0;
    monitor?.recordDatabaseOperation(dbDuration, true);

    console.log(chalk.yellow(`⏱️ Slot Update:`), slot);
  } catch (error) {
    const dbDuration = monitor?.endTimer(dbOperationId) || 0;
    monitor?.recordDatabaseOperation(dbDuration, false);
    console.error(chalk.red("❌ Error handling slot update:"), error);
    throw error;
  }
}

async function handleBlockUpdate(data: SubscribeUpdate): Promise<void> {
  if (!data.block) return;
  
  const monitor = getPerformanceMonitor();
  const dbOperationId = `db-block-${Date.now()}`;
  
  try {
    monitor?.startTimer(dbOperationId, 'database_block_insert');
    
    const block = data.block;

    if (block.blockHeight) {
      await client.blockUpdate.create({
        data: {
          blockhash: block.blockhash,
          blockHeight: block.blockHeight.blockHeight,
          blockTime: block.blockTime ? new Date(Number(block.blockTime.timestamp) * 1000) : null,
          parentSlot: block.parentSlot,
          parentBlockhash: block.parentBlockhash,
          executedTransactions: block.executedTransactionCount,
          updatedAccounts: block.updatedAccountCount,
          entries: block.entriesCount,
        }
      });

      // Record database operation timing
      const dbDuration = monitor?.endTimer(dbOperationId) || 0;
      monitor?.recordDatabaseOperation(dbDuration, true);

      console.log(chalk.blue(`🧱 Block Update:`), block.blockHeight.blockHeight);
    }
  } catch (error) {
    const dbDuration = monitor?.endTimer(dbOperationId) || 0;
    monitor?.recordDatabaseOperation(dbDuration, false);
    console.error(chalk.red("❌ Error handling block update:"), error);
    throw error;
  }
}

async function sendAlert(alertData: AlertData): Promise<void> {
  const monitor = getPerformanceMonitor();
  
  try {
    const alertSender = getAlertSender();
    if (alertSender) {
      await alertSender.sendAlert(alertData);
      monitor?.recordAlertSent(true);
    }
  } catch (error) {
    monitor?.recordAlertSent(false);
    console.error(chalk.red("❌ Failed to send alert:"), error);
  }
}

