"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useNativeBalance, formatBalance } from "@/hooks/useNativeBalance";

// Add history to the navigation links
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/stake', label: 'Stake' },
  { href: '/bond', label: 'Bond' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/history', label: 'History' },
  { href: '/about', label: 'About' }
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const { data: nativeBalance, isLoading: isLoadingBalance } = useNativeBalance(address);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="relative sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="https://placehold.co/40x40"
                alt="Logo"
                width={40}
                height={40}
                className="h-8 w-auto"
              />
              <span className="font-bold text-xl">Task Manager</span>
            </Link>
          </div>
          <nav className="hidden space-x-4 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium text-muted-foreground text-sm hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-1 bg-[#0f1729]/60 px-3 py-1 rounded-full border border-[#2d3748]">
                  <div className="h-3 w-3 bg-indigo-600 rounded-full"></div>
                  <span className="text-sm font-medium">
                    {isLoadingBalance ? '...' : `${formatBalance(nativeBalance)} TMON`}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <Button variant="ghost" size="sm" onClick={disconnectWallet}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                className="hidden md:inline-flex"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>
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
              <X className="size-6" aria-hidden="true" />
            ) : (
              <Menu className="size-6" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-x-0 top-[68px] bottom-0 bg-background md:hidden",
          "border-t",
          isMenuOpen ? "block" : "hidden",
        )}
        id="mobile-menu"
        aria-labelledby="mobile-menu-button"
      >
        <div className="flex flex-col space-y-4 p-4">
          <div className="flex flex-col space-y-2">
            {isConnected ? (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-1 bg-[#0f1729]/60 px-3 py-1 rounded-full border border-[#2d3748] w-fit">
                  <div className="h-3 w-3 bg-indigo-600 rounded-full"></div>
                  <span className="text-sm font-medium">
                    {isLoadingBalance ? '...' : `${formatBalance(nativeBalance)} TMON`}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
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
                className="font-medium text-base text-muted-foreground hover:text-primary"
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
