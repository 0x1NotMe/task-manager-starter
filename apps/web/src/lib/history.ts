import { Transaction } from "@/types/transactions";

// Key used for storing transaction history in localStorage
const TX_HISTORY_KEY = 'txHistory';

/**
 * Add a transaction to the history or update an existing one
 */
export function addTransactionToHistory(tx: Transaction): void {
  try {
    // Get existing history from localStorage
    const historyStr = localStorage.getItem(TX_HISTORY_KEY);
    let history: Transaction[] = historyStr ? JSON.parse(historyStr) : [];
    
    // Add the new transaction with current timestamp if not provided
    const txWithTimestamp = {
      ...tx,
      timestamp: tx.timestamp || Date.now()
    };
    
    // Check if transaction with this hash already exists
    const existingTxIndex = history.findIndex(item => item.hash === tx.hash);
    
    if (existingTxIndex !== -1) {
      // If we're updating from pending to confirmed/failed, use the new status
      // Otherwise, don't overwrite a confirmed/failed status with a pending one
      const existingTx = history[existingTxIndex];
      
      if (existingTx.status === 'pending' || tx.status !== 'pending') {
        // Update the existing transaction
        history[existingTxIndex] = {
          ...existingTx,
          status: tx.status,
          data: { ...existingTx.data, ...tx.data }
        };
      }
    } else {
      // Add to the beginning of the array (newest first)
      history.unshift(txWithTimestamp);
    }
    
    // Limit history to the most recent 50 transactions
    const limitedHistory = history.slice(0, 50);
    
    // Save back to localStorage
    localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Error saving transaction history:', error);
  }
}

/**
 * Get the transaction history
 */
export function getTransactionHistory(): Transaction[] {
  try {
    const historyStr = localStorage.getItem(TX_HISTORY_KEY);
    return historyStr ? JSON.parse(historyStr) : [];
  } catch (error) {
    console.error('Error retrieving transaction history:', error);
    return [];
  }
}

/**
 * Clear the transaction history
 */
export function clearTransactionHistory(): void {
  localStorage.removeItem(TX_HISTORY_KEY);
} 