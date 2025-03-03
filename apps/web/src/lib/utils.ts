import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatEther } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBalance(balance: unknown, decimals = 6): string {
  if (!balance || typeof balance !== 'bigint') return '0';
  
  try {
    // Format with viem's formatEther and limit decimal places
    const formatted = parseFloat(formatEther(balance)).toFixed(decimals);
    
    // Remove trailing zeros and decimal point if needed
    return formatted.replace(/\.?0+$/, '');
  } catch (error) {
    console.error('Error formatting balance:', error);
    return '0';
  }
}
