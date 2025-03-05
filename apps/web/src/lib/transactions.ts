import { toast } from "sonner";
import { addTransactionToHistory } from "./history";
import { createPublicClient, http } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { monad } from "@/lib/chains";

// Initialize public client for read operations
const publicClient = createPublicClient({ 
  chain: monad,
  transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz')
});

export async function submitTransaction(txPromise: Promise<any>, options?: {
  method?: string;
  policyId?: string | number;
  amount?: string;
  [key: string]: any;
}): Promise<void> {
  const toastId = toast.loading("Transaction Submitted");
  let txHash: string | undefined = undefined;

  try {
    // Get the transaction hash
    txHash = await txPromise;
    
    // Update toast with hash information
    if (txHash) {
      toast.loading(`Transaction Submitted: ${txHash.slice(0, 6)}...${txHash.slice(-4)}`, { id: toastId });
    }
    
    // Generate a unique transaction ID for pending transactions that lack a hash
    const txId = txHash || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Add to history as pending
    addTransactionToHistory({ 
      hash: txId, 
      status: "pending", 
      timestamp: Date.now(),
      data: options
    });

    // Wait for transaction receipt using Viem
    let receipt;
    try {
      if (txHash) {
        // Use Viem's waitForTransactionReceipt for receipt monitoring
        receipt = await waitForTransactionReceipt(publicClient, {
          hash: txHash as `0x${string}`,
          confirmations: 1,
          timeout: 60_000, // 60 seconds timeout
        });
      }
    } catch (waitError) {
      console.error("Error waiting for transaction:", waitError);
      toast.error(`Transaction Confirmation Error: ${waitError instanceof Error ? waitError.message : 'Unknown error'}`, { id: toastId });
      
      // Update the transaction status to failed - use the same hash/ID to update not create new
      addTransactionToHistory({ 
        hash: txId, 
        status: "failed", 
        timestamp: Date.now(),
        data: {
          ...options,
          error: waitError instanceof Error ? waitError.message : 'Unknown error'
        }
      });
      return;
    }
    
    // Handle receipt status - in Viem, status is 'success' (1) or 'reverted' (0)
    const isSuccess = receipt?.status === 'success';
    
    if (isSuccess) {
      if (txHash) {
        toast.success(`Transaction Confirmed: ${txHash.slice(0, 6)}...${txHash.slice(-4)}`, { id: toastId });
      } else {
        toast.success("Transaction Confirmed", { id: toastId });
      }
      
      // Update existing transaction with confirmed status - use the same hash/ID
      addTransactionToHistory({ 
        hash: txId, 
        status: "confirmed", 
        timestamp: Date.now(),
        data: options
      });
    } else {
      if (txHash) {
        toast.error(`Transaction Failed: ${txHash.slice(0, 6)}...${txHash.slice(-4)}`, { id: toastId });
      } else {
        toast.error("Transaction Failed", { id: toastId });
      }
      
      // Update existing transaction with failed status - use the same hash/ID
      addTransactionToHistory({ 
        hash: txId, 
        status: "failed", 
        timestamp: Date.now(),
        data: options
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    toast.error(`Transaction Error: ${errorMessage}`, { id: toastId });
    
    // For transactions that fail before submission, generate a unique identifier
    const errorId = `error-${Date.now().toString()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Add failed transaction to history with the error identifier
    addTransactionToHistory({ 
      hash: txHash || errorId, 
      status: "failed", 
      timestamp: Date.now(),
      data: {
        ...options,
        error: errorMessage
      }
    });
  }
} 