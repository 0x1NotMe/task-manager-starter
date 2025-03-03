"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parseEther, createPublicClient, http, maxUint256 } from 'viem';
import { monad } from '@/lib/chains';
import { useWallet } from '@/hooks/useWallet';
import { 
  TASK_MANAGER_POLICY_ID, 
  ADDRESS_HUB, 
  addressHubAbi,
  shmonadAbi,
  taskManagerAbi
} from '@/contracts/constants';
import { submitTransaction } from '@/lib/transactions';

// Initialize public client for read operations
const publicClient = createPublicClient({ 
  chain: monad,
  transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz')
});

// Get contract addresses from hub
async function getContractAddresses() {
  const addressHub = { 
    address: ADDRESS_HUB as `0x${string}`, 
    abi: addressHubAbi 
  };
  
  const taskManagerAddress = await publicClient.readContract({
    ...addressHub,
    functionName: 'taskManager',
  }) as `0x${string}`;
  
  const shmonadAddress = await publicClient.readContract({
    ...addressHub,
    functionName: 'shMonad',
  }) as `0x${string}`;
  
  return { 
    taskManagerAddress, 
    shmonadAddress
  };
}

// Get current policy ID from the Task Manager contract
async function getCurrentPolicyId() {
  try {
    const { taskManagerAddress } = await getContractAddresses();
    
    const policyId = await publicClient.readContract({
      address: taskManagerAddress,
      abi: taskManagerAbi,
      functionName: 'POLICY_ID',
    }) as bigint;
    
    console.log(`Fetched current policy ID: ${policyId}`);
    return Number(policyId);
  } catch (error) {
    console.error('Error fetching current policy ID:', error);
    // Fall back to constant if there's an error
    console.log(`Using fallback policy ID: ${TASK_MANAGER_POLICY_ID}`);
    return TASK_MANAGER_POLICY_ID;
  }
}

// Balance functions
async function getBondedBalance(address: `0x${string}`) {
  const { shmonadAddress } = await getContractAddresses();
  
  try {
    const balance = await publicClient.readContract({
      address: shmonadAddress,
      abi: shmonadAbi,
      functionName: 'balanceOfBonded',
      args: [address]
    }) as bigint;
    
    return balance;
  } catch (error) {
    console.error('Error getting bonded balance:', error);
    return 0n;
  }
}

