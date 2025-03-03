"use client";

import { useState, useEffect, useCallback } from 'react';
import { createWalletClient, createPublicClient, custom, http, type WalletClient, type PublicClient } from 'viem';
import { monad } from '@/lib/chains';

// Create a singleton public client for read-only operations
export const getPublicClient = (): PublicClient => {
  return createPublicClient({
    chain: monad,
    transport: http('https://testnet-rpc.monad.xyz')
  });
};

export function useWallet() {
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [walletClient, setWalletClient] = useState<WalletClient | undefined>();
  const [publicClient, setPublicClient] = useState<PublicClient | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConnected = !!address;

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('No Ethereum provider found. Install MetaMask or another wallet.');
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet and try again.');
      }
      
      setAddress(accounts[0] as `0x${string}`);
      
      // Create wallet client
      const client = createWalletClient({
        chain: monad,
        transport: custom(window.ethereum),
        account: accounts[0] as `0x${string}`
      });
      
      setWalletClient(client);
      
      // Create public client using the same provider
      const pClient = createPublicClient({
        chain: monad,
        transport: custom(window.ethereum)
      });
      
      setPublicClient(pClient);
    } catch (err) {
      console.error('Error connecting to wallet:', err);
      setError(err instanceof Error ? err.message : 'Unknown error connecting to wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress(undefined);
    setWalletClient(undefined);
    setPublicClient(undefined);
    // Note: Ethereum providers don't have a standard disconnection method
    // We just clear the local state, and the UI will show as disconnected
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      connectWallet();
      
      // Listen for account changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setAddress(undefined);
          setWalletClient(undefined);
          setPublicClient(undefined);
        } else {
          setAddress(accounts[0] as `0x${string}`);
        }
      };
      
      // Listen for chain changes
      const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload();
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [connectWallet]);

  return { 
    address, 
    walletClient,
    publicClient,
    connectWallet,
    disconnectWallet, 
    isConnecting,
    isConnected, 
    error 
  };
} 