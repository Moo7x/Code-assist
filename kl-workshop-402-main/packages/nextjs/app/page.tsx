import Link from "next/link";
import type { NextPage } from "next";
import { LockClosedIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-base-300 via-base-100 to-base-300">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 px-6 py-20 max-w-2xl mx-auto text-center">
        {/* Protocol badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-base-200/80 backdrop-blur-sm border border-base-content/10 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span className="text-sm font-medium tracking-wide text-base-content/70">HTTP 402 Protocol</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Premium Content
          </span>
          <br />
          <span className="text-base-content">One Click Away</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-base-content/60 mb-12 max-w-lg mx-auto leading-relaxed">
          Experience seamless micropayments. Unlock exclusive Kuala Lumpur insider knowledge with a single $0.01
          transaction.
        </p>

        {/* CTA Card */}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur-lg opacity-25 group-hover:opacity-50 transition-opacity duration-500" />

          <Link
            href="/payment/builder"
            className="relative flex flex-col items-center gap-6 bg-base-100/90 backdrop-blur-xl p-10 rounded-2xl border border-base-content/10 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
          >
            {/* Lock icon with ring */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/20">
                <LockClosedIcon className="w-8 h-8 text-primary" />
              </div>
            </div>

            {/* Content info */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-base-content">KL Insider Guide</h2>
              <p className="text-base-content/50">6 facts + 8 hidden gems with local tips</p>
            </div>

            {/* Price tag */}
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-primary">$0.01</span>
              <span className="text-base-content/40 text-sm">USDC on Base</span>
            </div>

            {/* Button indicator */}
            <div className="w-full flex items-center justify-center gap-2 text-lg font-bold text-primary">
              <span>Unlock Now</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-4 text-xs text-base-content/40">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Secure Payment
              </span>
              <span aria-hidden="true">•</span>
              <span>Instant Access</span>
              <span aria-hidden="true">•</span>
              <span>No Account Needed</span>
            </div>
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-12 text-sm text-base-content/30">
          Powered by{" "}
          <a
            href="https://www.x402.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/60 hover:text-primary transition-colors"
          >
            x402
          </a>{" "}
          &{" "}
          <a
            href="https://scaffoldeth.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/60 hover:text-primary transition-colors"
          >
            Scaffold-ETH 2
          </a>
        </p>
      </div>
    </div>
  );
};

export default Home;