async function getBondedBalanceByPolicy(address: `0x${string}`, policyId: number = TASK_MANAGER_POLICY_ID) {
  const { shmonadAddress } = await getContractAddresses();

  const abiFragment = [{
    type: 'function',
    name: 'balanceOfBonded',
    inputs: [
      { name: 'policyID', type: 'uint64', internalType: 'uint64' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  }];

  console.log(`Fetching bonded balance for address: ${address} with policy ID: ${policyId}`);

  try {
    const balance = await publicClient.readContract({
      address: shmonadAddress,
      abi: abiFragment,
      functionName: 'balanceOfBonded',
      args: [BigInt(policyId), address]
    }) as bigint;

    console.log(`Retrieved bonded balance: ${balance}`);
    return balance;
  } catch (error) {
    console.error('Error getting bonded balance by policy:', error);
    return 0n;
  }
}

async function getBalance(address: `0x${string}`) {
  console.log('Getting shMONAD balance for address:', address);
  const { shmonadAddress } = await getContractAddresses();
  console.log('shMONAD contract address:', shmonadAddress);
  
  try {
    const balance = await publicClient.readContract({
      address: shmonadAddress,
      abi: shmonadAbi,
      functionName: 'balanceOf',
      args: [address]
    }) as bigint;
    
    console.log('Retrieved shMONAD balance:', balance.toString());
    return balance;
  } catch (error) {
    console.error('Error getting shMONAD balance:', error);
    return 0n;
  }
}

async function getNativeBalance(address: `0x${string}`) {
  try {
    const balance = await publicClient.getBalance({
      address,
    });
    return balance;
  } catch (error) {
    console.error('Error getting native balance:', error);
    return 0n;
  }
}

async function getUnbondingCompleteBlock(address: `0x${string}`, policyId: number = TASK_MANAGER_POLICY_ID) {
  const { shmonadAddress } = await getContractAddresses();
  
  try {
    const unbondingCompleteBlock = await publicClient.readContract({
      address: shmonadAddress,
      abi: shmonadAbi,
      functionName: 'unbondingCompleteBlock',
      args: [BigInt(policyId), address]
    }) as bigint;
    
    return unbondingCompleteBlock;
  } catch (error) {
    console.error('Error getting unbonding complete block:', error);
    return 0n;
  }
}

async function getUnbondingBalance(address: `0x${string}`, policyId: number = TASK_MANAGER_POLICY_ID) {
  const { shmonadAddress } = await getContractAddresses();
  
  try {
    const unbondingBalance = await publicClient.readContract({
      address: shmonadAddress,
      abi: shmonadAbi,
      functionName: 'balanceOfUnbonding',
      args: [BigInt(policyId), address]
    }) as bigint;
    
    return unbondingBalance;
  } catch (error) {
    console.error('Error getting unbonding balance:', error);
    return 0n;
  }
}

async function getBalanceOfUnbonding(address: `0x${string}`, policyId: number = TASK_MANAGER_POLICY_ID) {
  const { shmonadAddress } = await getContractAddresses();

  try {
    const balance = await publicClient.readContract({
      address: shmonadAddress,
      abi: shmonadAbi,
      functionName: 'balanceOfUnbonding',
      args: [BigInt(policyId), address]
    }) as bigint;

    return balance;
  } catch (error) {
    console.error('Error getting balance of unbonding:', error);
    return 0n;
  }
}

// Balance hooks
export function useBondedBalance(address?: `0x${string}`) {
  const { address: walletAddress } = useWallet();
  const finalAddress = address || walletAddress;
  
  return useQuery({
    queryKey: ['bondedBalance', finalAddress],
    queryFn: async () => {
      if (!finalAddress) return 0n;
      console.log(`Fetching bonded balance for ${finalAddress}`);
      const balance = await getBondedBalance(finalAddress);
      console.log(`Bonded balance: ${balance}`);
      return balance;
    },
    refetchInterval: 15000,
    staleTime: 5000,
    enabled: !!finalAddress
  });
}

export function useBondedBalanceByPolicy(address?: `0x${string}`, policyId: number = TASK_MANAGER_POLICY_ID) {
  const { address: walletAddress } = useWallet();
  const finalAddress = address || walletAddress;
  
  return useQuery({
    queryKey: ['bondedBalanceByPolicy', finalAddress, policyId],
    queryFn: async () => {
      if (!finalAddress) return 0n;
      console.log(`Fetching bonded balance by policy for ${finalAddress} on policy ${policyId}`);
      const balance = await getBondedBalanceByPolicy(finalAddress, policyId);
      console.log(`Bonded balance for policy ${policyId}: ${balance}`);
      return balance;
    },
    refetchInterval: 15000,
    staleTime: 5000,
    enabled: !!finalAddress
  });
}

export function useBalance(address?: `0x${string}`) {
  const { address: walletAddress } = useWallet();
  const finalAddress = address || walletAddress;
  
  return useQuery({
    queryKey: ['balance', finalAddress],
    queryFn: async () => {
      if (!finalAddress) return 0n;
      console.log(`Fetching shMONAD balance for ${finalAddress}`);
      const balance = await getBalance(finalAddress);
      console.log(`shMONAD balance: ${balance}`);
      return balance;
    },
    refetchInterval: 15000,
    staleTime: 5000,
    enabled: !!finalAddress
  });
}

export function useNativeBalance(address?: `0x${string}`) {
  const { address: walletAddress } = useWallet();
  const finalAddress = address || walletAddress;
  
  return useQuery({
    queryKey: ['nativeBalance', finalAddress],
    queryFn: async () => {
      if (!finalAddress) return 0n;
      console.log(`Fetching native balance for ${finalAddress}`);
      const balance = await getNativeBalance(finalAddress);
      console.log(`Native balance: ${balance}`);
      return balance;
    },
    refetchInterval: 15000,
    staleTime: 5000,
    enabled: !!finalAddress
  });
}

export function useUnbondingCompleteBlock(address?: `0x${string}`, policyId: number = TASK_MANAGER_POLICY_ID) {
  const { address: walletAddress } = useWallet();
  const finalAddress = address || walletAddress;
  
  return useQuery({
    queryKey: ['unbondingCompleteBlock', finalAddress, policyId],
    queryFn: async () => {
      if (!finalAddress) return 0n;
      console.log(`Fetching unbonding complete block for ${finalAddress} on policy ${policyId}`);
      const block = await getUnbondingCompleteBlock(finalAddress, policyId);
      console.log(`Unbonding complete block for policy ${policyId}: ${block}`);
      return block;
    },
    refetchInterval: 15000,
    staleTime: 5000,
    enabled: !!finalAddress
  });
}

export function useUnbondingBalance(address?: `0x${string}`, policyId: number = TASK_MANAGER_POLICY_ID) {
  const { address: walletAddress } = useWallet();
  const finalAddress = address || walletAddress;
  
  return useQuery({
    queryKey: ['unbondingBalance', finalAddress, policyId],
    queryFn: async () => {
      if (!finalAddress) return 0n;
      console.log(`Fetching unbonding balance for ${finalAddress} on policy ${policyId}`);
      const balance = await getUnbondingBalance(finalAddress, policyId);
      console.log(`Unbonding balance for policy ${policyId}: ${balance}`);
      return balance;
    },
    refetchInterval: 15000,
    staleTime: 5000,
    enabled: !!finalAddress
  });
}

// Add a hook to get the current policy ID
export function useCurrentPolicyId() {
  return useQuery({
    queryKey: ['currentPolicyId'],
    queryFn: getCurrentPolicyId,
    staleTime: 1000 * 60 * 60, // 1 hour - policy ID rarely changes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (was cacheTime in v4)
  });
}

// Task scheduling hooks
export function useScheduleTask() {
  const { walletClient } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      implementation: `0x${string}`;
      taskGasLimit: bigint;
      targetBlock: bigint;
      maxPayment: bigint;
      taskData: `0x${string}`;
    }) => {
      if (!walletClient) {
        throw new Error('Wallet not connected');
      }
      
      const txPromise = scheduleTask({
        walletClient,
        ...params
      });
      
      // Use the transaction submission utility with transaction metadata
      await submitTransaction(txPromise, {
        method: 'scheduleTask',
        implementation: params.implementation,
        targetBlock: params.targetBlock.toString(),
        maxPayment: params.maxPayment.toString()
      });
      
      return txPromise;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      if (walletClient?.account?.address) {
        queryClient.invalidateQueries({ queryKey: ['tasksByOwner', walletClient.account.address] });
      }
    }
  });
}

