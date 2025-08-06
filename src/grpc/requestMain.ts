import { SubscribeRequest, CommitmentLevel } from "@triton-one/yellowstone-grpc";
import { getAllTokenMints } from "../config/tokens";

export function createSubscribeRequest(): SubscribeRequest {
  const tokenMints = getAllTokenMints();
  
  return {
    accounts: {
      "token_accounts": {
        account: tokenMints,
        owner: [],
        filters: []
      }
    },
    slots: {
      "slot_updates": {
        filterByCommitment: true,
        interslotUpdates: false // Set to false to reduce noise
      }
    },
    transactions: {
      "all_transactions": {
        accountInclude: tokenMints,
        accountExclude: [],
        accountRequired: [],
        vote: false, // Exclude vote transactions
        failed: false, // Exclude failed transactions
      }
    },
    transactionsStatus: {},
    entry: {},
    blocks: {
      "relevant_blocks": {
        accountInclude: tokenMints,
        includeTransactions: true,
        includeAccounts: false,
        includeEntries: false
      }
    },
    blocksMeta: {},
    commitment: CommitmentLevel.CONFIRMED,
    accountsDataSlice: [],
  };
}

