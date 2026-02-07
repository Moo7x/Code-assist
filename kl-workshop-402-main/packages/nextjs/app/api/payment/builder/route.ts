import { NextResponse } from "next/server";
import { FACTS_PER_API_CALL, KL_FACTS, shuffleFacts } from "~~/data/klFacts";

export async function GET() {
  const selectedFacts = shuffleFacts(KL_FACTS).slice(0, FACTS_PER_API_CALL);

  return NextResponse.json({
    title: "Kuala Lumpur Insider Facts",
    description: "Premium local knowledge about Malaysia's vibrant capital",
    paidContent: true,
    generatedAt: new Date().toISOString(),
    facts: selectedFacts,
    tip: "Each API call gives you 3 random facts from our collection!",
  });
}