// Task execution hooks
export function useExecuteTasks() {
  const { walletClient, address } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { payoutAddress?: `0x${string}`; maxTasks?: bigint }) => {
      if (!walletClient || !address) {
        throw new Error('Wallet not connected');
      }
      
      const txPromise = executeTasks({
        walletClient,
        payoutAddress: params?.payoutAddress || address,
        maxTasks: params?.maxTasks
      });
      
      // Use the transaction submission utility with transaction metadata
      await submitTransaction(txPromise, {
        method: 'executeTasks',
        payoutAddress: params?.payoutAddress || address,
        maxTasks: params?.maxTasks?.toString()
      });
      
      return txPromise;
    },
    onSuccess: () => {
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: ['tasksByOwner'] });
      queryClient.invalidateQueries({ queryKey: ['taskStatus'] });
    }
  });
}

// Task status hooks
export function useTaskStatus(taskId?: `0x${string}`) {
  return useQuery({
    queryKey: ['taskStatus', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      return getTaskStatus(taskId);
    },
    enabled: !!taskId
  });
}

export function useIsTaskExecuted(taskId?: `0x${string}`) {
  return useQuery({
    queryKey: ['isTaskExecuted', taskId],
    queryFn: () => taskId ? isTaskExecuted(taskId) : Promise.resolve(false),
    enabled: !!taskId
  });
}

