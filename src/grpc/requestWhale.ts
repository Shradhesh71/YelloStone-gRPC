import { SubscribeRequest, CommitmentLevel } from "@triton-one/yellowstone-grpc";
import { getAllTokenMints } from "../config/tokens";

// Focused subscription for whale movements only
export function createWhaleSubscribeRequest(): SubscribeRequest {
  const tokenMints = getAllTokenMints();
  
  return {
    accounts: {
      "whale_token_accounts": {
        account: tokenMints,
        owner: [],
        filters: []
      }
    },
    slots: {},
    transactions: {},
    transactionsStatus: {},
    entry: {},
    blocks: {},
    blocksMeta: {},
    commitment: CommitmentLevel.CONFIRMED,
    accountsDataSlice: [],
  };
}

// Minimal subscription - accounts only, no transactions
export function createMinimalSubscribeRequest(): SubscribeRequest {
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
        interslotUpdates: false
      }
    },
    transactions: {},
    transactionsStatus: {},
    entry: {},
    blocks: {},
    blocksMeta: {},
    commitment: CommitmentLevel.CONFIRMED,
    accountsDataSlice: [],
  };
}
