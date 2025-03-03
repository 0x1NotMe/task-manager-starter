"use client";

import { useState } from 'react';
import { formatEther, parseEther } from 'viem';
import { useRedeem, useStake, useBalance, useNativeBalance, useCurrentPolicyId } from '@/hooks/useTaskManager';
import { formatBalance } from '@/lib/utils';
import { useWallet } from '@/hooks/useWallet';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';

export default function StakePage() {
  const { address, connectWallet, isConnecting } = useWallet();
  const { data: balance, isLoading: isLoadingBalance } = useBalance(address);
  const { data: nativeBalance, isLoading: isLoadingNativeBalance } = useNativeBalance(address);
  const { data: currentPolicyId, isLoading: isLoadingPolicyId } = useCurrentPolicyId();
  const { mutate: stake, isPending: isStaking } = useStake();
  const { mutate: redeem, isPending: isRedeeming } = useRedeem();
  
  // Add debug logging for balances
  console.log('Stake Page Balance Values:', {
    shMONBalance: balance ? balance.toString() : 'undefined',
    TMONBalance: nativeBalance ? nativeBalance.toString() : 'undefined',
    address
  });
  
  const [activeTab, setActiveTab] = useState<'stake' | 'redeem'>('stake');
  const [amount, setAmount] = useState('');
  const [actionSuccess, setActionSuccess] = useState(false);
  const [actionError, setActionError] = useState<Error | null>(null);
  
  const handleMaxAmount = () => {
    if (activeTab === 'stake' && nativeBalance && typeof nativeBalance === 'bigint') {
      setAmount(formatEther(nativeBalance));
    } else if (activeTab === 'redeem' && balance && typeof balance === 'bigint') {
      setAmount(formatEther(balance));
    }
  };
  
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
    
    console.log(`Initiating ${activeTab === 'stake' ? 'stake' : 'redeem'} action with amount: ${amount}`);
    
    try {
      if (activeTab === 'stake') {
        console.log('Calling stake with amount:', amount);
        stake({ 
          amount, 
          gasLimit: 180000n
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
      } else {
        console.log('Calling redeem with amount:', amount);
        redeem({ 
          amount, 
          gasLimit: 60000n
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
      console.error(`Error in ${activeTab} operation:`, error);
      setActionError(error instanceof Error ? error : new Error('Unknown error'));
    }
  };
  
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
        <div className="mb-6 text-center">
          <p className="text-gray-400 text-sm">Current Policy ID:</p>
          <p className="text-lg font-medium text-white">
            {isLoadingPolicyId ? 'Loading...' : currentPolicyId ?? 'Not available'}
          </p>
        </div>
        
        {/* Stake/Redeem Interface */}
        <div className="w-full max-w-md px-4">
          {/* Tabs */}
          <div className="rounded-full p-1 flex mb-6 bg-[#111827] w-fit mx-auto">
            <button
              type="button"
              className={cn(
                "px-8 py-2 rounded-full text-sm font-medium transition-colors",
                activeTab === 'stake' ? "bg-[#4845eb] text-white" : "text-gray-400"
              )}
              onClick={() => {
                setActiveTab('stake');
                setAmount('');
              }}
            >
              Stake
            </button>
            <button
              type="button"
              className={cn(
                "px-8 py-2 rounded-full text-sm font-medium transition-colors",
                activeTab === 'redeem' ? "bg-[#4845eb] text-white" : "text-gray-400"
              )}
              onClick={() => {
                setActiveTab('redeem');
                setAmount('');
              }}
            >
              Redeem
            </button>
          </div>
          
          {/* Available Balance Display */}
          {address && (
            <div className="mb-4">
              {activeTab === 'stake' ? (
                <>
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
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}
          
          {/* Input Area */}
          <div className="bg-[#111827] rounded-lg mb-3">
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-400 text-sm" htmlFor="amount-input">
                  Enter amount to {activeTab === 'stake' ? 'stake' : 'redeem'}
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
                  {activeTab === 'stake' ? (
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
            </div>
          </div>
          
          {/* Stake/Redeem Button */}
          <button
            type="button"
            className="w-full py-4 bg-[#4845eb] hover:bg-[#3f3ccf] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAction}
            disabled={isStaking || isRedeeming || (!address && isConnecting) || !amount || parseFloat(amount) <= 0}
          >
            {!address ? 'Connect wallet' : 
             isStaking || isRedeeming ? `${activeTab === 'stake' ? 'Staking' : 'Redeeming'}...` : 
             activeTab === 'stake' ? 'Stake' : 'Redeem'}
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
              {activeTab === 'stake' ? 'Tokens staked successfully!' : 'Tokens redeemed successfully!'}
            </div>
          )}
          
          {/* Exchange Rate */}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
            <span>Exchange Rate:</span>
            <span>1 TMON = 0.99940 shMON</span>
          </div>
        </div>
      </div>
    </>
  );
} 