// New deposit function hook
export function useDeposit() {
  const { walletClient, address: connectedAddress } = useWallet();
  
  return useMutation({
    mutationFn: async (params: { amount: string | bigint, receiver?: `0x${string}` }) => {
      console.log('Starting deposit with params:', params);
      
      if (!walletClient) {
        console.error('Wallet client not available');
        throw new Error('Wallet not connected');
      }
      
      const amount = typeof params.amount === 'string' 
        ? parseEther(params.amount) 
        : params.amount;
      
      console.log('Parsed amount:', amount.toString());

      // Use connected address directly from wallet hook
      if (!connectedAddress) {
        console.error('No wallet address connected');
        throw new Error('No account connected');
      }
      
      console.log('Connected address:', connectedAddress);

      // Get contract addresses from AddressHub
      const addressHub = { 
        address: ADDRESS_HUB as `0x${string}`, 
        abi: addressHubAbi 
      };

      console.log('AddressHub address:', ADDRESS_HUB);

      try {
        // Get shMONAD address by calling the addressHub contract with publicClient
        const shmonadAddress = await publicClient.readContract({
          ...addressHub,
          functionName: 'shMonad',
        }) as `0x${string}`;
        
        console.log('Got shMONAD address:', shmonadAddress);
        console.log('Depositing amount:', amount.toString());
        console.log('Receiver:', params.receiver || connectedAddress);
        
        // Prepare transaction
        const txPromise = walletClient.writeContract({
          chain: monad,
          address: shmonadAddress,
          abi: shmonadAbi,
          functionName: 'deposit',
          args: [amount, params.receiver || connectedAddress],
          account: connectedAddress,
          value: amount // Important for payable functions that require sending native tokens
        });
        
        // Use the transaction submission utility with transaction metadata
        await submitTransaction(txPromise, {
          method: 'deposit',
          amount: amount.toString(),
          receiver: params.receiver || connectedAddress
        });
        
        return txPromise;
      } catch (error) {
        console.error('Error in deposit transaction:', error);
        throw error;
      }
    }
  });
}

// Staking hooks
export function useStake() {
  const queryClient = useQueryClient();
  const { publicClient, walletClient } = useWallet();

  return useMutation({
    mutationFn: async (params: { amount: string | bigint; gasLimit?: bigint }) => {
      if (!walletClient) {
        throw new Error('Wallet not connected');
      }

      const amount = typeof params.amount === 'string'
        ? parseEther(params.amount)
        : params.amount;
      
      const txPromise = stake({
        walletClient,
        publicClient,
        amount,
        gasLimit: params.gasLimit
      });
      
      // Use the transaction submission utility with transaction metadata
      await submitTransaction(txPromise, {
        method: 'stake',
        amount: amount.toString()
      });
      
      return txPromise;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      if (walletClient?.account?.address) {
        // Invalidate shMONAD balance
        queryClient.invalidateQueries({ queryKey: ['balance', walletClient.account.address] });
        
        // Invalidate native MONAD balance
        queryClient.invalidateQueries({ queryKey: ['nativeBalance', walletClient.account.address] });
        
        // Also consider invalidating other related balances
        queryClient.invalidateQueries({ queryKey: ['bondedBalance', walletClient.account.address] });
        queryClient.invalidateQueries({ queryKey: ['bondedBalanceByPolicy', walletClient.account.address] });
        
        console.log('Invalidated balance queries after successful deposit');
      }
    }
  });
}

