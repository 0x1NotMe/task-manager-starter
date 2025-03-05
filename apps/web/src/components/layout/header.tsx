"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useNativeBalance, formatBalance } from "@/hooks/useNativeBalance";
import { useBalance } from "@/hooks/useTaskManager";

// Navigation links
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/funds', label: 'Funds' },
  { href: '/history', label: 'History' },
  { href: '/docs', label: 'Docs' },
  { href: '/about', label: 'About' }
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const { data: nativeBalance, isLoading: isLoadingNativeBalance } = useNativeBalance(address);
  const { data: shMonBalance, isLoading: isLoadingShMonBalance } = useBalance(address);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="relative sticky top-0 z-50 border-b bg-black">
      <div className="container mx-auto px-6">
        <div className="flex items-center h-14">
          {/* Logo and App Name */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center">
                <Image
                  src="/shmonad_white.svg"
                  alt="shMonad Logo"
                  width={40}
                  height={20}
                  className="w-40 h-20"
                />
              </div>
            </Link>
          </div>
          
          {/* Spacer for better centering */}
          <div className="flex-1"></div>
          
          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center">
            <div className="flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-medium text-gray-300 text-sm hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
          
          {/* Another spacer for better centering */}
          <div className="flex-1"></div>
          
          {/* Wallet and Balance Info */}
          <div className="flex items-center">
            {isConnected ? (
              <div className="hidden md:flex items-center space-x-2">
                {/* Token balances */}
                <div className="flex space-x-2">
                  {/* TMON Balance */}
                  <div className="flex items-center rounded-full px-2 py-1">
                    <div className="h-2 w-2 bg-indigo-600 rounded-full mr-1.5"></div>
                    <span className="text-xs font-medium">
                      {isLoadingNativeBalance ? '...' : `${formatBalance(nativeBalance)} TMON`}
                    </span>
                  </div>
                  
                  {/* shMON Balance */}
                  <div className="flex items-center rounded-full px-2 py-1">
                    <div className="h-2 w-2 bg-[#4845eb] rounded-full mr-1.5"></div>
                    <span className="text-xs font-medium">
                      {isLoadingShMonBalance ? '...' : `${formatBalance(shMonBalance)} shMON`}
                    </span>
                  </div>
                </div>
                
                <span className="text-xs text-gray-400">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <Button variant="ghost" size="sm" className="text-xs h-8" onClick={disconnectWallet}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                className="hidden md:inline-flex h-8 text-xs"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              id="mobile-menu-button"
            >
              {isMenuOpen ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-x-0 top-[56px] bottom-0 bg-black md:hidden",
          "border-t border-gray-800",
          isMenuOpen ? "block" : "hidden",
        )}
        id="mobile-menu"
        aria-labelledby="mobile-menu-button"
      >
        <div className="flex flex-col space-y-4 p-4">
          <div className="flex flex-col space-y-2">
            {isConnected ? (
              <div className="flex flex-col space-y-2">
                {/* Display both token balances in mobile view */}
                <div className="flex flex-col space-y-2">
                  {/* TMON Balance */}
                  <div className="flex items-center space-x-1 bg-[#0f1729]/60 px-3 py-1 rounded-full border border-[#2d3748] w-fit">
                    <div className="h-2 w-2 bg-indigo-600 rounded-full"></div>
                    <span className="text-sm font-medium">
                      {isLoadingNativeBalance ? '...' : `${formatBalance(nativeBalance)} TMON`}
                    </span>
                  </div>
                  
                  {/* shMON Balance */}
                  <div className="flex items-center space-x-1 bg-[#0f1729]/60 px-3 py-1 rounded-full border border-[#2d3748] w-fit">
                    <div className="h-2 w-2 bg-[#4845eb] rounded-full"></div>
                    <span className="text-sm font-medium">
                      {isLoadingShMonBalance ? '...' : `${formatBalance(shMonBalance)} shMON`}
                    </span>
                  </div>
                </div>
                
                <span className="text-sm text-gray-400">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <Button variant="ghost" size="sm" onClick={disconnectWallet} className="w-full">
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>

          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium text-base text-gray-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
