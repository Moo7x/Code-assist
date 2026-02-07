"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { hardhat } from "viem/chains";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <div className="sticky top-0 navbar bg-base-100/80 backdrop-blur-md min-h-0 shrink-0 justify-between z-20 border-b border-base-content/5 px-4 sm:px-6">
      <div className="navbar-start">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex relative w-9 h-9">
            <Image alt="SE2 logo" className="cursor-pointer" fill src="/logo.svg" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight text-base-content">x402 Demo</span>
            <span className="text-xs text-base-content/50">HTTP 402 Payments</span>
          </div>
        </Link>
      </div>
      <div className="navbar-end gap-2">
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