export function useUnstake() {
  const queryClient = useQueryClient();
  const { publicClient, walletClient } = useWallet();

  return useMutation({
    mutationFn: async (params: { amount: string | bigint; gasLimit?: bigint }) => {
      if (!walletClient) {
        throw new Error('Wallet not connected');
      }
      
      const amount = typeof params.amount === 'string'
        ? parseEther(params.amount)
        : params.amount;
      
      const txPromise = unstake({
        walletClient,
        publicClient,
        amount,
        gasLimit: params.gasLimit
      });
      
      // Use the transaction submission utility with transaction metadata
      await submitTransaction(txPromise, {
        method: 'unstake',
        amount: amount.toString()
      });
      
      return txPromise;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      if (walletClient?.account?.address) {
        queryClient.invalidateQueries({ queryKey: ['balance', walletClient.account.address] });
        queryClient.invalidateQueries({ queryKey: ['nativeBalance', walletClient.account.address] });
      }
    }
  });
}

// Bonding hooks
export function useDepositAndBond() {
  const queryClient = useQueryClient();
  const { publicClient, walletClient } = useWallet();
  const { data: currentPolicyId } = useCurrentPolicyId();

  return useMutation({
    mutationFn: async (params: {
      policyId?: number;
      amount: string | bigint;
      gasLimit?: bigint;
    }) => {
      if (!walletClient) {
        throw new Error('Wallet not connected');
      }

      const amount = typeof params.amount === 'string' 
        ? parseEther(params.amount) 
        : params.amount;

      // Use provided policy ID or the current one
      const policyId = params.policyId ?? currentPolicyId;

      const txPromise = depositAndBond({
        walletClient,
        publicClient,
        policyId,
        amount
      });
      
      // Use the transaction submission utility with transaction metadata
      await submitTransaction(txPromise, {
        method: 'depositAndBond',
        policyId: policyId?.toString(),
        amount: amount.toString()
      });
      
      return txPromise;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      if (walletClient?.account?.address) {
        queryClient.invalidateQueries({ queryKey: ['balance', walletClient.account.address] });
        queryClient.invalidateQueries({ queryKey: ['bondedBalance', walletClient.account.address] });
        queryClient.invalidateQueries({ queryKey: ['bondedBalanceByPolicy', walletClient.account.address] });
      }
    }
  });
}

// Direct bond hook (new)
export function useBond() {
  const { publicClient, walletClient } = useWallet();
  const queryClient = useQueryClient();
  const { data: currentPolicyId } = useCurrentPolicyId();

  return useMutation({
    mutationFn: async (params: { 
      policyId?: number;
      amount: string | bigint;
      gasLimit?: bigint;
    }) => {
      if (!walletClient) {
        throw new Error('Wallet not connected');
      }
      
      const amount = typeof params.amount === 'string' 
        ? parseEther(params.amount) 
        : params.amount;
      
      // Use provided policy ID or the current one
      const policyId = params.policyId ?? currentPolicyId;
      
      const txPromise = depositAndBond({
        walletClient,
        publicClient,
        policyId,
        amount
      });
      
      // Use the transaction submission utility with transaction metadata
      await submitTransaction(txPromise, {
        method: 'bond',
        policyId: policyId?.toString(),
        amount: amount.toString()
      });
      
      return txPromise;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      if (walletClient?.account?.address) {
        queryClient.invalidateQueries({ queryKey: ['balance', walletClient.account.address] });
        queryClient.invalidateQueries({ queryKey: ['bondedBalance', walletClient.account.address] });
        queryClient.invalidateQueries({ queryKey: ['bondedBalanceByPolicy', walletClient.account.address] });
      }
    }
  });
}

// Unbond hook
export function useUnbond() {
  const queryClient = useQueryClient();
  const { publicClient, walletClient } = useWallet();
  const { data: currentPolicyId } = useCurrentPolicyId();

  return useMutation({
    mutationFn: async (params: {
      policyId?: number;
      amount: string | bigint;
      gasLimit?: bigint;
    }) => {
      if (!walletClient) {
        throw new Error('Wallet not connected');
      }

      const amount = typeof params.amount === 'string'
        ? parseEther(params.amount)
        : params.amount;

      // Use provided policy ID or the current one
      const policyId = params.policyId ?? currentPolicyId;

      const txPromise = unbond({
        walletClient,
        publicClient,
        policyId,
        amount,
      });

      // Use the transaction submission utility with transaction metadata
      await submitTransaction(txPromise, {
        method: 'unbond',
        policyId: policyId?.toString(),
        amount: amount.toString()
      });

      return txPromise;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      if (walletClient?.account?.address) {
        queryClient.invalidateQueries({ queryKey: ['bondedBalance', walletClient.account.address] });
        queryClient.invalidateQueries({ queryKey: ['bondedBalanceByPolicy', walletClient.account.address] });
        queryClient.invalidateQueries({ queryKey: ['unbondingBalance', walletClient.account.address] });
        queryClient.invalidateQueries({ queryKey: ['unbondingCompleteBlock', walletClient.account.address] });
      }
    }
  });
}

