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
        interslotUpdates: false // Reduce noise
      }
    },
    transactions: {
      // Only track transactions that REQUIRE our tokens (more restrictive)
      "whale_transactions": {
        accountInclude: [],
        accountExclude: [],
        accountRequired: tokenMints, // This makes it more restrictive
        vote: false,
        failed: false,
      }
    },
    transactionsStatus: {},
    entry: {},
    blocks: {
      // "relevant_blocks": {
      //   accountInclude: tokenMints,
      //   includeTransactions: true,
      //   includeAccounts: false,
      //   includeEntries: false
      // }
      // Remove blocks to reduce data volume
    },
    blocksMeta: {},
    commitment: CommitmentLevel.CONFIRMED,
    accountsDataSlice: [],
  };
}

