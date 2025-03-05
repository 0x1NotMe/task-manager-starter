// Direct imports of JSON files with explicit type assertions
import TaskManagerAbi from '@/contracts/abis/ITaskManager.json';
import ShmonadAbi from '@/contracts/abis/IShmonad.json';
import AddressHubAbi from '@/contracts/abis/AddressHub.json';
import ExecutionEnvAbi from '@/contracts/abis/IExecutionEnvironment.json';

// Export the ABIs directly
export const contractAbis = [
  { name: "Task Manager", abi: TaskManagerAbi },
  { name: "SHMONAD", abi: ShmonadAbi },
  { name: "AddressHub", abi: AddressHubAbi },
  { name: "Execution Environment", abi: ExecutionEnvAbi },
];

// This function is no longer needed but kept for compatibility
export async function fetchContractAbis() {
  return contractAbis;
} 