export function useClaim() {
  const queryClient = useQueryClient();
  const { publicClient, walletClient } = useWallet();
  const { data: currentPolicyId } = useCurrentPolicyId();

  return useMutation({
    mutationFn: async (params: {
      policyId?: number;
      amount: string | bigint;
      gasLimit?: bigint;
    }) => {
      if (!walletClient) {
        throw new Error('Wallet not connected');
      }
      
      const amount = typeof params.amount === 'string' 
        ? parseEther(params.amount) 
        : params.amount;
      
      // Use provided policy ID or the current one
      const policyId = params.policyId ?? currentPolicyId;

      const txPromise = claim({
        walletClient,
        publicClient,
        policyId,
        amount,
        newMinBalance: maxUint256, // Using maxUint256 as default value
        gasLimit: params.gasLimit
      });
      
      // Use the transaction submission utility with transaction metadata
      await submitTransaction(txPromise, {
        method: 'claim',
        policyId: policyId?.toString(),
        amount: amount.toString()
      });
      
      return txPromise;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      if (walletClient?.account?.address) {
        queryClient.invalidateQueries({ queryKey: ['balance', walletClient.account.address] });
        queryClient.invalidateQueries({ queryKey: ['unbondingBalance', walletClient.account.address] });
        queryClient.invalidateQueries({ queryKey: ['unbondingCompleteBlock', walletClient.account.address] });
      }
    }
  });
}

// Direct redeem (withdraw) hook (new)
export function useRedeem() {
  const { publicClient, walletClient } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { 
      amount: string | bigint; 
      receiver?: `0x${string}`;
      gasLimit?: bigint;
    }) => {
      if (!walletClient) {
        throw new Error('Wallet not connected');
      }
      
      const amount = typeof params.amount === 'string' 
        ? parseEther(params.amount) 
        : params.amount;
      
      const txPromise = redeem({
        walletClient,
        publicClient,
        amount,
        receiver: params.receiver,
        gasLimit: params.gasLimit
      });
      
      // Use the transaction submission utility with transaction metadata
      await submitTransaction(txPromise, {
        method: 'redeem',
        amount: amount.toString(),
        receiver: params.receiver
      });
      
      return txPromise;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      if (walletClient?.account?.address) {
        queryClient.invalidateQueries({ queryKey: ['balance', walletClient.account.address] });
        queryClient.invalidateQueries({ queryKey: ['nativeBalance', walletClient.account.address] });
      }
    }
  });
}

// Task functions
async function scheduleTask({
  walletClient,
  implementation,
  taskGasLimit,
  targetBlock,
  maxPayment,
  taskData,
}: {
  walletClient: any;
  implementation: `0x${string}`;
  taskGasLimit: bigint;
  targetBlock: bigint;
  maxPayment: bigint;
  taskData: `0x${string}`;
}) {
  const { taskManagerAddress } = await getContractAddresses();
  const account = walletClient.account?.address as `0x${string}`;
  
  return walletClient.writeContract({
    chain: monad,
    address: taskManagerAddress,
    abi: taskManagerAbi,
    functionName: 'scheduleTask',
    args: [implementation, taskGasLimit, targetBlock, maxPayment, taskData],
    account
  });
}

