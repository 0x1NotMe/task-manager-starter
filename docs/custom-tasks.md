# Creating Custom Tasks

This guide will walk you through the process of creating custom tasks for the Monad Task Manager. Custom tasks allow you to define specialized logic that will be executed automatically at a target block.

## Overview

A custom task consists of two main components:

1. **Execution Environment Contract:** A Solidity contract that implements the task execution logic
2. **Task Data:** Encoded call data that defines what the task should do

## Creating a Custom Execution Environment

### 1. Basic Execution Environment

Here's a simple execution environment that can forward calls to any target contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BasicExecutionEnvironment {
    address public immutable TASK_MANAGER;

    constructor(address taskManager_) {
        TASK_MANAGER = taskManager_;
    }

    // Optional: Add a modifier to restrict callers
    modifier onlyTaskManager() {
        require(msg.sender == TASK_MANAGER, "Only Task Manager");
        _;
    }

    // The main execution function
    function executeTask(bytes calldata taskData) external onlyTaskManager returns (bool) {
        // Decode the task data (target address and call data)
        (address target, bytes memory data) = abi.decode(taskData, (address, bytes));

        // Execute the call to the target contract
        (bool success,) = target.call(data);

        // Return true if the call was successful
        return success;
    }
}
```

### 2. Advanced Execution Environment with Retry Logic

For more robust tasks, you can implement an environment with automatic retry:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RetryExecutionEnvironment {
    address public immutable TASK_MANAGER;
    uint8 public constant MAX_RETRIES = 3;
    uint64 public constant RETRY_DELAY = 5; // blocks

    constructor(address taskManager_) {
        TASK_MANAGER = taskManager_;
    }

    // Events for tracking execution
    event TaskAttempted(address target, uint8 attempt, bool success);
    event TaskCompleted(address target, bool success);
    event TaskRescheduled(address target, uint64 newBlock);

    // Only allow the task manager to call this function
    modifier onlyTaskManager() {
        require(msg.sender == TASK_MANAGER, "Only Task Manager");
        _;
    }

    // Main execution function
    function executeTask(bytes calldata taskData) external onlyTaskManager returns (bool) {
        // Decode the task data (includes retry count)
        (address target, bytes memory data, uint8 retryCount) = abi.decode(
            taskData,
            (address, bytes, uint8)
        );

        // Execute the call
        (bool success,) = target.call(data);

        // Emit event
        emit TaskAttempted(target, retryCount, success);

        // If the call failed and we haven't hit max retries, schedule a retry
        if (!success && retryCount < MAX_RETRIES) {
            // Increment retry count
            retryCount++;

            // Encode data for retry
            bytes memory retryData = abi.encode(target, data, retryCount);

            // Calculate new target block
            uint64 newTargetBlock = uint64(block.number) + RETRY_DELAY;

            // Reschedule the task
            // Note: This requires calling the Task Manager contract
            // This is pseudocode - the actual implementation would need to call the Task Manager
            // taskManager.scheduleTask(address(this), gasLimit, newTargetBlock, maxPayment, retryData);

            emit TaskRescheduled(target, newTargetBlock);
            return true; // The execution was handled appropriately
        }

        // Emit completion event
        emit TaskCompleted(target, success);

        // Return true if the call was successful
        return success;
    }
}
```

## Preparing Task Data

Task data needs to be properly encoded before it can be scheduled. The encoding format depends on your execution environment's requirements.

### Basic Task Data Encoding

For the basic execution environment shown above:

```javascript
// Example using ethers.js

// 1. Define the target contract and function call
const targetContract = '0x123...'; // Address of the contract to call
const functionName = 'updatePrice';
const functionArgs = [100]; // Arguments to pass to the function

// 2. Encode the function call
const targetInterface = new ethers.utils.Interface(['function updatePrice(uint256 newPrice)']);
const targetCalldata = targetInterface.encodeFunctionData(functionName, functionArgs);

// 3. Pack the target address with the function call data
const taskData = ethers.utils.defaultAbiCoder.encode(
  ['address', 'bytes'],
  [targetContract, targetCalldata]
);

// 4. Now taskData is ready to be used in scheduleTask
```

### TypeScript Task Encoding with Viem

For modern TypeScript applications using Viem:

