export interface Motion {
  id: string;
  topic: string;
  category: string;
  description?: string;
  type: "opinion" | "stance";
}

export const motions: Motion[] = [
  // Politics
  {
    id: "pol-001",
    topic: "Should voting be mandatory in democratic elections?",
    category: "Politics",
    description: "Consider the impact on democratic participation vs. personal freedom",
    type: "stance"
  },
  {
    id: "pol-002", 
    topic: "Is social media destroying political discourse?",
    category: "Politics",
    description: "Examine echo chambers, misinformation, and polarization",
    type: "opinion"
  },
  {
    id: "pol-003",
    topic: "Should governments prioritize economic growth over environmental protection?",
    category: "Politics",
    description: "Balance short-term prosperity with long-term sustainability",
    type: "stance"
  },

  // Ethics
  {
    id: "eth-001",
    topic: "Is it ethical to eat meat in modern society?",
    category: "Ethics",
    description: "Consider animal welfare, environment, and cultural practices",
    type: "stance"
  },
  {
    id: "eth-002",
    topic: "Should wealthy individuals be morally obligated to donate to charity?",
    category: "Ethics",
    description: "Explore concepts of social responsibility and personal choice",
    type: "stance"
  },
  {
    id: "eth-003",
    topic: "Is lying ever morally justified?",
    category: "Ethics",
    description: "Examine white lies, protection, and absolute moral principles",
    type: "stance"
  },

  // Education
  {
    id: "edu-001",
    topic: "Should college education be free for everyone?",
    category: "Education",
    description: "Consider accessibility, quality, and economic implications",
    type: "stance"
  },
  {
    id: "edu-002",
    topic: "Are standardized tests an effective measure of student ability?",
    category: "Education",
    description: "Evaluate fairness, teaching to the test, and alternative assessments",
    type: "stance"
  },
  {
    id: "edu-003",
    topic: "Should schools ban smartphones completely?",
    category: "Education",
    description: "Balance learning focus with emergency access and digital literacy",
    type: "stance"
  },

  // Technology
  {
    id: "tech-001",
    topic: "Will artificial intelligence replace human creativity?",
    category: "Technology",
    description: "Explore AI capabilities vs. human imagination and emotion",
    type: "stance"
  },
  {
    id: "tech-002",
    topic: "Should there be a universal basic income to address job automation?",
    category: "Technology",
    description: "Consider economic disruption and social welfare solutions",
    type: "stance"
  },
  {
    id: "tech-003",
    topic: "Is privacy dead in the digital age?",
    category: "Technology",
    description: "Examine surveillance, data collection, and personal rights",
    type: "opinion"
  },

  // Abstract
  {
    id: "abs-001",
    topic: "Is happiness a choice or a circumstance?",
    category: "Abstract",
    description: "Explore personal agency vs. external factors in well-being",
    type: "opinion"
  },
  {
    id: "abs-002",
    topic: "Does true altruism exist?",
    category: "Abstract",
    description: "Question whether selfless acts are possible or always self-serving",
    type: "stance"
  },
  {
    id: "abs-003",
    topic: "Is there meaning to life without struggle?",
    category: "Abstract",
    description: "Consider growth, appreciation, and the value of challenges",
    type: "opinion"
  },

  // Pop Culture
  {
    id: "pop-001",
    topic: "Do social media influencers have a responsibility to promote positive values?",
    category: "Pop Culture",
    description: "Balance free expression with social influence on young audiences",
    type: "stance"
  },
  {
    id: "pop-002",
    topic: "Are superhero movies damaging cinema as an art form?",
    category: "Pop Culture",
    description: "Examine commercial success vs. artistic diversity and innovation",
    type: "stance"
  },
  {
    id: "pop-003",
    topic: "Has celebrity culture gone too far?",
    category: "Pop Culture",
    description: "Consider privacy, role models, and society's obsession with fame",
    type: "opinion"
  }
];

const stanceMotions = motions.filter(
  (motion) => (motion.type ?? "").trim().toLowerCase() === "stance"
);

interface MotionSelectionOptions {
  stanceOnly?: boolean;
}

export function getDailyMotion(options?: MotionSelectionOptions): Motion {
  const useStanceOnly = options?.stanceOnly && stanceMotions.length > 0;
  const sourceMotions = useStanceOnly ? stanceMotions : motions;
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return sourceMotions[dayOfYear % sourceMotions.length];
}

export function getRandomMotions(
  count: number = 3,
  options?: MotionSelectionOptions
): Motion[] {
  let sourcePool =
    options?.stanceOnly && stanceMotions.length > 0 ? stanceMotions : motions;

  if (options?.stanceOnly && sourcePool.length < count) {
    const fallbackMotions = motions.filter(
      (motion) => !stanceMotions.includes(motion)
    );
    sourcePool = [...sourcePool, ...fallbackMotions];
  }

  const shuffled = [...sourcePool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
