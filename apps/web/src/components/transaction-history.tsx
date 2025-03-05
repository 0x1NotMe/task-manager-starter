"use client";

import { useState, useEffect } from "react";
import { Transaction } from "@/types/transactions";
import { getTransactionHistory, clearTransactionHistory } from "@/lib/history";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLinkIcon, Trash2Icon, AlertCircleIcon, CheckCircleIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatEther } from "viem";

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

  // Format timestamp to relative time and show exact date on hover
  const formatTimestampWithTooltip = (timestamp: number) => {
    try {
      const relativeTime = formatDistanceToNow(timestamp, { addSuffix: true });
      const exactDate = new Date(timestamp).toLocaleString();
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">{relativeTime}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{exactDate}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
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

  // Get status with icon and color
  const getStatusWithIcon = (tx: Transaction) => {
    const { status, data } = tx;
    const errorMessage = data?.error || getDefaultErrorMessage(status);
    
    switch (status) {
      case 'confirmed':
        return (
          <div className="flex items-center text-green-500">
            <CheckCircleIcon className="size-4 mr-1" />
            <span>Confirmed</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center text-yellow-500">
            <ClockIcon className="size-4 mr-1" />
            <span>Pending</span>
          </div>
        );
      case 'failed':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-red-500 cursor-help">
                  <AlertCircleIcon className="size-4 mr-1" />
                  <span>Failed</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{errorMessage}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return (
          <div className="text-gray-400">
            <span>Unknown</span>
          </div>
        );
    }
  };

  // Get default error message based on transaction status
  const getDefaultErrorMessage = (status: string) => {
    if (status !== 'failed') return '';
    
    return 'Transaction failed. This could be due to insufficient funds, rejected signature, or contract reversion.';
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
    
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // Format numeric values for better display
  const formatNumber = (value: string | number) => {
    if (!value) return '';
    
    try {
      // Try to format as Ether
      const formattedEther = formatEther(BigInt(value.toString()));
      
      // Format number with locale and limit decimals to 6 places
      const number = parseFloat(formattedEther);
      
      // Use a fixed number of decimal places only if needed
      if (number % 1 !== 0) {
        // For numbers with decimals, limit to 6 places
        const formatted = number.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 6
        });
        return formatted;
      } else {
        // For whole numbers, no decimal places
        return number.toLocaleString();
      }
    } catch (error) {
      // If formatEther fails, fall back to regular number formatting
      const numValue = typeof value === 'string' ? Number(value) : value;
      if (isNaN(numValue)) return value.toString();
      return numValue.toLocaleString();
    }
  };

  // Get method name with proper formatting
  const getActionName = (tx: Transaction) => {
    if (!tx.data?.method) return 'Transaction';
    
    // Convert camelCase or snake_case to Title Case with spaces
    const method = tx.data.method
      .replace(/([A-Z])/g, ' $1') // Convert camelCase to spaces
      .replace(/_/g, ' ')         // Convert snake_case to spaces
      .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
    
    return method.trim();
  };

  // Display a message if no transactions
  if (history.length === 0) {
    return (
      <div className="p-8 bg-gray-900 rounded-lg">
        <p className="text-center text-gray-400">No transaction history available</p>
      </div>
    );
  }

  // Render explorer link with hash
  const renderExplorerLink = (tx: Transaction) => {
    if (!tx.hash || 
        typeof tx.hash !== 'string' || 
        tx.hash.startsWith('error-') || 
        tx.hash.startsWith('tx-') || 
        tx.hash.startsWith('pending-')) {
      return <span className="text-gray-500">Not available</span>;
    }
    
    return (
      <a 
        href={`${BLOCK_EXPLORER_URL}/tx/${tx.hash}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center text-blue-500 hover:text-blue-400 font-mono"
      >
        {formatHash(tx.hash)}
        <ExternalLinkIcon className="size-4 ml-1" />
      </a>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Transaction History</h2>
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
      
      <div className="overflow-x-auto rounded-md border border-gray-800 bg-[#0f121a]">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-800">
              <TableHead>Tx Hash</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((tx) => (
              <TableRow key={tx.hash} className="border-b border-gray-800">
                <TableCell className="font-mono">
                  {renderExplorerLink(tx)}
                </TableCell>
                <TableCell>
                  {getActionName(tx)}
                  {tx.data?.amount && (
                    <span className="text-xs ml-2 text-gray-400">
                      {formatNumber(tx.data.amount)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {getStatusWithIcon(tx)}
                </TableCell>
                <TableCell>
                  {formatTimestampWithTooltip(tx.timestamp)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 