```typescript
import { encodeFunctionData, encodeAbiParameters, parseAbiParameters } from 'viem';

// 1. Define the target contract and ABI
const targetAddress = '0x123...' as `0x${string}`;
const targetAbi = [{
  name: 'updatePrice',
  type: 'function',
  inputs: [{ name: 'newPrice', type: 'uint256' }],
  outputs: [],
  stateMutability: 'nonpayable'
}];

// 2. Encode the function call
const targetCalldata = encodeFunctionData({
  abi: targetAbi,
  functionName: 'updatePrice',
  args: [100n] // BigInt for Viem
});

// 3. Pack the target address with the function call data
const taskData = encodeAbiParameters(
  parseAbiParameters(['address', 'bytes']),
  [targetAddress, targetCalldata]
);

// 4. Now taskData is ready to be used with the Task Manager
// Connect to Task Manager with Viem wallet client
const taskTxHash = await walletClient.writeContract({
  address: taskManagerAddress,
  abi: taskManagerAbi,
  functionName: 'scheduleTask',
  args: [
    executionEnvironmentAddress,
    100000n, // gas limit
    BigInt(targetBlock), // target block
    parseEther('0.01'), // max payment
    taskData // encoded task data
  ]
});

// Wait for transaction receipt
const receipt = await publicClient.waitForTransactionReceipt({ hash: taskTxHash });
```

### Advanced Task Data Encoding (with retry)

For the retry execution environment:

```javascript
// Additional parameter for retry count (starting at 0)
const taskData = ethers.utils.defaultAbiCoder.encode(
  ['address', 'bytes', 'uint8'],
  [targetContract, targetCalldata, 0] // 0 = initial attempt
);
```

Using Viem for the retry execution environment:

```typescript
// With retry parameter
const taskDataWithRetry = encodeAbiParameters(
  parseAbiParameters(['address', 'bytes', 'uint8']),
  [targetAddress, targetCalldata, 0] // 0 = initial attempt
);
```

## Scheduling Custom Tasks

Once you have your execution environment contract deployed and your task data encoded, you can schedule the task:

```javascript
// Connect to Task Manager contract
const taskManager = new ethers.Contract(taskManagerAddress, taskManagerAbi, signer);

// Schedule the task
const tx = await taskManager.scheduleTask(
  executionEnvironmentAddress, // Address of your deployed execution environment
  100000, // Gas limit for execution
  targetBlock, // Block number where the task should execute
  ethers.utils.parseEther('0.01'), // Maximum payment for execution
  taskData // The encoded task data prepared above
);

// Wait for transaction confirmation
const receipt = await tx.wait();

// Extract task ID from event logs
// This depends on how the Task Manager emits events
const taskId = extractTaskIdFromLogs(receipt.logs);
```

## Monitoring Custom Tasks

You can monitor your tasks using the Task Manager's query functions:

```javascript
// Check if a task has been executed
const isExecuted = await taskManager.isTaskExecuted(taskId);

// Get detailed task status
const status = await taskManager.getTaskStatus(taskId);
console.log(`
  Status: ${status.status}
  Scheduled Block: ${status.scheduledBlock}
  Target Block: ${status.targetBlock}
  Owner: ${status.owner}
  Fee Estimate: ${ethers.utils.formatEther(status.feeEstimate)} MONAD
`);
```

With Viem:

```typescript
// Check if a task has been executed
const isExecuted = await publicClient.readContract({
  address: taskManagerAddress,
  abi: taskManagerAbi,
  functionName: 'isTaskExecuted',
  args: [taskId]
});

// Get detailed task status
const status = await publicClient.readContract({
  address: taskManagerAddress,
  abi: taskManagerAbi,
  functionName: 'getTaskStatus',
  args: [taskId]
});

console.log(`
  Status: ${status[0]}
  Scheduled Block: ${status[1]}
  Target Block: ${status[2]}
  Owner: ${status[3]}
  Fee Estimate: ${formatEther(status[4])} MONAD
`);
```

## Example: Price Update Task

Here's a complete example that creates a task to update a price oracle:

```javascript
// Deploy the execution environment (one-time setup)
const ExecutionEnvironment = await ethers.getContractFactory('BasicExecutionEnvironment');
const executionEnv = await ExecutionEnvironment.deploy(taskManagerAddress);
await executionEnv.deployed();
console.log(`Execution Environment deployed at ${executionEnv.address}`);

// Define the price update task
const priceOracle = '0x456...'; // Price oracle contract
const priceOracleInterface = new ethers.utils.Interface([
  'function updatePrice(string symbol, uint256 price)',
]);
const updateCalldata = priceOracleInterface.encodeFunctionData('updatePrice', [
  'ETH',
  ethers.utils.parseUnits('1800', 18),
]);

// Encode the task data
const taskData = ethers.utils.defaultAbiCoder.encode(
  ['address', 'bytes'],
  [priceOracle, updateCalldata]
);

// Calculate target block (e.g., 1 hour from now, assuming 2-second blocks)
const blocksPerHour = (60 * 60) / 2; // 1800 blocks
const currentBlock = await ethers.provider.getBlockNumber();
const targetBlock = currentBlock + blocksPerHour;

// Schedule the task
const tx = await taskManager.scheduleTask(
  executionEnv.address,
  150000, // Gas limit
  targetBlock,
  ethers.utils.parseEther('0.005'), // Max payment
  taskData
);

const receipt = await tx.wait();
console.log(`Task scheduled in transaction ${receipt.transactionHash}`);
```

