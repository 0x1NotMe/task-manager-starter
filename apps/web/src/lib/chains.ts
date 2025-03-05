import { defineChain } from 'viem';
import { MONAD_CHAIN_ID } from '@/contracts/constants';

/**
 * Monad chain configuration
 * Update with actual values when available
 */
export const monad = defineChain({
  id: MONAD_CHAIN_ID,
  name: 'Monad',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MONAD',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://rpc.monad.xyz/testnet'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://rpc.monad.xyz/testnet'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://explorer.monad.xyz',
    },
  },
}); 