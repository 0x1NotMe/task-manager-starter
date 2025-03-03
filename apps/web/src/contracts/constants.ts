// Monad Chain ID (Replace with actual chain ID when available)
export const MONAD_CHAIN_ID = 10143;

// Address Hub contract address (testnet)
export const ADDRESS_HUB = "0xC9f0cDE8316AbC5Efc8C3f5A6b571e815C021B51";

// Policy IDs
export const TASK_MANAGER_POLICY_ID = 1; // For task manager bonds

// Task Gas Categories
export const TASK_GAS_CATEGORIES = {
  SMALL: 100000n, // <= 100,000 gas
  MEDIUM: 250000n, // <= 250,000 gas
  LARGE: 750000n, // <= 750,000 gas
};

// Block time in seconds (used for estimating when a task will execute)
export const MONAD_BLOCK_TIME = 2; // seconds per block

// Contract ABIs
export { default as taskManagerAbi } from './abis/ITaskManager.json';
export { default as shmonadAbi } from './abis/IShmonad.json';
export { default as addressHubAbi } from './abis/AddressHub.json';
export { default as executionEnvironmentAbi } from './abis/IExecutionEnvironment.json'; 