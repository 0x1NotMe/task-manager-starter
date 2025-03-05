"use client";

import { useState, useEffect } from 'react';
import { parseEther, formatEther } from 'viem';
import { 
  useBondedBalance, 
  useScheduleTask, 
  useTaskStatus
} from '@/hooks/useTaskManager';
import { useWallet } from '@/hooks/useWallet';
import { TASK_GAS_CATEGORIES } from '@/contracts/constants';
import { Header } from '@/components/layout/header';
import { TermTooltip } from '@/components/ui/term-tooltip';

// Define the task status interface
interface TaskStatus {
  status: number;
  scheduledBlock: bigint;
  targetBlock: bigint;
  owner: `0x${string}`;
  feeEstimate: bigint;
}

export default function TasksPage() {
  const { address, connectWallet, isConnecting } = useWallet();
  const { data: bondedBalance, isLoading: isLoadingBalance } = useBondedBalance(address);
  const { data: taskIds, isLoading: isLoadingTasks } = {data: [], isLoading: false}; // TODO: Add tasks by owner
  const { mutate: scheduleTask, isPending: isScheduling, error: scheduleError } = useScheduleTask();
  
  // Safe array of task IDs
  const safeTaskIds: `0x${string}`[] = Array.isArray(taskIds) ? taskIds as `0x${string}`[] : [];
  
  const [currentBlock, setCurrentBlock] = useState<bigint>(0n);
  const [taskParams, setTaskParams] = useState({
    implementation: '',
    gasLimit: '100000',
    targetBlock: '',
    maxPayment: '0.01',
    taskData: ''
  });
  const [scheduledTaskId, setScheduledTaskId] = useState<`0x${string}` | null>(null);
  
  // Fetch current block number
  useEffect(() => {
    const fetchCurrentBlock = async () => {
      try {
        // This would normally use the publicClient from viem
        // For now, we'll just set a placeholder value
        setCurrentBlock(1000n);
      } catch (error) {
        console.error('Error fetching current block:', error);
      }
    };
    
    fetchCurrentBlock();
    const interval = setInterval(fetchCurrentBlock, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Update target block when current block changes
  useEffect(() => {
    if (currentBlock > 0n && !taskParams.targetBlock) {
      setTaskParams(prev => ({
        ...prev,
        targetBlock: (currentBlock + 10n).toString()
      }));
    }
  }, [currentBlock, taskParams.targetBlock]);
  
  const handleScheduleTask = () => {
    if (!address) {
      connectWallet();
      return;
    }
    
    try {
      scheduleTask({
        implementation: taskParams.implementation as `0x${string}`,
        taskGasLimit: BigInt(taskParams.gasLimit),
        targetBlock: BigInt(taskParams.targetBlock),
        maxPayment: parseEther(taskParams.maxPayment),
        taskData: taskParams.taskData as `0x${string}`
      }, {
        onSuccess: (data) => {
          // In a real implementation, we would extract the taskId from the transaction receipt
          // For now, we'll just set a placeholder
          setScheduledTaskId('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
          
          // Reset form
          setTaskParams({
            implementation: '',
            gasLimit: '100000',
            targetBlock: (currentBlock + 10n).toString(),
            maxPayment: '0.01',
            taskData: ''
          });
        }
      });
    } catch (error) {
      console.error('Error scheduling task:', error);
    }
  };
  
  // Helper function to safely format balances
  const formatBalance = (value: unknown): string => {
    if (typeof value === 'bigint') {
      return formatEther(value);
    }
    return '0.0';
  };
  
  if (!address) {
    return (
      <>
        <Header />
        <div className="bg-black text-white container mx-auto p-6 flex flex-col items-center justify-center min-h-[calc(100vh-68px)]">
          <h1 className="text-2xl font-bold mb-6">Task Manager</h1>
          <p className="mb-4">Connect your wallet to schedule and manage tasks</p>
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
      <div className="bg-black text-white container mx-auto p-6 min-h-[calc(100vh-68px)]">
        <h1 className="text-2xl font-bold mb-6">Task Manager</h1>
        
        <div className="mb-6 p-4 bg-[#0f1729]/60 border border-[#2d3748] rounded-md">
          <h2 className="text-lg font-semibold mb-2">Account Information</h2>
          <p className="mb-2">Connected Address: {address}</p>
          <p>Bonded Balance: {isLoadingBalance ? 'Loading...' : `${formatBalance(bondedBalance)} shMONAD`}</p>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Schedule New Task</h2>
          
          <div className="space-y-4 p-4 bg-[#0f1729]/60 border border-[#2d3748] rounded-md">
            <div>
              <label className="block mb-1">
                Implementation Address
                <TermTooltip 
                  term="" 
                  explanation="The smart contract address that will execute your task. This contract must implement the required execution environment interface."
                />
              </label>
              <input
                type="text"
                className="w-full p-2 bg-[#0a0f1d] border border-[#2d3748] rounded text-white"
                placeholder="0x..."
                value={taskParams.implementation}
                onChange={(e) => setTaskParams({ ...taskParams, implementation: e.target.value })}
              />
              <p className="text-sm text-gray-400 mt-1">The address of the execution environment contract</p>
            </div>
            
            <div>
              <label className="block mb-1">
                Gas Limit 
                <TermTooltip 
                  term="" 
                  explanation="Gas represents computational effort required to execute your task on-chain. Higher gas limits allow more complex operations but may cost more."
                />
              </label>
              <select
                className="w-full p-2 bg-[#0a0f1d] border border-[#2d3748] rounded text-white"
                value={taskParams.gasLimit}
                onChange={(e) => setTaskParams({ ...taskParams, gasLimit: e.target.value })}
              >
                <option value={TASK_GAS_CATEGORIES.SMALL.toString()}>
                  Small (≤ 100,000 gas)
                </option>
                <option value={TASK_GAS_CATEGORIES.MEDIUM.toString()}>
                  Medium (≤ 250,000 gas)
                </option>
                <option value={TASK_GAS_CATEGORIES.LARGE.toString()}>
                  Large (≤ 750,000 gas)
                </option>
              </select>
              <div className="text-sm text-gray-400 mt-1 space-y-1">
                <p>
                  <span className="font-medium text-gray-300">Small:</span> Simple token transfers or basic contract calls
                  <TermTooltip 
                    term="" 
                    explanation="Small gas category is suitable for simple tasks like token transfers or basic contract calls that don't require complex computation."
                  />
                </p>
                <p>
                  <span className="font-medium text-gray-300">Medium:</span> Swaps or multi-step transactions
                  <TermTooltip 
                    term="" 
                    explanation="Medium gas category is designed for moderately complex operations like swaps, multi-step transactions, or operations involving multiple contract interactions."
                  />
                </p>
                <p>
                  <span className="font-medium text-gray-300">Large:</span> Complex DeFi operations or batch transactions
                  <TermTooltip 
                    term="" 
                    explanation="Large gas category is for complex transactions that require significant computation, such as batch operations, complex DeFi interactions, or operations involving many contract calls."
                  />
                </p>
              </div>
            </div>
            
            <div>
              <label className="block mb-1">
                Target Block
                <TermTooltip 
                  term="" 
                  explanation="The block number at which your task will be executed. Must be greater than the current block."
                />
              </label>
              <input
                type="text"
                className="w-full p-2 bg-[#0a0f1d] border border-[#2d3748] rounded text-white"
                placeholder="Current block + 10"
                value={taskParams.targetBlock}
                onChange={(e) => setTaskParams({ ...taskParams, targetBlock: e.target.value })}
              />
              <p className="text-sm text-gray-400 mt-1">Current block: {currentBlock.toString()}</p>
            </div>
            
            <div>
              <label className="block mb-1">
                Max Payment (MONAD)
                <TermTooltip 
                  term="" 
                  explanation="The maximum amount of MONAD tokens you're willing to pay for task execution. Unused tokens will be refunded."
                />
              </label>
              <input
                type="text"
                className="w-full p-2 bg-[#0a0f1d] border border-[#2d3748] rounded text-white"
                placeholder="0.01"
                value={taskParams.maxPayment}
                onChange={(e) => setTaskParams({ ...taskParams, maxPayment: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block mb-1">
                Task Data (hex)
                <TermTooltip 
                  term="" 
                  explanation="The encoded function call data that will be passed to the execution environment. This is typically an ABI-encoded function call with parameters."
                />
              </label>
              <textarea
                className="w-full p-2 bg-[#0a0f1d] border border-[#2d3748] rounded text-white"
                placeholder="0x..."
                value={taskParams.taskData}
                onChange={(e) => setTaskParams({ ...taskParams, taskData: e.target.value })}
                rows={3}
              />
              <p className="text-sm text-gray-400 mt-1">Encoded task data for the execution environment</p>
            </div>
            
            {scheduleError && (
              <div className="p-3 bg-red-900/50 text-red-300 border border-red-800 rounded">
                {scheduleError instanceof Error ? scheduleError.message : 'Error scheduling task'}
              </div>
            )}
            
            {scheduledTaskId && (
              <div className="p-3 bg-green-900/50 text-green-300 border border-green-800 rounded">
                Task scheduled successfully! Task ID: {scheduledTaskId}
              </div>
            )}
            
            <button
              className="px-4 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded transition-colors disabled:opacity-50"
              onClick={handleScheduleTask}
              disabled={isScheduling}
            >
              {isScheduling ? 'Scheduling...' : 'Schedule Task'}
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Your Tasks</h2>
          
          {isLoadingTasks ? (
            <p>Loading your tasks...</p>
          ) : safeTaskIds.length > 0 ? (
            <div className="space-y-4">
              {safeTaskIds.map((taskId) => (
                <TaskItem key={taskId} taskId={taskId} />
              ))}
            </div>
          ) : (
            <p className="p-4 bg-[#0f1729]/60 border border-[#2d3748] rounded-md text-gray-400">You don't have any scheduled tasks yet.</p>
          )}
        </div>
      </div>
    </>
  );
}

function TaskItem({ taskId }: { taskId: `0x${string}` }) {
  const { data: taskStatus, isLoading } = useTaskStatus(taskId);
  
  if (isLoading) {
    return <div className="p-4 bg-[#0f1729]/60 border border-[#2d3748] rounded-md">Loading task {taskId.substring(0, 10)}...</div>;
  }
  
  if (!taskStatus) {
    return <div className="p-4 bg-[#0f1729]/60 border border-[#2d3748] rounded-md">Task not found</div>;
  }
  
  // Cast taskStatus to our interface
  const typedStatus = taskStatus as unknown as TaskStatus;
  
  return (
    <div className="p-4 bg-[#0f1729]/60 border border-[#2d3748] rounded-md">
      <p className="font-semibold">Task ID: {taskId.substring(0, 10)}...</p>
      <p>Status: {typedStatus.status === 0 ? 'Pending' : typedStatus.status === 1 ? 'Executed' : 'Failed'}</p>
      <p>Scheduled Block: {typedStatus.scheduledBlock.toString()}</p>
      <p>Target Block: {typedStatus.targetBlock.toString()}</p>
      <p>Owner: {typedStatus.owner.substring(0, 10)}...</p>
      <p>Fee Estimate: {formatEther(typedStatus.feeEstimate)} MONAD</p>
    </div>
  );
} 