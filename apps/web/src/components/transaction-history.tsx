"use client";

import { useState, useEffect } from "react";
import { Transaction } from "@/types/transactions";
import { getTransactionHistory, clearTransactionHistory } from "@/lib/history";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLinkIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

// Set a default block explorer URL but allow override via environment variable
const BLOCK_EXPLORER_URL = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || "https://explorer.monad.xyz";

export function TransactionHistory() {
  const [history, setHistory] = useState<Transaction[]>([]);

  useEffect(() => {
    // Load history when component mounts
    const loadHistory = () => {
      const transactions = getTransactionHistory();
      
      // Sort by timestamp descending (newest first)
      const sortedTransactions = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
      
      setHistory(sortedTransactions);
    };

    loadHistory();

    // Listen for storage events to update the UI if another tab changes the history
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'txHistory') {
        loadHistory();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: number) => {
    try {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Handle clearing history
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all transaction history?')) {
      clearTransactionHistory();
      setHistory([]);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  // Format hash for display with defensive check
  const formatHash = (hash?: string) => {
    if (!hash || typeof hash !== 'string') {
      return 'Unknown';
    }
    
    // If it's an error ID or generated ID format, show a different format
    if (hash.startsWith('error-') || hash.startsWith('tx-') || hash.startsWith('pending-')) {
      return hash;
    }
    
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  // Format status with defensive check
  const formatStatus = (status?: string) => {
    if (!status || typeof status !== 'string') {
      return 'Unknown';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Display a message if no transactions
  if (history.length === 0) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-center text-gray-400">No transaction history available</p>
      </div>
    );
  }

  // Get method name from transaction data
  const getMethodName = (tx: Transaction) => {
    return tx.data?.method ? ` (${tx.data.method})` : '';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleClearHistory}
          className="h-9 px-3"
        >
          <Trash2Icon className="size-4 mr-2" />
          Clear History
        </Button>
      </div>
      
      <div className="overflow-x-auto rounded-md border border-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction Hash</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Age</TableHead>
              <TableHead className="text-right">Explorer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((tx) => (
              <TableRow key={tx.hash} className="border-b border-gray-800">
                <TableCell className="font-mono text-sm">
                  {formatHash(tx.hash)}
                  <span className="font-sans text-xs text-gray-400 ml-2">
                    {getMethodName(tx)}
                  </span>
                </TableCell>
                <TableCell className={getStatusColor(tx.status)}>
                  {formatStatus(tx.status)}
                </TableCell>
                <TableCell>{formatTimestamp(tx.timestamp)}</TableCell>
                <TableCell className="text-right">
                  {tx.hash && typeof tx.hash === 'string' && !tx.hash.startsWith('error-') && 
                   !tx.hash.startsWith('tx-') && !tx.hash.startsWith('pending-') ? (
                    <a 
                      href={`${BLOCK_EXPLORER_URL}/tx/${tx.hash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-500 hover:text-blue-400"
                    >
                      <span className="mr-1">View</span>
                      <ExternalLinkIcon className="size-4" />
                    </a>
                  ) : (
                    <span className="text-gray-500">Not available</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 