## TypeScript Example: Recurring Pricing Updates

Here's a complete example in TypeScript using Viem for a recurring price update task:

```typescript
import { 
  createPublicClient, createWalletClient, 
  http, parseAbiParameters, encodeFunctionData, 
  encodeAbiParameters, formatEther, parseEther 
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monad } from './chains';

// Setup clients
const publicClient = createPublicClient({
  chain: monad,
  transport: http(process.env.RPC_URL)
});

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account,
  chain: monad,
  transport: http(process.env.RPC_URL)
});

// Contract ABIs
const taskManagerAbi = [...]; // Task Manager ABI
const priceOracleAbi = [{
  name: 'updatePrice',
  type: 'function',
  inputs: [
    { name: 'symbol', type: 'string' },
    { name: 'price', type: 'uint256' }
  ],
  outputs: [],
  stateMutability: 'nonpayable'
}];

// Contract addresses
const taskManagerAddress = '0xTaskManager...' as `0x${string}`;
const executionEnvAddress = '0xExecutionEnv...' as `0x${string}`;
const priceOracleAddress = '0xPriceOracle...' as `0x${string}`;

async function scheduleRecurringPriceUpdate() {
  // 1. Get current block
  const currentBlock = await publicClient.getBlockNumber();
  
  // 2. Calculate target block (1 hour from now)
  const blocksPerHour = 1800n; // Assuming 2-second blocks
  const targetBlock = currentBlock + blocksPerHour;
  
  // 3. Encode the price update call
  const priceUpdateCalldata = encodeFunctionData({
    abi: priceOracleAbi,
    functionName: 'updatePrice',
    args: ['ETH', parseEther('1800')] // $1800 for ETH
  });
  
  // 4. Pack with target address
  const taskData = encodeAbiParameters(
    parseAbiParameters(['address', 'bytes']),
    [priceOracleAddress, priceUpdateCalldata]
  );
  
  // 5. Estimate task cost
  const estimatedCost = await publicClient.readContract({
    address: taskManagerAddress,
    abi: taskManagerAbi,
    functionName: 'estimateCost',
    args: [targetBlock, 150000n]
  });
  
  console.log(`Estimated task cost: ${formatEther(estimatedCost)} MONAD`);
  
  // 6. Schedule task with 2x cost buffer
  const maxPayment = estimatedCost * 2n;
  
  const txHash = await walletClient.writeContract({
    address: taskManagerAddress,
    abi: taskManagerAbi,
    functionName: 'scheduleTask',
    args: [
      executionEnvAddress,
      150000n, // Gas limit
      targetBlock,
      maxPayment,
      taskData
    ]
  });
  
  console.log(`Task scheduled in transaction: ${txHash}`);
  
  // 7. Wait for receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  
  // 8. Extract task ID from logs
  // This depends on how Task Manager emits events
  const taskScheduledEvent = receipt.logs.find(log => 
    log.topics[0] === '0x...' // Task scheduled event signature
  );
  
  // Assuming taskId is the second indexed parameter
  const taskId = taskScheduledEvent?.topics[1];
  console.log(`Task ID: ${taskId}`);
  
  return taskId;
}

// Call the function to schedule the task
scheduleRecurringPriceUpdate().catch(console.error);
```

## Best Practices for Custom Tasks

1. **Gas Optimization:**

   - Keep task execution as efficient as possible
   - Use appropriate gas limits for your task complexity

2. **Error Handling:**

   - Design your execution environment to handle failures gracefully
   - Consider implementing retry logic for transient failures

3. **Security Considerations:**

   - Use the `onlyTaskManager` modifier to restrict who can execute tasks
   - Validate all inputs in your execution environment
   - Be careful with contract state changes in execution environments

4. **Task Scheduling:**

   - Schedule tasks with reasonable buffer time
   - Consider gas price fluctuations when setting max payment

5. **Testing:**
   - Test your execution environment with different inputs
   - Verify task execution in a test environment before deploying to mainnet

## Additional References

For broader context and integration details, see the following local docs:
- [starter-kit.md](./starter-kit.md) – Provides an overview of the Task Manager Starter Kit and basic setup instructions.
- [interfaces.md](./interfaces.md) – Contains detailed contract interfaces, including ITaskManager, IShmonad, and IExecutionEnvironment definitions.
