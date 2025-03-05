# Monad Task Manager Contract Interfaces

This document provides detailed information about the contract interfaces used in the Monad Task Manager system. Understanding these interfaces is essential for developers who want to interact with or extend the Task Manager functionality.

## ITaskManager

The Task Manager contract is the core component for scheduling and executing tasks on the Monad blockchain.

### Core Functions

#### `scheduleTask`

Schedules a new task for execution at the target block.

```solidity
function scheduleTask(
    address implementation,
    uint256 taskGasLimit,
    uint64 targetBlock,
    uint256 maxPayment,
    bytes calldata taskCallData
) external payable returns (bool scheduled, uint256 executionCost, bytes32 taskId);
```

**Parameters:**

- `implementation`: Address of the execution environment
- `taskGasLimit`: Maximum gas for task execution
- `targetBlock`: Block number where the task should execute
- `maxPayment`: Maximum token amount to pay for execution
- `taskCallData`: Encoded call data for the task

**Returns:**

- `scheduled`: Whether the task was successfully scheduled
- `executionCost`: Estimated cost for task execution
- `taskId`: Unique identifier for the scheduled task

#### `executeTasks`

Executes pending tasks that have reached their target block.

```solidity
function executeTasks(
    address payoutAddress,
    uint256 gasLimit
) external returns (uint256 feesEarned);
```

**Parameters:**

- `payoutAddress`: Address to receive execution fees
- `gasLimit`: Maximum gas to use for execution (0 for auto)

**Returns:**

- `feesEarned`: Total fees earned from executed tasks

#### `cancelTask`

Cancels a scheduled task that hasn't been executed yet.

```solidity
function cancelTask(bytes32 taskId) external returns (bool);
```

**Parameters:**

- `taskId`: ID of the task to cancel

**Returns:**

- `bool`: Whether the cancellation was successful

### Query Functions

#### `isTaskExecuted`

Checks if a task has been executed.

```solidity
function isTaskExecuted(bytes32 taskId) external view returns (bool);
```

#### `getTaskStatus`

Retrieves the current status of a scheduled task.

```solidity
function getTaskStatus(bytes32 taskId) external view returns (
    uint8 status,
    uint64 scheduledBlock,
    uint64 targetBlock,
    address owner,
    uint256 feeEstimate
);
```

**Returns:**

- `status`: 0 (Pending), 1 (Executed), 2 (Failed), 3 (Cancelled)
- `scheduledBlock`: Block when the task was scheduled
- `targetBlock`: Block when the task should execute
- `owner`: Address that scheduled the task
- `feeEstimate`: Estimated fee for task execution

#### `estimateCost`

Estimates the cost of executing a task with the given parameters.

```solidity
function estimateCost(
    uint64 targetBlock,
    uint256 gasLimit
) external view returns (uint256);
```

## IShmonad

The Shmonad contract manages staking, unstaking, and bonding operations for the Task Manager system.

### Staking Functions

#### `stake`

Stakes TMON tokens to receive shMON tokens.

```solidity
function stake(uint256 amount) external;
```

#### `redeem`

Redeems shMON tokens for TMON tokens.

```solidity
function redeem(uint256 amount) external;
```

### Bonding Functions

#### `bond`

Bonds shMON tokens to a specific policy.

```solidity
function bond(uint256 policyId, uint256 amount) external;
```

#### `unbond`

Initiates unbonding of shMON tokens from a policy.

```solidity
function unbond(uint256 policyId, uint256 amount) external;
```

#### `claim`

Claims unbonded shMON tokens after the unbonding period.

```solidity
function claim(uint256 policyId, uint256 amount) external;
```

### Query Functions

#### `balanceOf`

Gets the shMON balance of an address.

```solidity
function balanceOf(address account) external view returns (uint256);
```

#### `bondedBalance`

Gets the total bonded balance of an address.

```solidity
function bondedBalance(address account) external view returns (uint256);
```

#### `bondedBalanceByPolicy`

Gets the bonded balance of an address for a specific policy.

```solidity
function bondedBalanceByPolicy(
    address account,
    uint256 policyId
) external view returns (uint256);
```

#### `unbondingBalance`

Gets the unbonding balance of an address for a policy.

```solidity
function unbondingBalance(
    address account,
    uint256 policyId
) external view returns (uint256);
```

#### `unbondingCompleteBlock`

Gets the block number when unbonding will be complete.

```solidity
function unbondingCompleteBlock(
    address account,
    uint256 policyId
) external view returns (uint64);
```

## IExecutionEnvironment

The Execution Environment interface defines how tasks are executed in isolated environments.

```solidity
interface ITaskExecutionEnvironment {
    function executeTask(bytes calldata taskData) external returns (bool success);
}
```

## IAddressHub

The Address Hub contract serves as a registry for system contracts.

```solidity
interface IAddressHub {
    function getTaskManagerAddress() external view returns (address);
    function getShmonadAddress() external view returns (address);
    // Other address lookup functions...
}
```

## Using Contract Interfaces

### Example: Scheduling a Task

```javascript
// Connect to contracts
const addressHub = new ethers.Contract(addressHubAddress, addressHubAbi, provider);
const taskManagerAddress = await addressHub.getTaskManagerAddress();
const taskManager = new ethers.Contract(taskManagerAddress, taskManagerAbi, signer);

// Prepare task data
const taskData = ethers.utils.defaultAbiCoder.encode(
  ['address', 'bytes'],
  [targetAddress, targetCallData]
);

// Schedule task
const tx = await taskManager.scheduleTask(
  executionEnvAddress,
  100000, // gas limit
  targetBlock,
  ethers.utils.parseEther('0.01'), // max payment
  taskData
);

const receipt = await tx.wait();
// Extract taskId from event logs
```

### Example: Staking and Bonding

```javascript
// Connect to shmonad contract
const shmonadAddress = await addressHub.getShmonadAddress();
const shmonad = new ethers.Contract(shmonadAddress, shmonadAbi, signer);

// Stake TMON
await shmonad.stake(ethers.utils.parseEther('10'));

// Bond shMON to policy
await shmonad.bond(1, ethers.utils.parseEther('5'));
```

## Events

### TaskManager Events

```solidity
event TaskScheduled(
    bytes32 indexed taskId,
    address indexed owner,
    uint64 scheduledBlock,
    uint64 targetBlock
);

event TaskExecuted(
    bytes32 indexed taskId,
    address indexed executor,
    bool success
);

event TaskCancelled(
    bytes32 indexed taskId,
    address indexed canceller
);
```

### Shmonad Events

```solidity
event Staked(address indexed account, uint256 amount);
event Redeemed(address indexed account, uint256 amount);
event Bonded(address indexed account, uint256 policyId, uint256 amount);
event Unbonded(address indexed account, uint256 policyId, uint256 amount);
event Claimed(address indexed account, uint256 policyId, uint256 amount);
```
