interface Score {
  logic: number;
  rhetoric: number;
  empathy: number;
  delivery: number;
}

interface Feedback {
  logic: string;
  rhetoric: string;
  empathy: string;
  delivery: string;
  overall: string;
}

// Mock scoring system for MVP - will be replaced with AI scoring
export function generateMockScore(audioBlob: Blob, motion: string, stance?: string): { score: Score; feedback: Feedback } {
  // Simulate realistic scoring with some randomness
  const baseLogic = Math.floor(Math.random() * 3) + 6; // 6-8
  const baseRhetoric = Math.floor(Math.random() * 3) + 6; // 6-8  
  const baseEmpathy = Math.floor(Math.random() * 2) + 3; // 3-4
  const baseDelivery = Math.floor(Math.random() * 2) + 3; // 3-4

  const score: Score = {
    logic: baseLogic,
    rhetoric: baseRhetoric,
    empathy: baseEmpathy,
    delivery: baseDelivery
  };

  const feedback: Feedback = {
    logic: generateLogicFeedback(score.logic),
    rhetoric: generateRhetoricFeedback(score.rhetoric),
    empathy: generateEmpathyFeedback(score.empathy),
    delivery: generateDeliveryFeedback(score.delivery),
    overall: generateOverallFeedback(score, motion, stance)
  };

  return { score, feedback };
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