async function executeTasks({
  walletClient,
  payoutAddress,
  maxTasks = 0n,
}: {
  walletClient: any;
  payoutAddress: `0x${string}`;
  maxTasks?: bigint;
}) {
  const { taskManagerAddress } = await getContractAddresses();
  const account = walletClient.account?.address as `0x${string}`;
  
  return walletClient.writeContract({
    chain: monad,
    address: taskManagerAddress,
    abi: taskManagerAbi,
    functionName: 'executeTasks',
    args: [payoutAddress, maxTasks],
    account
  });
}

async function getTaskStatus(taskId: `0x${string}`) {
  const { taskManagerAddress } = await getContractAddresses();
  
  try {
    const status = await publicClient.readContract({
      address: taskManagerAddress,
      abi: taskManagerAbi,
      functionName: 'getTaskStatus',
      args: [taskId]
    });
    return status;
  } catch (error) {
    console.error('Error getting task status:', error);
    return null;
  }
}

async function isTaskExecuted(taskId: `0x${string}`) {
  const { taskManagerAddress } = await getContractAddresses();
  
  try {
    const executed = await publicClient.readContract({
      address: taskManagerAddress,
      abi: taskManagerAbi,
      functionName: 'isTaskExecuted',
      args: [taskId]
    });
    return executed;
  } catch (error) {
    console.error('Error checking if task is executed:', error);
    return false;
  }
}

// Staking & bonding functions
async function stake({
  walletClient,
  publicClient,
  amount,
  gasLimit
}: {
  walletClient: any;
  publicClient: any;
  amount: bigint;
  gasLimit?: bigint;
}) {
  try {
    const { shmonadAddress } = await getContractAddresses();
    const { account } = walletClient;
    
    console.log(`Depositing ${amount} for account ${account.address}`);
    
    // First simulate the transaction to check for errors
    const { request } = await publicClient.simulateContract({
      chain: monad,
      address: shmonadAddress,
      abi: shmonadAbi,
      functionName: 'deposit',
      args: [amount, account.address],
      account: account,
      value: amount // Include the amount as value for native token transfer
    });
    
    // Prepare the transaction parameters
    const writeRequest = {
      ...request,
      value: amount // Include the amount as value for native token transfer
    };
    
    // Only add gas limit if explicitly provided
    if (gasLimit) {
      writeRequest.gas = gasLimit;
    }
    
    return walletClient.writeContract(writeRequest);
  } catch (error) {
    console.error('Error in deposit operation:', error);
    throw error;
  }
}

async function unstake({
  walletClient,
  publicClient,
  amount,
  gasLimit
}: {
  walletClient: any;
  publicClient: any;
  amount: bigint;
  gasLimit?: bigint;
}) {
  try {
    const { shmonadAddress } = await getContractAddresses();
    const { account } = walletClient;
    
    console.log(`Withdrawing ${amount} for account ${account.address}`);
    
    // First simulate the transaction to check for errors
    const { request } = await publicClient.simulateContract({
      chain: monad,
      address: shmonadAddress,
      abi: shmonadAbi,
      functionName: 'withdraw',
      args: [amount, account.address, account.address],
      account: account
    });
    
    // Prepare the transaction parameters
    const writeRequest = {
      ...request
    };
    
    // Only add gas limit if explicitly provided
    if (gasLimit) {
      writeRequest.gas = gasLimit;
    }
    
    return walletClient.writeContract(writeRequest);
  } catch (error) {
    console.error('Error in withdraw operation:', error);
    throw error;
  }
}

async function depositAndBond({
  walletClient,
  publicClient,
  policyId,
  amount,
  gasLimit
}: {
  walletClient: any;
  publicClient: any;
  policyId?: number;
  amount: bigint;
  gasLimit?: bigint;
}) {
  try {
    const { shmonadAddress } = await getContractAddresses();
    const { account } = walletClient;

    if (policyId === undefined) {
      policyId = await getCurrentPolicyId();
    }

    console.log(`Depositing and bonding ${amount} for account ${account.address} with policy ID ${policyId}`);

    const { request } = await publicClient.simulateContract({
      chain: monad,
      address: shmonadAddress,
      abi: shmonadAbi,
      functionName: 'depositAndBond',
      args: [BigInt(policyId), account.address, maxUint256],
      account,
      value: amount
    });

    const writeRequest = { ...request };

    if (gasLimit) {
      writeRequest.gas = gasLimit;
    }

    return walletClient.writeContract(writeRequest);
  } catch (error) {
    console.error('Error in depositAndBond operation:', error);
    throw error;
  }
}

