"use client";

import { TransactionHistory } from "@/components/transaction-history";
import { Header } from "@/components/layout/header";

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <TransactionHistory />
      </main>
    </div>
  );
} 