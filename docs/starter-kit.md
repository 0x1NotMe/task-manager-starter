# Monad Task Manager Starter Kit

This is the official starter kit for building task manager applications on the Monad blockchain. It provides a foundation for developers to build applications that interact with Monad's task scheduling and execution system.

## Overview

The **Task Manager DApp** is a decentralized application designed to:

- Schedule and manage tasks on the Monad blockchain
- Stake TMON tokens to receive shMON tokens
- Bond shMON tokens to the Task Manager contract
- Execute scheduled tasks at their target blocks

## Key Features

- **Token Management:**

  - Stake TMON tokens to receive shMON tokens
  - Redeem shMON tokens back to TMON tokens
  - Bond/unbond shMON tokens to the Task Manager for task scheduling

- **Task Scheduling:**

  - Schedule new tasks with custom parameters
  - Specify gas limits (small, medium, large) for different task complexities
  - Set target blocks for execution
  - Define maximum payment for task execution

- **Task Monitoring:**
  - View your scheduled tasks
  - Check task status and execution details
  - Monitor task bonding and execution costs

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- A wallet with Monad testnet tokens
- Basic understanding of React and Next.js

### Clone the Repository

```bash
git clone https://github.com/yourusername/task-manager-starter.git
cd task-manager-starter
```

### Install Dependencies

```bash
pnpm install
```

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

### Run the Development Server

```bash
pnpm dev
```

This will start the development server on http://localhost:3000.

## Core Concepts

### TMON vs. shMON

- **TMON** is the native token of the Monad network, used for paying transaction fees and staking.
- **shMON** is the staked version of TMON, representing your stake in the network.

### Staking and Bonding

- **Staking:** Convert TMON tokens to shMON tokens to participate in the network.
- **Bonding:** Lock your shMON tokens to a specific policy to enable task scheduling.

### Task Scheduling

Tasks require the following parameters:

- **Implementation Address:** The contract that will execute your task.
- **Gas Limit:** Maximum gas the task can consume.
  - Small: ≤ 100,000 gas
  - Medium: ≤ 250,000 gas
  - Large: ≤ 750,000 gas
- **Target Block:** The block at which the task will be executed.
- **Max Payment:** Maximum amount of MONAD tokens you're willing to pay.
- **Task Data:** Encoded function call data for the execution environment.

## System Architecture

The Task Manager system consists of several components:

1. **Task Manager Contract:** Core contract for scheduling and executing tasks.
2. **Execution Environment:** Isolated environment for task execution.
3. **shMON Contract:** Manages staked tokens and bonding.
4. **Address Hub:** Registry for system contracts.

## Extending the Starter Kit

You can extend this starter kit in several ways:

1. **Add Custom Tasks:** Define new task types with specialized execution logic.
2. **Enhance UI/UX:** Improve the user interface for better usability.
3. **Integrate External Services:** Connect to external data sources or APIs.
4. **Add Analytics:** Track and visualize task execution metrics.

## Contract Interfaces

The DApp interacts with several key contracts through their interfaces:

### ITaskManager

Core interface for scheduling and managing tasks:

```solidity
interface ITaskManager {
    function scheduleTask(
        address implementation,
        uint256 taskGasLimit,
        uint64 targetBlock,
        uint256 maxPayment,
        bytes calldata taskCallData
    ) external payable returns (bool scheduled, uint256 executionCost, bytes32 taskId);

    // Other functions for task management...
}
```

### IShmonad

Interface for staking and bonding operations:

```solidity
interface IShmonad {
    function stake(uint256 amount) external;
    function redeem(uint256 amount) external;
    function bond(uint256 policyId, uint256 amount) external;
    function unbond(uint256 policyId, uint256 amount) external;
    // Additional functions...
}
```

## Advanced Topics

For more detailed information about:

- Custom execution environments
- Rescheduling and retry logic
- Task cancellation and authorization
- Economic security and fee calculations

See the [Task Manager script README](https://github.com/monad-labs/task-manager-script/blob/main/README.md).

## Troubleshooting

Common issues and solutions:

- **Transaction Failed:** Ensure you have sufficient TMON tokens and gas.
- **Task Not Executing:** Verify the target block is greater than the current block.
- **Bonding Issues:** Check if you have enough unbonded shMON tokens.

## Resources

- [Monad Documentation](https://docs.monad.xyz/)
- [Task Manager GitHub Repository](https://github.com/monad-labs/task-manager)
- [Monad Discord Community](https://discord.gg/monad)
