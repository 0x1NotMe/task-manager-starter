"use client";

import { useState, useEffect, useMemo } from 'react';
import { formatEther, parseEther } from 'viem';
import { 
  useBalance, 
  useBondedBalance, 
  useBondedBalanceByPolicy,
  useBond,
  useUnbond,
  useClaim,
  useUnbondingBalance,
  useUnbondingCompleteBlock,
  useCurrentPolicyId,
  useRedeem,
  useStake
} from '@/hooks/useTaskManager';
import { useNativeBalance } from '@/hooks/useTaskManager';
import { formatBalance } from '@/lib/utils';
import { useWallet } from '@/hooks/useWallet';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { createPublicClient, http } from 'viem';
import { monad } from '@/lib/chains';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FundsPage() {
  const { address, connectWallet, isConnecting } = useWallet();
  const { data: balance, isLoading: isLoadingBalance } = useBalance(address);
  const { data: nativeBalance, isLoading: isLoadingNativeBalance } = useNativeBalance(address);
  const { data: bondedBalance, isLoading: isLoadingBondedBalance } = useBondedBalance(address);
  const { data: currentPolicyId, isLoading: isLoadingPolicyId } = useCurrentPolicyId();
  const { data: policyBondedBalance, isLoading: isLoadingPolicyBondedBalance } = useBondedBalanceByPolicy(address, currentPolicyId);
  const { data: unbondingBalance, isLoading: isLoadingUnbondingBalance } = useUnbondingBalance(address, currentPolicyId);
  const { data: unbondingCompleteBlock, isLoading: isLoadingUnbondingBlock } = useUnbondingCompleteBlock(address, currentPolicyId);
  
  // Mutations
  const { mutate: bond, isPending: isBonding } = useBond();
  const { mutate: unbond, isPending: isUnbonding } = useUnbond();
  const { mutate: claim, isPending: isClaiming } = useClaim();
  const { mutate: stake, isPending: isStaking } = useStake();
  const { mutate: redeem, isPending: isRedeeming } = useRedeem();
  
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
  
  const handleMaxAmount = (tabValue: string) => {
    if (tabValue === 'deposit-bond' && nativeBalance && typeof nativeBalance === 'bigint') {
      setAmount(formatEther(nativeBalance));
    } else if (tabValue === 'bond' && balance && typeof balance === 'bigint') {
      setAmount(formatEther(balance));
    } else if (tabValue === 'unbond' && policyBondedBalance && typeof policyBondedBalance === 'bigint') {
      setAmount(formatEther(policyBondedBalance));
    } else if (tabValue === 'claim' && unbondingBalance && typeof unbondingBalance === 'bigint') {
      setAmount(formatEther(unbondingBalance));
    } else if (tabValue === 'stake' && nativeBalance && typeof nativeBalance === 'bigint') {
      setAmount(formatEther(nativeBalance));
    } else if (tabValue === 'redeem' && balance && typeof balance === 'bigint') {
      setAmount(formatEther(balance));
    }
  };
  
  // Set gas limits for different operations
  const unbondGasLimit = 180000n;
  const claimGasLimit = 63000n;
  const bondGasLimit = 180000n;
  const stakeGasLimit = 180000n;
  const redeemGasLimit = 60000n;
  
  const handleAction = (tabValue: string) => {
    if (!address) {
      connectWallet();
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }
    
    setActionSuccess(false);
    setActionError(null);
    
    console.log(`Initiating ${tabValue} action with amount: ${amount}`);
    
    try {
      if (tabValue === 'unbond') {
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
      } else if (tabValue === 'claim') {
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
      } else if (tabValue === 'bond' || tabValue === 'deposit-bond') {
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
      } else if (tabValue === 'stake') {
        console.log('Calling stake with amount:', amount);
        stake({ 
          amount, 
          gasLimit: stakeGasLimit
        }, {
          onSuccess: (hash) => {
            console.log('Stake transaction successful with hash:', hash);
            setActionSuccess(true);
            setAmount('');
          },
          onError: (error) => {
            console.error('Stake transaction failed:', error);
            setActionError(error instanceof Error ? error : new Error('Unknown error'));
          }
        });
      } else if (tabValue === 'redeem') {
        console.log('Calling redeem with amount:', amount);
        redeem({ 
          amount, 
          gasLimit: redeemGasLimit
        }, {
          onSuccess: (hash) => {
            console.log('Redeem transaction successful with hash:', hash);
            setActionSuccess(true);
            setAmount('');
          },
          onError: (error) => {
            console.error('Redeem transaction failed:', error);
            setActionError(error instanceof Error ? error : new Error('Unknown error'));
          }
        });
      }
    } catch (error) {
      console.error(`Error in ${tabValue} operation:`, error);
      setActionError(error instanceof Error ? error : new Error('Unknown error'));
    }
  };
  
  if (!address) {
    return (
      <>
        <Header />
        <div className="bg-black text-white container mx-auto p-6 flex flex-col items-center justify-center min-h-[calc(100vh-68px)]">
          <h1 className="text-2xl font-bold mb-6">Manage Tokens</h1>
          <p className="mb-4">Connect your wallet to stake, bond, unbond, and claim tokens</p>
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
        
        {/* Main Tabs Interface */}
        <div className="w-full max-w-md px-4">
          <Tabs defaultValue="stake" className="w-full">
            <TabsList className="w-full mb-6 bg-[#111827] p-1 rounded-full">
              <TabsTrigger 
                value="stake" 
                className="flex-1 rounded-full text-sm font-medium transition-colors data-[state=active]:bg-[#4845eb]"
              >
                Stake
              </TabsTrigger>
              <TabsTrigger 
                value="redeem" 
                className="flex-1 rounded-full text-sm font-medium transition-colors data-[state=active]:bg-[#4845eb]"
              >
                Redeem
              </TabsTrigger>
              <TabsTrigger 
                value="bond" 
                className="flex-1 rounded-full text-sm font-medium transition-colors data-[state=active]:bg-[#4845eb]"
              >
                Bond
              </TabsTrigger>
              <TabsTrigger 
                value="unbond" 
                className="flex-1 rounded-full text-sm font-medium transition-colors data-[state=active]:bg-[#4845eb]"
              >
                Unbond
              </TabsTrigger>
              <TabsTrigger 
                value="claim" 
                className="flex-1 rounded-full text-sm font-medium transition-colors data-[state=active]:bg-[#4845eb]"
              >
                Claim
              </TabsTrigger>
            </TabsList>
            
            {/* Stake Tab */}
            <TabsContent value="stake" className="space-y-4">
              {/* Available Balance Display */}
              <div className="mb-4">
                <div className="mb-3 pb-3 border-b border-gray-800">
                  <p className="text-white font-medium text-sm">
                    Available to Stake:
                  </p>
                  <p className="text-lg font-medium text-white">
                    {isLoadingNativeBalance ? '...' : `${formatBalance(nativeBalance)} TMON`}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">
                    Available to Redeem:
                  </p>
                  <p className="text-lg font-medium text-gray-400">
                    {isLoadingBalance ? '...' : `${formatBalance(balance)} shMON`}
                  </p>
                </div>
              </div>
              
              {/* Input Area */}
              <div className="bg-[#111827] rounded-lg mb-3">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-400 text-sm" htmlFor="stake-amount-input">
                      Enter amount to stake
                    </label>
                    <button 
                      type="button"
                      className="text-[#4845eb] text-sm font-medium"
                      onClick={() => handleMaxAmount('stake')}
                    >
                      MAX
                    </button>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="stake-amount-input"
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent text-white text-4xl font-light focus:outline-none"
                      placeholder="0"
                    />
                    <div className="flex items-center">
                      <div className="h-5 w-5 bg-[#4845eb] rounded-full mr-2 flex items-center justify-center">
                        <div className="h-2 w-2 bg-black rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">TMON</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                type="button"
                className="w-full py-4 bg-[#4845eb] hover:bg-[#3f3ccf] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleAction('stake')}
                disabled={isStaking || (!address && isConnecting) || !amount || parseFloat(amount) <= 0}
              >
                {!address ? 'Connect wallet' : isStaking ? 'Staking...' : 'Stake'}
              </button>
            </TabsContent>
            
            {/* Redeem Tab */}
            <TabsContent value="redeem" className="space-y-4">
              {/* Available Balance Display */}
              <div className="mb-4">
                <div className="mb-3 pb-3 border-b border-gray-800">
                  <p className="text-white font-medium text-sm">
                    Available to Redeem:
                  </p>
                  <p className="text-lg font-medium text-white">
                    {isLoadingBalance ? '...' : `${formatBalance(balance)} shMON`}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">
                    Available to Stake:
                  </p>
                  <p className="text-lg font-medium text-gray-400">
                    {isLoadingNativeBalance ? '...' : `${formatBalance(nativeBalance)} TMON`}
                  </p>
                </div>
              </div>
              
              {/* Input Area */}
              <div className="bg-[#111827] rounded-lg mb-3">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-400 text-sm" htmlFor="redeem-amount-input">
                      Enter amount to redeem
                    </label>
                    <button 
                      type="button"
                      className="text-[#4845eb] text-sm font-medium"
                      onClick={() => handleMaxAmount('redeem')}
                    >
                      MAX
                    </button>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="redeem-amount-input"
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent text-white text-4xl font-light focus:outline-none"
                      placeholder="0"
                    />
                    <span className="text-sm font-medium">shMON</span>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                type="button"
                className="w-full py-4 bg-[#4845eb] hover:bg-[#3f3ccf] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleAction('redeem')}
                disabled={isRedeeming || (!address && isConnecting) || !amount || parseFloat(amount) <= 0}
              >
                {!address ? 'Connect wallet' : isRedeeming ? 'Redeeming...' : 'Redeem'}
              </button>
            </TabsContent>
            
            {/* Bond Tab */}
            <TabsContent value="bond" className="space-y-4">
              {/* Available Balance Display */}
              <div className="mb-4">
                <div className="mb-3 pb-3 border-b border-gray-800">
                  <p className="text-white font-medium text-sm">
                    Available to Bond:
                  </p>
                  <p className="text-lg font-medium text-white">
                    {isLoadingBalance ? '...' : `${formatBalance(balance)} shMON`}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">
                    Currently Bonded:
                  </p>
                  <p className="text-lg font-medium text-gray-400">
                    {isLoadingPolicyBondedBalance ? '...' : `${formatBalance(policyBondedBalance)} shMON`}
                  </p>
                </div>
              </div>
              
              {/* Input Area */}
              <div className="bg-[#111827] rounded-lg mb-3">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-400 text-sm" htmlFor="bond-amount-input">
                      Enter amount to bond
                    </label>
                    <button 
                      type="button"
                      className="text-[#4845eb] text-sm font-medium"
                      onClick={() => handleMaxAmount('bond')}
                    >
                      MAX
                    </button>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="bond-amount-input"
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent text-white text-4xl font-light focus:outline-none"
                      placeholder="0"
                    />
                    <span className="text-sm font-medium">shMON</span>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                type="button"
                className="w-full py-4 bg-[#4845eb] hover:bg-[#3f3ccf] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleAction('bond')}
                disabled={isBonding || (!address && isConnecting) || !amount || parseFloat(amount) <= 0}
              >
                {!address ? 'Connect wallet' : isBonding ? 'Bonding...' : 'Bond'}
              </button>
            </TabsContent>
            
            {/* Unbond Tab */}
            <TabsContent value="unbond" className="space-y-4">
              {/* Available Balance Display */}
              <div className="mb-4">
                <div className="mb-3 pb-3 border-b border-gray-800">
                  <p className="text-white font-medium text-sm">
                    Available to Unbond:
                  </p>
                  <p className="text-lg font-medium text-white">
                    {isLoadingPolicyBondedBalance ? '...' : `${formatBalance(policyBondedBalance)} shMON`}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">
                    Unbonding in progress:
                  </p>
                  <p className="text-lg font-medium text-gray-400">
                    {isLoadingUnbondingBalance ? '...' : `${formatBalance(unbondingBalance)} shMON`}
                    {unbondingBalance && unbondingBalance > 0n && (
                      <span className="ml-2 text-sm">
                        ({blocksRemaining.toString()} blocks remaining)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Input Area */}
              <div className="bg-[#111827] rounded-lg mb-3">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-400 text-sm" htmlFor="unbond-amount-input">
                      Enter amount to unbond
                    </label>
                    <button 
                      type="button"
                      className="text-[#4845eb] text-sm font-medium"
                      onClick={() => handleMaxAmount('unbond')}
                    >
                      MAX
                    </button>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="unbond-amount-input"
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent text-white text-4xl font-light focus:outline-none"
                      placeholder="0"
                    />
                    <span className="text-sm font-medium">shMON</span>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                type="button"
                className="w-full py-4 bg-[#4845eb] hover:bg-[#3f3ccf] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleAction('unbond')}
                disabled={isUnbonding || (!address && isConnecting) || !amount || parseFloat(amount) <= 0}
              >
                {!address ? 'Connect wallet' : isUnbonding ? 'Unbonding...' : 'Unbond'}
              </button>
            </TabsContent>
            
            {/* Claim Tab */}
            <TabsContent value="claim" className="space-y-4">
              {/* Available Balance Display */}
              <div className="mb-4">
                <div className="mb-3 pb-3 border-b border-gray-800">
                  <p className="text-white font-medium text-sm">
                    Available to Claim:
                  </p>
                  <p className="text-lg font-medium text-white">
                    {isLoadingUnbondingBalance ? '...' : `${formatBalance(unbondingBalance)} shMON`}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">
                    Status:
                  </p>
                  <p className="text-lg font-medium text-gray-400">
                    {isUnbondingComplete ? (
                      <span className="text-green-400">Ready to claim</span>
                    ) : (
                      <span>
                        {blocksRemaining.toString()} blocks remaining before claim
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Input Area */}
              <div className="bg-[#111827] rounded-lg mb-3">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-400 text-sm" htmlFor="claim-amount-input">
                      Enter amount to claim
                    </label>
                    <button 
                      type="button"
                      className="text-[#4845eb] text-sm font-medium"
                      onClick={() => handleMaxAmount('claim')}
                    >
                      MAX
                    </button>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="claim-amount-input"
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent text-white text-4xl font-light focus:outline-none"
                      placeholder="0"
                    />
                    <span className="text-sm font-medium">shMON</span>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                type="button"
                className="w-full py-4 bg-[#4845eb] hover:bg-[#3f3ccf] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleAction('claim')}
                disabled={isClaiming || (!address && isConnecting) || !amount || parseFloat(amount) <= 0 || !isUnbondingComplete}
              >
                {!address ? 'Connect wallet' : isClaiming ? 'Claiming...' : 'Claim'}
              </button>
            </TabsContent>
          </Tabs>
          
          {/* Success/Error Messages */}
          {actionSuccess && (
            <div className="p-3 mt-4 bg-green-900/50 text-green-300 border border-green-800 rounded">
              Transaction submitted successfully!
            </div>
          )}
          
          {actionError && (
            <div className="p-3 mt-4 bg-red-900/50 text-red-300 border border-red-800 rounded">
              {actionError.message || 'Transaction failed'}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 