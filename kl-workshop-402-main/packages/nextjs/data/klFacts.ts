export type KLFact = {
  category: string;
  title: string;
  fact: string;
  emoji: string;
};

export const KL_FACTS: KLFact[] = [
  {
    category: "Architecture",
    title: "Petronas Twin Towers",
    fact: "Standing at 451.9 meters, the Petronas Twin Towers were the world's tallest buildings from 1998 to 2004. The sky bridge connecting them at floors 41-42 is the highest two-story bridge in the world.",
    emoji: "🏙️",
  },
  {
    category: "Culture",
    title: "Batu Caves",
    fact: "The 272 rainbow-colored steps leading to Batu Caves temple are home to a 42.7-meter golden statue of Lord Murugan, the tallest Hindu deity statue in Malaysia.",
    emoji: "🛕",
  },
  {
    category: "Food",
    title: "Street Food Capital",
    fact: "KL's Jalan Alor is a 500-meter stretch of over 200 food stalls, serving everything from satay to durian, operating from 5 PM until 4 AM daily.",
    emoji: "🍜",
  },
  {
    category: "History",
    title: "Tin Mining Origins",
    fact: "Kuala Lumpur means 'muddy confluence' in Malay. The city was founded in 1857 by 87 Chinese tin miners at the meeting point of the Klang and Gombak rivers. Only 18 survived the first year due to malaria.",
    emoji: "⛏️",
  },
  {
    category: "Nature",
    title: "KL Forest Eco Park",
    fact: "In the heart of KL lies a 9.37-hectare virgin tropical rainforest, one of the oldest permanent forest reserves in Malaysia, established in 1906. It's home to over 200 species of trees.",
    emoji: "🌴",
  },
  {
    category: "Transport",
    title: "Monorail Pioneer",
    fact: "KL's monorail, opened in 2003, was one of Asia's first fully automated driverless monorail systems. It carries over 170,000 passengers daily across 11 stations.",
    emoji: "🚝",
  },
];

export const FACTS_PER_API_CALL = 3;

/** Fisher-Yates shuffle for unbiased randomization */
export function shuffleFacts(facts: KLFact[]): KLFact[] {
  const result = [...facts];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
