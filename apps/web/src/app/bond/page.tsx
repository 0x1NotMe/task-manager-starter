"use client";

import { useState, useEffect, useMemo } from 'react';
import { formatEther } from 'viem';
import { 
  useBalance, 
  useBondedBalance, 
  useBondedBalanceByPolicy,
  useBond,
  useUnbond,
  useClaim,
  useUnbondingBalance,
  useUnbondingCompleteBlock,
  useCurrentPolicyId
} from '@/hooks/useTaskManager';
import { useNativeBalance } from '@/hooks/useTaskManager';
import { formatBalance } from '@/lib/utils';
import { useWallet } from '@/hooks/useWallet';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { createPublicClient, http } from 'viem';
import { monad } from '@/lib/chains';

export default function BondPage() {
  const { address, connectWallet, isConnecting } = useWallet();
  const { data: balance, isLoading: isLoadingBalance } = useBalance(address);
  const { data: nativeBalance, isLoading: isLoadingNativeBalance } = useNativeBalance(address);
  const { data: bondedBalance, isLoading: isLoadingBondedBalance } = useBondedBalance(address);
  const { data: currentPolicyId, isLoading: isLoadingPolicyId } = useCurrentPolicyId();
  const { data: policyBondedBalance, isLoading: isLoadingPolicyBondedBalance } = useBondedBalanceByPolicy(address, currentPolicyId);
  const { data: unbondingBalance, isLoading: isLoadingUnbondingBalance } = useUnbondingBalance(address, currentPolicyId);
  const { data: unbondingCompleteBlock, isLoading: isLoadingUnbondingBlock } = useUnbondingCompleteBlock(address, currentPolicyId);
  const { mutate: bond, isPending: isBonding } = useBond();
  const { mutate: unbond, isPending: isUnbonding } = useUnbond();
  const { mutate: claim, isPending: isClaiming } = useClaim();
  
  const [activeTab, setActiveTab] = useState<'deposit-bond' | 'bond' | 'unbond' | 'claim'>('deposit-bond');
  const [amount, setAmount] = useState('');
  const [autoClaim, setAutoClaim] = useState(true);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [actionError, setActionError] = useState<Error | null>(null);
  
  // Add current block check
  const [currentBlock, setCurrentBlock] = useState<bigint>(0n);
  
  useEffect(() => {
    // Get current block number
    const getBlockNumber = async () => {
      try {
        const client = createPublicClient({ 
          chain: monad,
          transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz')
        });
        const blockNumber = await client.getBlockNumber();
        setCurrentBlock(blockNumber);
        
        // Poll for block updates
        const interval = setInterval(async () => {
          const updatedBlockNumber = await client.getBlockNumber();
          setCurrentBlock(updatedBlockNumber);
        }, 2000); // Check every 2 seconds
        
        return () => clearInterval(interval);
      } catch (error) {
        console.error('Error getting block number:', error);
      }
    };
    
    getBlockNumber();
  }, []);
  
  // Calculate if unbonding is complete
  const isUnbondingComplete = useMemo(() => {
    if (!unbondingCompleteBlock || unbondingCompleteBlock === 0n || !currentBlock) {
      return false;
    }
    return currentBlock >= unbondingCompleteBlock;
  }, [unbondingCompleteBlock, currentBlock]);
  
  // Calculate blocks remaining
  const blocksRemaining = useMemo(() => {
    if (!unbondingCompleteBlock || unbondingCompleteBlock === 0n || !currentBlock) {
      return 0n;
    }
    
    return unbondingCompleteBlock > currentBlock 
      ? unbondingCompleteBlock - currentBlock 
      : 0n;
  }, [unbondingCompleteBlock, currentBlock]);
  
  const handleMaxAmount = () => {
    if (activeTab === 'deposit-bond' && nativeBalance && typeof nativeBalance === 'bigint') {
      setAmount(formatEther(nativeBalance));
    } else if (activeTab === 'bond' && balance && typeof balance === 'bigint') {
      setAmount(formatEther(balance));
    } else if (activeTab === 'unbond' && policyBondedBalance && typeof policyBondedBalance === 'bigint') {
      setAmount(formatEther(policyBondedBalance));
    } else if (activeTab === 'claim' && unbondingBalance && typeof unbondingBalance === 'bigint') {
      setAmount(formatEther(unbondingBalance));
    }
  };
  
  // Set gas limits for different operations
  const unbondGasLimit = 180000n;
  const claimGasLimit = 63000n;
  const bondGasLimit = 180000n;
  
  const handleAction = () => {
    if (!address) {
      connectWallet();
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }
    
    setActionSuccess(false);
    setActionError(null);
    
    console.log(`Initiating ${activeTab} action with amount: ${amount}`);
    
    try {
      if (activeTab === 'unbond') {
        console.log(`Calling unbond with amount: ${amount}, using dynamic policy ID: ${currentPolicyId}`);
        unbond({
          amount,
          gasLimit: unbondGasLimit
        }, {
          onSuccess: (hash) => {
            console.log('Unbond transaction successful with hash:', hash);
            setActionSuccess(true);
            setAmount('');
          },
          onError: (error) => {
            console.error('Unbond transaction failed:', error);
            setActionError(error instanceof Error ? error : new Error('Unknown error'));
          }
        });
      } else if (activeTab === 'claim') {
        console.log(`Calling claim with amount: ${amount}, using dynamic policy ID: ${currentPolicyId}`);
        claim({
          amount,
          gasLimit: claimGasLimit
        }, {
          onSuccess: (hash) => {
            console.log('Claim transaction successful with hash:', hash);
            setActionSuccess(true);
            setAmount('');
          },
          onError: (error) => {
            console.error('Claim transaction failed:', error);
            setActionError(error instanceof Error ? error : new Error('Unknown error'));
          }
        });
      } else {
        console.log(`Calling bond with amount: ${amount}, using dynamic policy ID: ${currentPolicyId}`);
        bond({
          amount,
          gasLimit: bondGasLimit
        }, {
          onSuccess: (hash) => {
            console.log('Bond transaction successful with hash:', hash);
            setActionSuccess(true);
            setAmount('');
          },
          onError: (error) => {
            console.error('Bond transaction failed:', error);
            setActionError(error instanceof Error ? error : new Error('Unknown error'));
          }
        });
      }
    } catch (error) {
      console.error(`Error in ${activeTab} operation:`, error);
      setActionError(error instanceof Error ? error : new Error('Unknown error'));
    }
  };
  
  if (!address) {
    return (
      <>
        <Header />
        <div className="bg-black text-white container mx-auto p-6 flex flex-col items-center justify-center min-h-[calc(100vh-68px)]">
          <h1 className="text-2xl font-bold mb-6">Bond Tokens</h1>
          <p className="mb-4">Connect your wallet to bond tokens to the Task Manager</p>
          <button 
            className="px-4 py-2 bg-[#4f46e5] text-white rounded disabled:opacity-50"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-68px)] bg-black flex flex-col items-center pt-12 text-white">
        {/* shMonad Logo and testnet label */}
        <div className="flex items-center mb-8">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-[#4845eb] rounded-full mr-3 flex items-center justify-center">
              <div className="h-4 w-4 bg-black rounded-full"></div>
            </div>
            <span className="text-white text-2xl font-bold">shMonad</span>
          </div>
          <span className="ml-3 text-xs py-0.5 px-2 rounded border border-gray-700 text-gray-300">testnet</span>
        </div>
        
        {/* Policy ID Display */}
        <div className="mb-6 text-center flex flex-col items-center gap-2">
          <div className="inline-flex items-center px-3 py-1 bg-[#111827] rounded-md">
            <span className="text-gray-400 text-sm">Current Policy ID:</span>
            <span className="text-white text-sm ml-1">
              {isLoadingPolicyId ? 'Loading...' : currentPolicyId ?? 'Not available'}
            </span>
          </div>
          <div className="px-3 py-1 bg-[#111827] rounded-md inline-block">
            <p className="text-xs text-gray-400">
              Current Block: {currentBlock > 0n ? currentBlock.toString() : 'Loading...'}
            </p>
          </div>
        </div>
        
        {/* Bond Interface */}
        <div className="w-full max-w-md px-4">
          {/* Tabs */}
          <div className="rounded-full p-1 flex mb-6 bg-[#111827] w-fit mx-auto">
            <button
              type="button"
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-colors",
                activeTab === 'deposit-bond' ? "bg-[#4845eb] text-white" : "text-gray-400"
              )}
              onClick={() => {
                setActiveTab('deposit-bond');
                setAmount('');
              }}
            >
              Deposit+Bond
            </button>
            <button
              type="button"
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-colors",
                activeTab === 'bond' ? "bg-[#4845eb] text-white" : "text-gray-400"
              )}
              onClick={() => {
                setActiveTab('bond');
                setAmount('');
              }}
            >
              Bond Only
            </button>
            <button
              type="button"
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-colors",
                activeTab === 'unbond' ? "bg-[#4845eb] text-white" : "text-gray-400"
              )}
              onClick={() => {
                setActiveTab('unbond');
                setAmount('');
              }}
            >
              Unbond
            </button>
            <button
              type="button"
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-colors",
                activeTab === 'claim' ? "bg-[#4845eb] text-white" : "text-gray-400"
              )}
              onClick={() => {
                setActiveTab('claim');
                setAmount('');
              }}
            >
              Claim
            </button>
          </div>
          
          {/* Available Balance Display - Grouped Visually */}
          <div className="mb-4 bg-[#111827] rounded-lg p-4">
            {activeTab === 'deposit-bond' ? (
              <>
                <div className="mb-3 pb-3 border-b border-gray-800">
                  <p className="text-white font-medium text-sm">Available to Deposit & Bond:</p>
                  <p className="text-lg font-medium text-white">
                    {isLoadingNativeBalance ? '...' : `${formatBalance(nativeBalance)} TMON`}
                  </p>
                </div>
                <div className="mb-3 pb-3">
                  <p className="text-gray-400 text-sm">Available to Bond:</p>
                  <p className="text-lg font-medium text-gray-400">
                    {isLoadingBalance ? '...' : `${formatBalance(balance)} shMON`}
                  </p>
                </div>
              </>
            ) : activeTab === 'bond' ? (
              <>
                <div className="mb-3 pb-3 border-b border-gray-800">
                  <p className="text-white font-medium text-sm">Available to Bond:</p>
                  <p className="text-lg font-medium text-white">
                    {isLoadingBalance ? '...' : `${formatBalance(balance)} shMON`}
                  </p>
                </div>
                <div className="mb-3 pb-3">
                  <p className="text-gray-400 text-sm">Available to Deposit & Bond:</p>
                  <p className="text-lg font-medium text-gray-400">
                    {isLoadingNativeBalance ? '...' : `${formatBalance(nativeBalance)} TMON`}
                  </p>
                </div>
              </>
            ) : activeTab === 'claim' ? (
              <>
                <div className="mb-3 pb-3 border-b border-gray-800">
                  <p className="text-white font-medium text-sm">Available to Claim:</p>
                  <p className="text-lg font-medium text-white">
                    {isLoadingUnbondingBalance ? '...' : `${formatBalance(unbondingBalance)} shMON`}
                  </p>
                </div>
                {unbondingBalance && unbondingBalance > 0n && (
                  <div className="pt-3 mt-3 border-t border-gray-800">
                    <p className="text-gray-400 text-sm">Currently Unbonding:</p>
                    <p className="text-lg font-medium text-amber-500">
                      {isLoadingUnbondingBalance ? '...' : `${formatBalance(unbondingBalance)} shMON`}
                    </p>
                    {!isLoadingUnbondingBlock && unbondingCompleteBlock && unbondingCompleteBlock > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Available at block: {unbondingCompleteBlock.toString()}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-3 pb-3 border-b border-gray-800">
                  <p className="text-white font-medium text-sm">Available to Unbond:</p>
                  <p className="text-lg font-medium text-white">
                    {isLoadingPolicyBondedBalance ? '...' : `${formatBalance(policyBondedBalance)} shMON`}
                  </p>
                </div>
                {unbondingBalance && unbondingBalance > 0n && (
                  <div className="pt-3 mt-3 border-t border-gray-800">
                    <p className="text-gray-400 text-sm">Currently Unbonding:</p>
                    <p className="text-lg font-medium text-amber-500">
                      {isLoadingUnbondingBalance ? '...' : `${formatBalance(unbondingBalance)} shMON`}
                    </p>
                    {!isLoadingUnbondingBlock && unbondingCompleteBlock && unbondingCompleteBlock > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Available at block: {unbondingCompleteBlock.toString()}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="pt-3 border-t border-gray-800">
              <p className="text-gray-400 text-sm">Task Manager Bonded:</p>
              <p className="text-lg font-medium">
                {isLoadingPolicyBondedBalance ? '...' : `${formatBalance(policyBondedBalance)} shMON`}
              </p>
            </div>
          </div>
          
          {/* Input Area */}
          <div className="bg-[#111827] rounded-lg mb-3">
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-400 text-sm" htmlFor="amount-input">
                  {activeTab === 'deposit-bond' 
                    ? 'Enter amount to deposit & bond' 
                    : activeTab === 'bond'
                      ? 'Enter amount to bond'
                      : activeTab === 'unbond' ? 'Enter amount to unbond' : 'Enter amount to claim'}
                </label>
                <button 
                  type="button"
                  className="text-[#4845eb] text-sm font-medium"
                  onClick={handleMaxAmount}
                >
                  MAX
                </button>
              </div>
              <div className="flex items-center">
                <input
                  id="amount-input"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent text-white text-4xl font-light focus:outline-none"
                  placeholder="0"
                />
                <div className="flex items-center">
                  {activeTab === 'deposit-bond' ? (
                    <>
                      <div className="h-5 w-5 bg-[#4845eb] rounded-full mr-2 flex items-center justify-center">
                        <div className="h-2 w-2 bg-black rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">TMON</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium">shMON</span>
                  )}
                </div>
              </div>
              
              {/* Auto-claim checkbox for unbond tab */}
              {activeTab === 'unbond' && (
                <div className="mt-4 flex items-center">
                  <input
                    type="checkbox"
                    id="auto-claim"
                    checked={autoClaim}
                    onChange={(e) => setAutoClaim(e.target.checked)}
                    className="size-4 rounded border-gray-700 text-[#4845eb] focus:ring-[#4845eb]"
                  />
                  <label htmlFor="auto-claim" className="ml-2 text-sm text-gray-400">
                    Auto-claim after 6 seconds
                  </label>
                </div>
              )}
            </div>
          </div>
          
          {/* Claim specific display */}
          {activeTab === 'claim' && (
            <div className="mt-3 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Current block:</span>
                <span className="font-medium">{currentBlock.toString()}</span>
              </div>
              
              {unbondingCompleteBlock && unbondingCompleteBlock > 0n && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-400">Unbond complete at block:</span>
                  <span className="font-medium">{unbondingCompleteBlock.toString()}</span>
                </div>
              )}
              
              {blocksRemaining > 0n ? (
                <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-800 rounded text-sm text-yellow-300">
                  Waiting for {blocksRemaining.toString()} more block{blocksRemaining === 1n ? '' : 's'} before claiming is available. 
                  Each block takes approximately 500ms.
                </div>
              ) : unbondingBalance && unbondingBalance > 0n ? (
                <div className="mt-2 p-2 bg-green-900/30 border border-green-800 rounded text-sm text-green-300">
                  Unbonding period complete! You can now claim your tokens.
                </div>
              ) : null}
            </div>
          )}
          
          {/* Action Button */}
          <button
            type="button"
            className="w-full py-4 bg-[#4845eb] hover:bg-[#3f3ccf] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAction}
            disabled={
              isBonding || 
              isUnbonding || 
              isClaiming || 
              (!address && isConnecting) || 
              !amount || 
              parseFloat(amount) <= 0 ||
              // Disable claim button if unbonding not complete
              (activeTab === 'claim' && !isUnbondingComplete && unbondingBalance && unbondingBalance > 0n ? true : false)
            }
          >
            {!address ? 'Connect wallet' : 
             isBonding || isUnbonding || isClaiming ? `${activeTab === 'unbond' ? 'Unbonding' : activeTab === 'claim' ? 'Claiming' : 'Bonding'}...` : 
             activeTab === 'deposit-bond' ? 'Deposit & Bond' : 
             activeTab === 'bond' ? 'Bond' : 
             activeTab === 'unbond' ? 'Unbond' : 
             // Show waiting message if needed
             (!isUnbondingComplete && unbondingBalance && unbondingBalance > 0n) ? 
              `Waiting for ${blocksRemaining.toString()} block${blocksRemaining === 1n ? '' : 's'}` : 
              'Claim'
            }
          </button>
          
          {/* Error Display */}
          {actionError && (
            <div className="p-3 mt-4 bg-red-900/50 text-red-300 border border-red-800 rounded">
              {actionError.message || 'Error performing action'}
            </div>
          )}
          
          {/* Success Display */}
          {actionSuccess && (
            <div className="p-3 mt-4 bg-green-900/50 text-green-300 border border-green-800 rounded">
              {activeTab === 'deposit-bond' ? 'Tokens deposited and bonded successfully!' : 
               activeTab === 'bond' ? 'Tokens bonded successfully!' :
               activeTab === 'unbond' ? 'Tokens unbonded successfully!' :
               activeTab === 'claim' ? 'Tokens claimed successfully!' : 'Error'}
            </div>
          )}
        </div>
        
        {/* Accordion for About Bonding Section */}
        <details className="mt-8 w-full max-w-md px-4 bg-[#0f1729]/60 border border-[#2d3748] rounded-md">
          <summary className="cursor-pointer p-4 font-semibold text-lg">About Bonding</summary>
          <div className="p-4 space-y-3 text-gray-400">
            <p>
              <strong>Bonding</strong> is the process of locking your shMONAD tokens to a 
              policy contract like Task Manager. Bonded tokens act as a security deposit for 
              scheduling tasks.
            </p>
            <p>
              <strong>Bond Requirements:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Small tasks (≤ 100,000 gas): Minimum 0.01 shMONAD</li>
              <li>Medium tasks (≤ 250,000 gas): Minimum 0.025 shMONAD</li>
              <li>Large tasks (≤ 750,000 gas): Minimum 0.075 shMONAD</li>
              <li>For high-value tasks, consider bonding more than the minimum</li>
            </ul>
            <p>
              <strong>Unbonding Process (2 steps):</strong>
            </p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>
                <strong>Step 1: Unbond</strong> - Initiates the unbonding process. The tokens 
                enter an "unbonding" state for 10 blocks (approximately 5 seconds).
              </li>
              <li>
                <strong>Step 2: Claim</strong> - After the unbonding period completes, you must 
                claim your tokens to make them available for use.
              </li>
            </ol>
            <p>
              You can enable "Auto-claim" to automatically claim your tokens after 6 seconds
              when initiating an unbonding operation.
            </p>
          </div>
        </details>
        
        <div className="mt-4 p-4 bg-[#0f1729]/60 border border-indigo-900/50 rounded-md">
          <h3 className="font-semibold text-indigo-300">Bond Requirements</h3>
          <ul className="list-disc list-inside mt-2 text-indigo-200">
            <li>Small tasks (≤ 100,000 gas): Minimum 0.01 shMONAD</li>
            <li>Medium tasks (≤ 250,000 gas): Minimum 0.025 shMONAD</li>
            <li>Large tasks (≤ 750,000 gas): Minimum 0.075 shMONAD</li>
            <li>For high-value tasks, consider bonding more than the minimum</li>
          </ul>
        </div>
      </div>
    </>
  );
}
