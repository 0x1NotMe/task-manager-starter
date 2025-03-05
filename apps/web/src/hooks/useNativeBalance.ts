"use client";

import { useQuery } from '@tanstack/react-query';
import { formatEther } from 'viem';
import { useWallet, getPublicClient } from './useWallet';

/**
 * Hook to get the native TMON balance for an address
 * Uses direct RPC calls to the blockchain
 */
export function useNativeBalance(address?: `0x${string}`) {
  const { address: walletAddress, publicClient: walletPublicClient } = useWallet();
  const finalAddress = address || walletAddress;
  
  return useQuery({
    queryKey: ['nativeBalance', finalAddress],
    queryFn: async () => {
      if (!finalAddress) return 0n;
      
      // Use the wallet's public client if available, otherwise use the default one
      const client = walletPublicClient || getPublicClient();
      
      try {
        const balance = await client.getBalance({
          address: finalAddress,
        });
        return balance;
      } catch (error) {
        console.error('Error fetching native balance:', error);
        return 0n;
      }
    },
    enabled: !!finalAddress,
    // Refresh every 30 seconds to keep the balance up to date
    refetchInterval: 30000
  });
}

/**
 * Format a balance with a specific number of decimal places
 */
export function formatBalance(value: unknown, decimals: number = 4): string {
  if (typeof value === 'bigint') {
    const formatted = formatEther(value);
    return parseFloat(formatted).toFixed(decimals);
  }
  return '0.' + '0'.repeat(decimals);
} 