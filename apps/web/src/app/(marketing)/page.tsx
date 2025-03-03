import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarClock, Wallet, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-black">
      {/* Hero Section */}
      <section className="space-y-6 pt-6 pb-8 md:pt-10 md:pb-12 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <Link
            href="https://github.com/monad-labs"
            className="rounded-2xl bg-muted px-4 py-1.5 font-medium text-sm"
            target="_blank"
          >
            Monad Labs
          </Link>
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            Task Manager DApp
          </h1>
          <p className="max-w-[42rem] text-muted-foreground leading-normal sm:text-xl sm:leading-8">
            Schedule and execute tasks on the Monad blockchain with staking, bonding, and secure management
          </p>
          <div className="space-x-4">
            <Link href="/tasks">
              <Button>
                Get Started <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
          
          {/* Feature Cards */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Tasks Card */}
            <div className="rounded-lg border bg-card p-6 shadow-sm flex flex-col h-full">
              <div className="flex items-center space-x-2">
                <CalendarClock className="size-5 text-primary" />
                <h3 className="text-lg font-semibold">Task Scheduling</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground flex-grow">
                Schedule tasks to be executed at specific blocks with customizable gas limits and fees
              </p>
              <Link href="/tasks" className="mt-4 inline-block text-sm font-medium text-primary self-start">
                Schedule Tasks →
              </Link>
            </div>
            
            {/* Staking Card */}
            <div className="rounded-lg border bg-card p-6 shadow-sm flex flex-col h-full">
              <div className="flex items-center space-x-2">
                <Wallet className="size-5 text-primary" />
                <h3 className="text-lg font-semibold">Token Staking</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground flex-grow">
                Stake your shMONAD tokens to earn rewards and participate in the ecosystem
              </p>
              <Link href="/stake" className="mt-4 inline-block text-sm font-medium text-primary self-start">
                Stake Tokens →
              </Link>
            </div>
            
            {/* Bonding Card */}
            <div className="rounded-lg border bg-card p-6 shadow-sm flex flex-col h-full">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="size-5 text-primary" />
                <h3 className="text-lg font-semibold">Token Bonding</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground flex-grow">
                Bond tokens to the Task Manager contract to ensure task execution with security
              </p>
              <Link href="/bond" className="mt-4 inline-block text-sm font-medium text-primary self-start">
                Bond Tokens →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
