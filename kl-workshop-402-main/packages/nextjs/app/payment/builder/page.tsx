import Link from "next/link";
import type { NextPage } from "next";
import { KL_FACTS } from "~~/data/klFacts";
import { KL_HIDDEN_GEMS } from "~~/data/klHiddenGems";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "KL Insider Guide",
  description: "Premium Kuala Lumpur facts and hidden gems unlocked via x402 payment",
});

const PaymentPage: NextPage = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-base-300 via-base-100 to-base-300">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-success/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 px-6 py-12 max-w-5xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-6">
            <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-semibold text-success">Payment Verified</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              KL Insider Guide
            </span>
          </h1>
          <p className="text-lg text-base-content/50 max-w-xl mx-auto">
            Welcome to your exclusive collection of Kuala Lumpur secrets. Here&apos;s what the locals know.
          </p>
        </div>

        {/* Quick Facts Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-base-content">Quick Facts</h2>
              <p className="text-sm text-base-content/50">Essential knowledge about KL</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {KL_FACTS.map(item => (
              <div
                key={item.title}
                className="group relative bg-base-100/80 backdrop-blur-sm rounded-xl border border-base-content/5 hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-secondary/50 to-accent/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl flex-shrink-0">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-base-content/5 text-base-content/50">
                          {item.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-base-content mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-base-content/60 leading-relaxed">{item.fact}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hidden Gems Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-xl">💎</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-base-content">Hidden Gems</h2>
              <p className="text-sm text-base-content/50">Secret spots the tourists don&apos;t know</p>
            </div>
          </div>

          <div className="space-y-5">
            {KL_HIDDEN_GEMS.map(gem => (
              <div
                key={gem.name}
                className="group relative bg-base-100/80 backdrop-blur-sm rounded-xl border border-base-content/5 hover:border-accent/20 transition-all duration-300 hover:shadow-xl hover:shadow-accent/5 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/50 via-primary/50 to-secondary/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <span className="text-5xl flex-shrink-0">{gem.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-xl font-bold text-base-content group-hover:text-accent transition-colors">
                          {gem.name}
                        </h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                          {gem.neighborhood}
                        </span>
                      </div>

                      <p className="text-base-content/70 leading-relaxed mb-4">{gem.description}</p>

                      <div className="bg-base-200/50 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                              Local Tip
                            </span>
                            <p className="text-sm text-base-content/60 mt-1">{gem.localTip}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-base-content/50">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          <strong>Best time:</strong> {gem.bestTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-2xl blur-xl" />

          <div className="relative bg-base-100/60 backdrop-blur-xl rounded-2xl border border-base-content/5 p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-black text-primary">$0.01</div>
                  <div className="text-xs text-base-content/40">Paid</div>
                </div>
                <div className="w-px h-10 bg-base-content/10" />
                <div className="text-center">
                  <div className="text-2xl font-black text-base-content">Base</div>
                  <div className="text-xs text-base-content/40">Network</div>
                </div>
                <div className="w-px h-10 bg-base-content/10" />
                <div className="text-center">
                  <div className="text-2xl font-black text-base-content">402</div>
                  <div className="text-xs text-base-content/40">Protocol</div>
                </div>
              </div>

              {/* Back button */}
              <Link href="/" className="btn btn-ghost btn-sm gap-2 text-base-content/60 hover:text-primary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Thank you note */}
        <p className="text-center text-sm text-base-content/30 mt-8">
          Thank you for supporting content creators with micropayments.
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;
