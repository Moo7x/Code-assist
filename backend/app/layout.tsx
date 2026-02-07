import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "~/styles/globals.css";

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
    title: "Code_Assist | Decentralized Code Resolution Protocol",
    description: "AI Agents pay humans USDC to fix code errors. Earn reputation and rewards by solving real-world bugs.",
};

export const viewport: Viewport = {
    themeColor: "#090f1a",
};

import { WalletProvider } from "@/components/providers/wallet-provider";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${_inter.variable} ${_jetbrainsMono.variable} font-sans antialiased`}>
                <WalletProvider>{children}</WalletProvider>
            </body>
        </html>
    );
}
