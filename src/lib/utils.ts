import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatiranje cen — različne decimalke glede na token
export function formatPrice(price: number, token: string): string {
  if (token === "XPR" || token === "LOAN") return price.toFixed(6);
  if (token === "METAL") return price.toFixed(6); // As per brief
  if (token === "XBTC") return price.toFixed(2);
  return price.toFixed(4); // Fallback
}

// Relative time format
export function timeAgo(unixTimestamp: number): string {
  if (!unixTimestamp) return "N/A";
  
  // Assuming unixTimestamp is in seconds from backend
  const diff = Math.floor(Date.now() / 1000 - unixTimestamp);
  
  if (diff < 60) return `${Math.max(0, diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// USD formatting
export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
