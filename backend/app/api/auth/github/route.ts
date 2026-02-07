import { NextRequest, NextResponse } from "next/server";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "mock_client_id";
const REDIRECT_URI = "http://localhost:3000/api/auth/github/callback";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
        return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    // In a real app, we would store the wallet in a secure cookie or state parameter
    // to link it after the callback. For now, we'll just redirect to GitHub.
    // If no client ID is set, mocking the flow for demonstration
    if (GITHUB_CLIENT_ID === "mock_client_id") {
        return NextResponse.redirect(new URL("/profile?error=github_client_id_missing", request.url));
    }

    const state = Buffer.from(JSON.stringify({ wallet })).toString("base64");
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${state}&scope=read:user`;

    return NextResponse.redirect(githubUrl);
}
