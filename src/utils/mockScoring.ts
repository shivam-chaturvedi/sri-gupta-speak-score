interface Score {
  logic: number;
  rhetoric: number;
  empathy: number;
  delivery: number;
  total: number;
}

interface Feedback {
  logic: string;
  rhetoric: string;
  empathy: string;
  delivery: string;
  overall: string;
}

interface CounterArgument {
  rebuttal: string;
  strengthLevel: 'Low' | 'Medium' | 'High';
  supportingEvidence: string;
  commonSources: string;
}

interface DefenseStrategy {
  preemptiveDefense: string;
  directResponse: string;
  redirectTechnique: string;
  evidenceArsenal: string;
}

interface EnhancedFeedback {
  argumentAnalysis: {
    logicalStructure: string;
    evidenceQuality: string;
    clarityScore: number;
    persuasiveness: string;
  };
  dataEnhancements: {
    statisticalSupport: string[];
    expertCitations: string[];
    caseStudies: string[];
    quantifiableClaims: string[];
  };
  counterArguments: CounterArgument[];
  defenseStrategies: DefenseStrategy[];
  strategicRecommendations: string[];
}

export interface ScoreData {
  score: Score;
  feedback: Feedback;
  transcript: string;
  missingPoints: string[];
  enhancedArgument: string;
  enhancedFeedback?: EnhancedFeedback;
}

// Mock scoring system for MVP - will be replaced with AI scoring
export function generateMockScore(audioBlob: Blob, motion: string, stance?: string): ScoreData {
  // Simulate realistic scoring with some randomness
  const baseLogic = Math.floor(Math.random() * 3) + 6; // 6-8
  const baseRhetoric = Math.floor(Math.random() * 3) + 6; // 6-8  
  const baseEmpathy = Math.floor(Math.random() * 2) + 3; // 3-4
  const baseDelivery = Math.floor(Math.random() * 2) + 3; // 3-4
  const total = baseLogic + baseRhetoric + baseEmpathy + baseDelivery;

  const score: Score = {
    logic: baseLogic,
    rhetoric: baseRhetoric,
    empathy: baseEmpathy,
    delivery: baseDelivery,
    total: total
  };

  const feedback: Feedback = {
    logic: generateLogicFeedback(score.logic),
    rhetoric: generateRhetoricFeedback(score.rhetoric),
    empathy: generateEmpathyFeedback(score.empathy),
    delivery: generateDeliveryFeedback(score.delivery),
    overall: generateOverallFeedback(score, motion, stance)
  };

  // Generate mock transcript
  const transcript = generateMockTranscript(motion, stance);
  
  // Generate missing points analysis
  const missingPoints = generateMissingPoints(motion, stance);
  
  // Generate enhanced argument
  const enhancedArgument = generateEnhancedArgument(motion, missingPoints, stance);

  return { 
    score, 
    feedback, 
    transcript,
    missingPoints,
    enhancedArgument
  };
}

function generateLogicFeedback(score: number): string {
  if (score >= 8) {
    return "Excellent logical structure! Your argument flowed clearly from premise to conclusion with strong supporting points.";
  } else if (score >= 6) {
    return "Good logical foundation. Consider strengthening your main points with more specific examples or evidence.";
  } else {
    return "Work on organizing your thoughts more clearly. Try outlining your main points before speaking.";
  }
}

function generateRhetoricFeedback(score: number): string {
  if (score >= 8) {
    return "Strong rhetorical skills! You used persuasive language effectively and painted vivid pictures with your words.";
  } else if (score >= 6) {
    return "Good use of language. Try incorporating more rhetorical devices like metaphors or analogies to make your argument more compelling.";
  } else {
    return "Focus on using more persuasive language. Consider your word choice and how to make your argument more emotionally resonant.";
  }
}

function generateEmpathyFeedback(score: number): string {
  if (score >= 4) {
    return "Great job acknowledging different perspectives! Your respectful tone strengthens your credibility.";
  } else if (score >= 3) {
    return "Good awareness of other viewpoints. Consider acknowledging counterarguments more explicitly.";
  } else {
    return "Try to show more understanding of opposing views. This makes your argument stronger and more persuasive.";
  }
}

function generateDeliveryFeedback(score: number): string {
  if (score >= 4) {
    return "Confident delivery! Your pace and tone kept the audience engaged throughout your speech.";
  } else if (score >= 3) {
    return "Good delivery overall. Focus on varying your pace and using pauses effectively for emphasis.";
  } else {
    return "Work on speaking with more confidence. Practice your delivery and consider your vocal variety.";
  }
}