async function unbond({
  walletClient,
  publicClient,
  policyId,
  amount,
}: {
  walletClient: any;
  publicClient: any;
  policyId?: number;
  amount: bigint;
}) {
  try {
    const { shmonadAddress } = await getContractAddresses();
    const { account } = walletClient;
    
    // If no policy ID provided, get the current one from the contract
    if (policyId === undefined) {
      policyId = await getCurrentPolicyId();
    }
    
    console.log(`Unbonding ${amount} for account ${account.address} with policy ID ${policyId}`);
    
    // Always use 0n as the minBalance, which means "unbond exactly the amount specified"
    const minBalance = 0n;
    
    console.log(`Using minBalance: ${minBalance}, amount: ${amount}, policy: ${policyId}`);
    
    // First simulate the transaction to check for errors
    const { request } = await publicClient.simulateContract({
      chain: monad,
      address: shmonadAddress,
      abi: shmonadAbi,
      functionName: 'unbond',
      args: [BigInt(policyId), amount, minBalance],
      account
    });
    
    // Execute the actual transaction with gas limit
    return walletClient.writeContract({
      ...request,
    });
  } catch (error) {
    console.error('Error in unbond operation:', error);
    throw error;
  }
}

async function claim({
  walletClient,
  publicClient,
  policyId,
  amount,
}: {
  walletClient: any;
  publicClient: any;
  policyId?: number;
  amount: bigint;
}) {
  try {
    const { shmonadAddress } = await getContractAddresses();
    const { account } = walletClient;
    
    // If no policy ID provided, get the current one from the contract
    if (policyId === undefined) {
      policyId = await getCurrentPolicyId();
    }
    
    console.log(`Claiming ${amount} for account ${account.address} with policy ID ${policyId}`);
    
    // First simulate the transaction to check for errors
    const { request } = await publicClient.simulateContract({
      chain: monad,
      address: shmonadAddress,
      abi: shmonadAbi,
      functionName: 'claim',
      args: [BigInt(policyId), amount],
      account
    });
    
    // Execute the actual transaction with gas limit
    return walletClient.writeContract({
      ...request,
    });
  } catch (error) {
    console.error('Error in claim operation:', error);
    throw error;
  }
}

async function redeem({
  walletClient,
  publicClient,
  amount,
  receiver,
  gasLimit
}: {
  walletClient: any;
  publicClient: any;
  amount: bigint;
  receiver?: `0x${string}`;
  gasLimit?: bigint;
}) {
  try {
    const { shmonadAddress } = await getContractAddresses();
    const account = walletClient.account?.address as `0x${string}`;
    
    console.log(`Redeeming ${amount} shares from ${account}, sending to ${receiver || account}`);
    
    // First simulate the transaction to check for errors
    const { request } = await publicClient.simulateContract({
      chain: monad,
      address: shmonadAddress,
      abi: shmonadAbi,
      functionName: 'redeem',
      args: [amount, receiver || account, account],
      account
    });
    
    // Prepare the transaction parameters
    const writeRequest = {
      ...request
    };
    
    // Only add gas limit if explicitly provided
    if (gasLimit) {
      writeRequest.gas = gasLimit;
    }
    
    // Execute the transaction
    return walletClient.writeContract(writeRequest);
  } catch (error) {
    console.error('Error redeeming:', error);
    throw error;
  }
}


// Export all functions
export {
  getContractAddresses,
  getCurrentPolicyId,
  getBondedBalance,
  getBondedBalanceByPolicy,
  getBalance,
  getNativeBalance,
  scheduleTask,
  executeTasks,
  getTaskStatus,
  isTaskExecuted,
  stake,
  unstake,
  depositAndBond,
  redeem
}; 