function generateOverallFeedback(score: Score, motion: string, stance?: string): string {
  const total = score.logic + score.rhetoric + score.empathy + score.delivery;
  const percentage = (total / 30) * 100;

  let baseMessage = "";
  if (percentage >= 80) {
    baseMessage = "Outstanding performance! You demonstrated strong debate skills across all categories.";
  } else if (percentage >= 70) {
    baseMessage = "Solid work! You're developing good speaking fundamentals.";
  } else if (percentage >= 60) {
    baseMessage = "Good effort! Focus on the areas highlighted above for improvement.";
  } else {
    baseMessage = "Keep practicing! Every speech makes you stronger.";
  }

  const stanceText = stance ? ` Your ${stance === "for" ? "support" : "opposition"} was clearly articulated.` : "";
  
  return `${baseMessage}${stanceText} Remember, great speakers are made through consistent practice. Try speaking on this topic again or explore a new challenge!`;
}

function generateMockTranscript(motion: string, stance?: string): string {
  const stancePrefix = stance === "for" ? "I strongly believe that" : stance === "against" ? "I firmly disagree that" : "In my opinion,";
  
  const transcripts = [
    `${stancePrefix} ${motion.toLowerCase()}. Let me explain my reasoning. First, we need to consider the fundamental principles at stake here. The evidence clearly shows that this approach would benefit society in multiple ways. We must also acknowledge the concerns of those who disagree, but I believe the advantages far outweigh any potential drawbacks. In conclusion, this is the right path forward.`,
    
    `${stancePrefix} this is a crucial issue that affects us all. When we examine the facts, it becomes clear that there are strong arguments on both sides. However, I believe that the practical implications strongly support my position. We've seen similar situations in the past, and the outcomes speak for themselves. This is why I stand by my viewpoint on this important matter.`,
    
    `${stancePrefix} we need to think carefully about this topic. There are several key points that support my argument. The research demonstrates clear patterns that we cannot ignore. While I understand why some people might disagree, I think the evidence points in a different direction. We must consider not just the immediate effects, but also the long-term consequences of our decisions.`
  ];
  
  return transcripts[Math.floor(Math.random() * transcripts.length)];
}

function generateMissingPoints(motion: string, stance?: string): string[] {
  const allMissingPoints = [
    "Consider addressing economic implications and cost-benefit analysis",
    "Include statistics or data to support your main arguments",
    "Acknowledge and refute potential counterarguments more explicitly",
    "Add personal anecdotes or real-world examples to make it more relatable",
    "Discuss the ethical considerations and moral framework",
    "Mention the historical context and precedent for similar situations",
    "Address the impact on different demographic groups or communities",
    "Consider the legal or regulatory implications",
    "Discuss potential unintended consequences or side effects",
    "Include expert opinions or authoritative sources",
    "Address the timeline and implementation challenges",
    "Consider alternative solutions or compromise positions",
    "Discuss the international or global perspective on this issue",
    "Address the environmental impact (if applicable)",
    "Consider the psychological or social effects on individuals"
  ];
  
  // Randomly select 3-5 missing points
  const numPoints = Math.floor(Math.random() * 3) + 3;
  const selectedPoints = [];
  const usedIndices = new Set();
  
  while (selectedPoints.length < numPoints && selectedPoints.length < allMissingPoints.length) {
    const randomIndex = Math.floor(Math.random() * allMissingPoints.length);
    if (!usedIndices.has(randomIndex)) {
      selectedPoints.push(allMissingPoints[randomIndex]);
      usedIndices.add(randomIndex);
    }
  }
  
  return selectedPoints;
}

function generateEnhancedArgument(motion: string, missingPoints: string[], stance?: string): string {
  const stancePrefix = stance === "for" ? "I strongly advocate that" : stance === "against" ? "I firmly oppose the notion that" : "I believe that";
  
  return `${stancePrefix} ${motion.toLowerCase()}, and I'd like to present a comprehensive argument for my position.

**Opening Statement:**
To begin with, this issue strikes at the heart of several fundamental principles that govern our society. When we examine the evidence with careful scrutiny, a clear pattern emerges that strongly supports my viewpoint.

**Main Arguments:**
First, let's consider the economic implications. The cost-benefit analysis reveals significant advantages that cannot be overlooked. Research and statistics demonstrate measurable impacts that align with my position.

Second, we must acknowledge the ethical framework surrounding this issue. The moral considerations point clearly toward the path I'm advocating, particularly when we consider the effects on various communities and demographic groups.

Third, historical precedent provides valuable insight. We've seen similar situations unfold in the past, and the outcomes consistently support the approach I'm proposing.

**Addressing Counterarguments:**
While I understand and respect the concerns raised by those who disagree, I believe these objections can be effectively addressed. The perceived drawbacks are often outweighed by the substantial benefits, and many concerns stem from incomplete information or misconceptions.

**Conclusion:**
In conclusion, when we consider the comprehensive evidence - economic, ethical, historical, and practical - the case becomes compelling. This is not just about immediate effects, but about building a better future for all. The implementation may present challenges, but with proper planning and commitment, we can achieve meaningful progress on this critical issue.

*This enhanced version incorporates stronger logical structure, supporting evidence, acknowledgment of counterarguments, and addresses several of the missing points identified in the analysis.*`;
}