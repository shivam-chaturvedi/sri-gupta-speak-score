interface CounterArgument {
  rebuttal: string;
  strengthLevel: 'Low' | 'Medium' | 'High';
  supportingEvidence: string;
  commonSources: string;
  keyPoints: string[]; // Specific talking points for this counterargument
}

interface DefenseStrategy {
  preemptiveDefense: string;
  directResponse: string;
  redirectTechnique: string;
  evidenceArsenal: string;
  keyPoints: string[]; // Specific talking points for defending against the counter
}

interface EnhancedFeedback {
  argumentAnalysis: {
    logicalStructure: string;
    evidenceQuality: string;
    clarityScore: number;
    persuasiveness: string;
  };
  dataEnhancements: {
    logicalFrameworks?: string[];
    premiseStrengthening?: string[];
    fallacyCorrections?: string[];
    reasoningImprovements?: string[];
    statisticalSupport?: string[];
    expertCitations?: string[];
    caseStudies?: string[];
    quantifiableClaims?: string[];
  };
  counterArguments: CounterArgument[];
  defenseStrategies: DefenseStrategy[];
  strategicRecommendations: string[];
}

interface ScoreResult {
  score: {
    logic: number;
    rhetoric: number;
    empathy: number;
    delivery: number;
    total: number;
  };
  feedback: {
    logic: string;
    rhetoric: string;
    empathy: string;
    delivery: string;
    overall: string;
  };
  missingPoints: string[];
  enhancedArgument: string;
  enhancedFeedback: EnhancedFeedback;
  transcript: string;
}

interface SpeechAnalysisRequest {
  transcript: string;
  topic: string;
  stance?: string;
  duration: number;
}

interface ApiKeyCandidate {
  key: string;
  isManual: boolean;
  envIndex?: number;
}

export class AIService {
  private manualApiKey: string | null = null;
  private envApiKeys: string[] = [];
  private nextEnvIndex = 0;

  constructor() {
    const rawKeys = import.meta.env.VITE_GEMINI_API_KEYS || "";
    this.envApiKeys = rawKeys
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean);
    this.manualApiKey = this.loadManualKeyFromStorage();
  }

  setApiKey(key: string) {
    const sanitized = key.trim();
    this.manualApiKey = sanitized.length > 0 ? sanitized : null;
    this.persistManualKey(this.manualApiKey);
  }

  async analyzeSpeeches(request: SpeechAnalysisRequest): Promise<ScoreResult> {
    const prompt = this.buildAnalysisPrompt(request);
    const stance = request.stance || 'neutral';
    const stanceDisplay = stance === 'neutral' ? 'NEUTRAL' : stance.toUpperCase();

    try {
      const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
      const payload = {
        contents: [
          {
            parts: [
              {
                text: `You are a debate coach specializing in logical argumentation and reasoning for Schoolhouse dialogue portfolios. 

CRITICAL CONTEXT:
- STUDENT'S CHOSEN POSITION: ${stanceDisplay}
- Your role is to help strengthen arguments through LOGICAL REASONING, not unsourced data
- Focus on argument structure, logical validity, and reasoning frameworks
- NEVER provide unsourced statistics or facts - guide students to research and cite properly
- Adapt your coaching to strengthen their ${stanceDisplay} position

CORE PRINCIPLES:

1. LOGICAL ANALYSIS ONLY
   - Focus on the structure and validity of arguments
   - Identify logical fallacies and reasoning errors
   - Suggest improvements to argument coherence and flow
   - Never provide unsourced factual claims, statistics, or data
   - If you reference a fact, you MUST cite a specific, verifiable source

2. REASONING FRAMEWORKS TO APPLY
   - Deductive reasoning: Help construct valid syllogisms
   - Inductive reasoning: Strengthen generalizations and pattern recognition
   - Analogical reasoning: Improve comparative arguments
   - Causal reasoning: Clarify cause-effect relationships
   - Reductio ad absurdum: Test arguments by examining their logical extremes

3. WHAT TO ANALYZE
   - Premise quality: Are the starting assumptions clear and reasonable?
   - Logical structure: Do conclusions follow from premises?
   - Internal consistency: Are there contradictions within the argument?
   - Assumption identification: What unstated assumptions exist?
   - Counterargument vulnerability: Where is the argument weakest logically?
   - Burden of proof: Is it properly allocated and met?

4. LOGICAL FALLACIES TO IDENTIFY
   - Ad hominem attacks
   - Straw man arguments
   - False dichotomies
   - Slippery slope reasoning
   - Circular reasoning
   - Appeals to authority/emotion/popularity
   - Hasty generalizations
   - Post hoc ergo propter hoc
   - Equivocation and ambiguity

5. POSITION-ADAPTIVE COACHING
   - The student has chosen: ${stanceDisplay}
   - Tailor your logical guidance to strengthen THEIR chosen position
   - Help them anticipate and counter opposing arguments
   - For NEUTRAL: Help them identify logical merits and flaws on both sides

6. WHAT TO AVOID
   - DO NOT say: "Studies show..." without a cited source
   - DO NOT provide statistics unless you can cite the exact source
   - DO NOT make factual claims about events, policies, or data
   - DO NOT argue against the student's chosen position
   - DO NOT let personal views on the topic influence your logical analysis

7. SOURCING REQUIREMENT
   If you need to reference a fact to illustrate a logical point:
   - State: "According to [specific source], [fact]" OR
   - Say: "If we assume [fact] is true (which you should verify), then logically..."
   - Make clear when you're using a hypothetical vs. a verified fact

You MUST provide SPECIFIC, ACTIONABLE feedback with EXACT word-for-word examples focusing on logical reasoning. You MUST generate detailed logical counterarguments and defense strategies (at least 4). NO vague feedback allowed. NO unsourced statistics.

OUTPUT FORMAT - CRITICAL INSTRUCTIONS:
You MUST provide your analysis in a structured format. You can return it as:
1. A JSON object (preferred but optional)
2. Structured text with clear sections and labels

If using JSON, format it like this:
{
  "logic_score": <0-10>,
  "logic_feedback": ["feedback1", "feedback2", ...],
  "rhetoric_score": <0-10>,
  "rhetoric_feedback": ["feedback1", "feedback2", ...],
  "empathy_score": <0-5>,
  "empathy_feedback": ["feedback1", "feedback2", ...],
  "delivery_score": <0-5>,
  "delivery_feedback": ["feedback1", "feedback2", ...],
  "missing_points": ["point1", "point2", ...],
  "enhanced_argument": "full text here",
  "enhanced_feedback": {...}
}

If using structured text, format it clearly with labels like:
LOGIC SCORE: <number>
LOGIC FEEDBACK:
- <feedback point 1>
- <feedback point 2>
...

RHETORIC SCORE: <number>
RHETORIC FEEDBACK:
- <feedback point 1>
...

And so on for all categories.

IMPORTANT: Always provide scores (0-10 for logic/rhetoric, 0-5 for empathy/delivery) and detailed feedback for each category.

${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 4096,
        }
      };

      const candidates = this.buildApiKeyCandidates();
      if (candidates.length === 0) {
        throw new Error('API key not set. Please provide your Google Gemini API key.');
      }

      let lastError: Error | null = null;

      for (let attemptIndex = 0; attemptIndex < candidates.length; attemptIndex++) {
        const candidate = candidates[attemptIndex];
        let response: Response;

        try {
          console.log(`📡 Calling Gemini 2.5 Flash API (key ${attemptIndex + 1}/${candidates.length})...`);
          console.log(`🔑 Using API key: ${candidate.key.substring(0, 10)}... (${candidate.isManual ? 'manual' : 'env'})`);
          
          // NO TIMEOUT - wait indefinitely for response
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': candidate.key,
            },
            body: JSON.stringify(payload),
            // NO signal - wait indefinitely
          });
        } catch (fetchError) {
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
          // Network errors - don't rotate, throw immediately
          console.error('❌ Network error with API key:', lastError);
          throw lastError;
        }

        if (!response.ok) {
          const errorText = await response.text();
          const errorMessage = this.buildErrorMessage(response.status, response.statusText, errorText);
          lastError = new Error(errorMessage);

          // ONLY rotate on 400 (Bad Request) or 429 (Rate Limit)
          if ((response.status === 400 || response.status === 429) && attemptIndex < candidates.length - 1) {
            console.warn(`⚠️ Status ${response.status} received, rotating to next API key`);
            continue;
          }

          // For all other errors (401, 403, etc.) - throw immediately, don't rotate
          console.error(`❌ API error ${response.status}, not rotating:`, errorMessage);
          throw lastError;
        }

        let data: any;
        try {
          data = await response.json();
        } catch (jsonError) {
          lastError = jsonError instanceof Error ? jsonError : new Error(String(jsonError));
          // JSON parse errors - don't rotate, throw immediately
          console.error('❌ JSON parse error, not rotating:', lastError);
          throw lastError;
        }

        if (data.error) {
          const errorCode = data.error.code || data.error.errorCode || 0;
          lastError = new Error(`AI API error: ${data.error.message || JSON.stringify(data.error)}`);
          
          // ONLY rotate on 400 or 429 error codes
          if ((errorCode === 400 || errorCode === 429) && attemptIndex < candidates.length - 1) {
            console.warn(`⚠️ Error code ${errorCode} received, rotating to next API key`);
            continue;
          }
          
          // For all other errors - throw immediately, don't rotate
          console.error(`❌ API error code ${errorCode}, not rotating:`, lastError);
          throw lastError;
        }

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
          console.error('❌ Invalid API response structure:', data);
          const structureError = new Error('Invalid response format from AI service');
          // Invalid structure - don't rotate, throw immediately
          throw structureError;
        }

        const analysis = data.candidates[0].content.parts[0].text;

        if (!analysis) {
          const emptyResponseError = new Error('Empty response from AI service');
          // Empty response - don't rotate, throw immediately
          console.error('❌ Empty response, not rotating');
          throw emptyResponseError;
        }

        this.markEnvKeyAsUsed(candidate);
        console.log('✅ API call successful, parsing response...');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📥 RAW GEMINI RESPONSE - FULL TEXT:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(analysis);
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📥 RAW AI RESPONSE length:', analysis.length);
        console.log('📥 RAW AI RESPONSE first 2000 chars:', analysis.substring(0, 2000));
        console.log('📥 RAW AI RESPONSE last 2000 chars:', analysis.substring(Math.max(0, analysis.length - 2000)));
        
        // Check if key sections appear in the raw response
        const checks = {
          enhanced: analysis.toLowerCase().includes('enhanced'),
          enhanced_argument: analysis.toLowerCase().includes('enhanced_argument'),
          counter: analysis.toLowerCase().includes('counter'),
          defense: analysis.toLowerCase().includes('defense'),
          logic_score: analysis.toLowerCase().includes('logic') && analysis.match(/\d+/),
          json: analysis.trim().startsWith('{') || analysis.includes('"logic_score"')
        };
        console.log('🔍 Response content checks:', checks);
        
        // Find and log sections
        if (checks.enhanced) {
          const enhancedIndex = analysis.toLowerCase().indexOf('enhanced');
          console.log('🔍 Enhanced section found at index:', enhancedIndex);
          console.log('🔍 Enhanced section preview (2000 chars):', analysis.substring(Math.max(0, enhancedIndex - 100), Math.min(analysis.length, enhancedIndex + 2000)));
        }
        
        if (checks.counter) {
          const counterIndex = analysis.toLowerCase().indexOf('counter');
          console.log('🔍 Counter section found at index:', counterIndex);
          console.log('🔍 Counter section preview (1500 chars):', analysis.substring(Math.max(0, counterIndex - 100), Math.min(analysis.length, counterIndex + 1500)));
        }
        
        if (checks.defense) {
          const defenseIndex = analysis.toLowerCase().indexOf('defense');
          console.log('🔍 Defense section found at index:', defenseIndex);
          console.log('🔍 Defense section preview (1500 chars):', analysis.substring(Math.max(0, defenseIndex - 100), Math.min(analysis.length, defenseIndex + 1500)));
        }
        
        // Check if it's JSON format
        if (checks.json) {
          console.log('🔍 Response appears to be JSON format');
          const jsonStart = analysis.indexOf('{');
          const jsonEnd = analysis.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            console.log('🔍 JSON boundaries found:', jsonStart, 'to', jsonEnd);
            console.log('🔍 JSON preview (first 3000 chars):', analysis.substring(jsonStart, Math.min(jsonStart + 3000, jsonEnd + 1)));
          }
        } else {
          console.log('🔍 Response appears to be TEXT format');
        }
        
        const parsedResult = this.parseAnalysis(analysis, request.transcript);
        
        console.log('✅ PARSED RESULT:', JSON.stringify(parsedResult, null, 2));
        console.log('✅ ENHANCED ARGUMENT:', parsedResult.enhancedArgument);
        console.log('✅ ENHANCED ARGUMENT length:', parsedResult.enhancedArgument?.length || 0);
        console.log('✅ MISSING POINTS:', parsedResult.missingPoints);
        console.log('✅ COUNTER ARGUMENTS count:', parsedResult.enhancedFeedback?.counterArguments?.length || 0);
        console.log('✅ DEFENSE STRATEGIES count:', parsedResult.enhancedFeedback?.defenseStrategies?.length || 0);
        
        return parsedResult;
      }

      console.warn('All Gemini API keys failed; returning friendly fallback message.', lastError);
      throw new Error(AIService.GEMINI_ALL_KEYS_BUSY_MESSAGE);
    } catch (error) {
      console.error('AI analysis failed:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('Network request failed')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        if (error.message.includes('API_KEY') || error.message.includes('401') || error.message.includes('403') || error.message.includes('Invalid API key')) {
          throw new Error('Invalid API key. Please check your Google Gemini API key and ensure it has the correct permissions.');
        }
        if (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('limit exhausted')) {
          throw new Error('Gemini limit exhausted. Please wait a bit and try the analysis again.');
        }
        throw error;
      }
      throw new Error('AI analysis failed due to an unknown error. Please try again.');
    }
  }

  private buildApiKeyCandidates(): ApiKeyCandidate[] {
    const candidates: ApiKeyCandidate[] = [];
    const seen = new Set<string>();

    if (this.manualApiKey) {
      candidates.push({ key: this.manualApiKey, isManual: true });
      seen.add(this.manualApiKey);
    }

    const envCount = this.envApiKeys.length;
    for (let i = 0; i < envCount; i++) {
      const index = (this.nextEnvIndex + i) % envCount;
      const key = this.envApiKeys[index];
      if (!key || seen.has(key)) continue;
      candidates.push({ key, isManual: false, envIndex: index });
      seen.add(key);
    }

    return candidates;
  }


  private markEnvKeyAsUsed(candidate: ApiKeyCandidate): void {
    if (!candidate.isManual && typeof candidate.envIndex === "number" && this.envApiKeys.length > 0) {
      this.nextEnvIndex = (candidate.envIndex + 1) % this.envApiKeys.length;
    }
  }

  private loadManualKeyFromStorage(): string | null {
    if (typeof window === "undefined") {
      return null;
    }
    const storedKey = window.localStorage.getItem('gemini_api_key');
    return storedKey ? storedKey.trim() : null;
  }

  private persistManualKey(key: string | null): void {
    if (typeof window === "undefined") {
      return;
    }
    if (key) {
      window.localStorage.setItem('gemini_api_key', key);
    } else {
      window.localStorage.removeItem('gemini_api_key');
    }
  }

  private buildErrorMessage(status: number, statusText: string, errorText: string): string {
    console.error('API request failed:', status, statusText);
    console.error('Error response body:', errorText);

    let errorMessage = `Analysis failed: ${status} ${statusText}`;

    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error) {
        errorMessage = errorJson.error.message || errorJson.error.status || errorMessage;
        if (errorJson.error.code === 401 || errorJson.error.code === 403) {
          errorMessage = 'Invalid API key. Please check your Google Gemini API key and ensure it has the correct permissions.';
        } else if (errorJson.error.code === 429) {
          errorMessage = 'API rate limit exceeded. Please try again later.';
        } else if (errorJson.error.code === 400) {
          errorMessage = errorJson.error.message || 'Invalid request. Please check your input and try again.';
        }
      } else if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch (e) {
      errorMessage = errorText ? (errorText.substring(0, 200) + (errorText.length > 200 ? '...' : '')) : errorMessage;
    }

    if (status === 404) {
      errorMessage = 'API endpoint not found. The Gemini API endpoint may have changed or the API key is invalid.';
    } else if (status === 401 || status === 403) {
      errorMessage = 'Invalid API key. Please check your Google Gemini API key and ensure it has the correct permissions.';
    } else if (status === 429) {
      errorMessage = 'Gemini limit exhausted. Please wait a moment and try the analysis again.';
    } else if (status === 400) {
      errorMessage = 'Invalid request. Please check your input and try again.';
    } else if (status === 500 || status === 502 || status === 503) {
      errorMessage = 'Gemini is not available right now. Please restart your speech and try again shortly.';
    }

    return errorMessage;
  }

  private static readonly GEMINI_ALL_KEYS_BUSY_MESSAGE = 'Gemini is on a latte break and every API key is busy dancing with tokens. Take a breath, sip something cozy, and try again in a minute.';

  private balanceJsonBraces(json: string): string {
    const openCount = (json.match(/\{/g) || []).length;
    const closeCount = (json.match(/\}/g) || []).length;
    if (openCount <= closeCount) {
      return json;
    }
    return json + '}'.repeat(openCount - closeCount);
  }

  private buildAnalysisPrompt(request: SpeechAnalysisRequest): string {
    const stanceContext = request.stance 
      ? `\n\n⚠️ CRITICAL: The speaker is arguing ${request.stance.toUpperCase()} this motion. You MUST evaluate whether their arguments effectively support their chosen stance. If they argue ${request.stance === 'for' ? 'AGAINST' : 'FOR'} when they should argue ${request.stance.toUpperCase()}, this is a MAJOR flaw. Their logic, evidence, and rhetoric must align with arguing ${request.stance.toUpperCase()}.`
      : '\n\nNOTE: This is a neutral opinion piece (no specific stance required).';
    
    return `You are an EXPERT DEBATE COACH, ARGUMENT STRATEGIST, and COMPETITIVE DEBATE JUDGE with 20+ years of experience. You have trained world championship debaters. Analyze this debate speech with MILITARY PRECISION and provide BRUTALLY HONEST, SPECIFIC, ACTIONABLE feedback.

DEBATE TOPIC: "${request.topic}"
STANCE: ${request.stance ? request.stance.toUpperCase() : 'NEUTRAL/OPINION'}${stanceContext}
DURATION: ${request.duration} seconds

TRANSCRIPT:
"${request.transcript}"

SCORING CRITERIA:
- Logic (0-10): Argument structure, reasoning quality, evidence quality, logical flow, fallacy detection
- Rhetoric (0-10): Persuasive language, rhetorical devices used, emotional appeal, storytelling, call-to-action
- Empathy (0-5): Perspective-taking, recognizing opposing views, tone appropriateness, audience connection
- Delivery (0-5): Clarity from transcript, organization, coherence, confidence indicators in wording

RULES FOR ACCURATE SCORING:
1. Logic Score: 
   - 9-10: Outstanding structure with clear premises→conclusion chains, impeccable evidence, zero fallacies
   - 7-8: Good arguments but minor gaps in logic or evidence, 1-2 minor fallacies
   - 5-6: Some valid points but significant logical weaknesses, missing key evidence, logical gaps
   - 3-4: Major flaws in reasoning, substantial missing evidence, multiple fallacies detected
   - 0-2: Fundamental logical errors, no coherent argument structure, severe reasoning flaws

2. Rhetoric Score:
   - 9-10: Masterful use of rhetorical devices (metaphor, anaphora, tricolon, etc.), powerful language, compelling narrative arc
   - 7-8: Good persuasive techniques with room for improvement, some rhetorical devices used effectively
   - 5-6: Basic persuasive language but lacks impact, minimal rhetorical devices
   - 3-4: Weak rhetorical choices, not engaging, no clear persuasive strategy
   - 0-2: No clear persuasive strategy, flat language, no rhetorical devices

3. Empathy Score:
   - 5: Shows deep understanding of multiple perspectives, acknowledges strongest counterarguments
   - 4: Good awareness of other viewpoints, addresses some counterarguments
   - 3: Some recognition of opposing views but superficial
   - 2: Limited perspective-taking, dismissive of alternatives
   - 1: No consideration of others' perspectives
   - 0: Dismissive or antagonistic tone, attacks opponents personally

4. Delivery Score (from transcript only):
   - 5: Extremely clear, organized, confident expression, perfect structure
   - 4: Clear and well-organized, minor clarity issues
   - 3: Generally understandable but some confusion
   - 2: Unclear or disorganized, difficult to follow
   - 1: Very difficult to understand, major structural issues
   - 0: Incomprehensible, no clear structure

CRITICAL: Score ACCURATELY based on the actual content. Be BRUTAL if they deserve low scores. Be GENEROUS only if they deserve high scores. No participation trophies! Every point must be earned.

FEEDBACK REQUIREMENTS - ABSOLUTELY MANDATORY:
1. EVERY feedback point MUST be SPECIFIC and ACTIONABLE, focusing on LOGICAL REASONING:
   - ❌ BAD: "Your logic needs improvement"
   - ✅ GOOD: "Your second premise creates a logical gap. Strengthen it using deductive reasoning: 'If [premise A], and [premise B], then [conclusion].' Your current premise '[exact quote]' assumes [unstated assumption] without justification. Either defend this assumption or restructure: 'Because [clearer premise], and because [supporting logical point], therefore [conclusion].'"

2. ALWAYS reference EXACT QUOTES from their transcript and analyze LOGICAL STRUCTURE:
   - ❌ BAD: "Your argument is weak"
   - ✅ GOOD: "When you said '[exact quote from transcript]', you committed a [specific fallacy name]. The logical flaw is [specific reason]. Replace with: '[specific improved version using logical reasoning framework]'"

3. Provide CONCRETE LOGICAL TECHNIQUES and REASONING FRAMEWORKS:
   - ❌ BAD: "Use better rhetoric"
   - ✅ GOOD: "Add anaphora (repetition) like: 'We must act. We must change. We must lead.' Place this at 0:45 in your speech for maximum impact. Additionally, strengthen your logical chain using causal reasoning: 'Because [cause], and because [mechanism], therefore [effect].'"

4. NEVER use vague phrases like:
   - "could be better", "needs improvement", "work on", "try to", "consider", "maybe", "perhaps"
   - Instead: "MUST add [specific logical framework]", "REPLACE [X] with [Y using reasoning type]", "INSERT [specific logical element] at [specific location]"

5. LOGICAL REASONING FOCUS - CRITICAL:
   - Focus on argument structure, validity, and reasoning quality
   - Identify logical fallacies by name and quote where they occur
   - Suggest specific reasoning frameworks (deductive, inductive, analogical, causal)
   - NEVER provide unsourced statistics - instead say: "You should research and cite sources for [this claim]. Once you have verified data, use it like this: 'According to [source], [fact]. This supports your argument because [logical connection].'"
   - If referencing facts: "If we assume [fact] is true (which you should verify from [type of source]), then logically..."

Provide analysis in this EXACT JSON format (NO MARKDOWN, NO CODE BLOCKS, JUST PURE JSON):

{
  "logic_score": [0-10],
  "logic_feedback": [
    ${request.stance ? `"STANCE ALIGNMENT CHECK: First, verify if their arguments actually support arguing ${request.stance.toUpperCase()}. If they argue the opposite or are neutral, this is a CRITICAL logical error. Quote where they contradict their stance. Example: 'You chose to argue ${request.stance.toUpperCase()}, but when you said \"[exact quote]\", you actually argued ${request.stance === 'for' ? 'AGAINST' : 'FOR'}. This is a fundamental logical flaw. To fix this, you must [specific correction].'",` : '"STANCE ALIGNMENT: Since this is an opinion piece, evaluate if their logic is internally consistent.",'}
    "SPECIFIC weakness or strength: Quote their exact words from transcript, then explain the logical flaw or strength. Example: 'When you said \"[exact quote]\", this creates a logical gap because [specific reason]. To fix this, add: [exact improved version]'",
    "CONCRETE example: Identify the SPECIFIC premise that fails logically. Quote it. Explain the logical flaw. Provide exact replacement using reasoning frameworks. Example: 'Your second premise \"[exact quote]\" contains a logical gap because [specific reason]. Restructure using deductive reasoning: \"If [premise A], and [premise B], then [conclusion].\" This strengthens your argument because it creates a valid logical chain. If you need factual support, research and cite: \"According to [Source, Year], [fact]. This supports your premise because [logical connection].\"'",
    "ACTIONABLE suggestion: Exact technique with word-for-word example. Example: 'Use causal chain reasoning: \"Because [their claim], and because [supporting fact], therefore [conclusion].\" Insert this at [specific location in speech] to connect premise A to conclusion B.'",
    "FALLACY DETECTION: If you identified logical fallacies, name them specifically and quote where they occur. Example: 'Ad hominem fallacy at \"[exact quote]\". Replace with: [exact improved version]'"
  ],
  "rhetoric_score": [0-10], 
  "rhetoric_feedback": [
    "SPECIFIC assessment: Quote their exact words and analyze the rhetorical device used (or missing). Example: 'Your phrase \"[exact quote]\" uses [rhetorical device name], which is effective because [reason]. However, you could enhance it by [specific technique].'",
    "CONCRETE rhetorical device: Name the SPECIFIC device they used or should use, with exact example. Example: 'You used anaphora in \"[exact quote]\", which works well. Add more anaphora like: \"[exact 3-part example]\" at [specific location] to strengthen your call-to-action.'",
    "ACTIONABLE improvement: Word-for-word example phrase they should use. Example: 'Replace \"[their vague phrase]\" with \"[exact powerful phrase with rhetorical device]\". This works better because [reason] and creates [specific emotional/intellectual effect].'",
    "MISSING DEVICES: List 2-3 rhetorical devices they didn't use with exact examples. Example: 'You missed tricolon. Add: \"[exact 3-part structure]\". You also missed metaphor. Add: \"[exact metaphor comparing X to Y]\" to make [concept] more vivid.'"
  ],
  "empathy_score": [0-5],
  "empathy_feedback": [
    "SPECIFIC comment: Quote where they addressed or failed to address opposing views. Example: 'You never acknowledged the counterargument that [specific counterargument]. Add: \"Some might argue [counterargument], but [your response].\" This shows you understand other perspectives.'",
    "TONE ANALYSIS: Quote exact phrases that show empathy (or lack thereof). Example: 'Your phrase \"[exact quote]\" comes across as [adjective]. Replace with \"[exact more empathetic version]\" to show you respect opposing viewpoints.'",
    "PERSPECTIVE-TAKING: Identify SPECIFIC opposing viewpoint they should acknowledge. Example: 'You should acknowledge that [specific opposing view] is valid because [reason]. Add: \"I understand that [opposing view] because [reason], but [your counterpoint].\" This demonstrates empathy.'"
  ],
  "delivery_score": [0-5],
  "delivery_feedback": [
    "SPECIFIC assessment: Quote exact phrases that demonstrate clarity/confusion. Example: 'Your sentence \"[exact quote]\" is unclear because [reason]. Rewrite as: \"[exact clearer version]\" to improve clarity.'",
    "ORGANIZATION: Identify SPECIFIC structural issues. Example: 'Your argument jumps from [point A] to [point C] without [point B]. Add a transition: \"[exact transition phrase]\" to connect these ideas.'",
    "CONFIDENCE INDICATORS: Quote phrases that show uncertainty. Example: 'Phrases like \"[exact quote]\" sound uncertain. Replace with confident language: \"[exact confident version]\" to project authority.'"
  ],
  "missing_points": [
    "LOGICAL PREMISE GAP: [Specific premise they should add to strengthen their argument structure. Example: 'Add a premise clarifying [assumption] to create a valid syllogism']",
    "REASONING FRAMEWORK: [Specific reasoning approach they should use. Example: 'Use analogical reasoning by comparing [X] to [Y] to illustrate [point]']",
    "COUNTERARGUMENT ACKNOWLEDGMENT: [Specific opposing view they should address logically. Example: 'Address the logical counterargument that [X] by showing [Y]']",
    "FALLACY PREVENTION: [Specific logical fallacy they should avoid. Example: 'Avoid [fallacy name] by [specific logical correction]']",
    "LOGICAL STRENGTHENING: [Specific way to improve reasoning structure. Example: 'Strengthen your causal chain by clarifying [mechanism] between [cause] and [effect]']"
  ],
  "enhanced_argument": "A COMPLETELY REWRITTEN version of their speech that:
  - Opens with a powerful hook using logical reasoning
  - Uses STRONG LOGICAL STRUCTURE with clear premises→conclusion chains
  - Includes reasoning frameworks (deductive, inductive, analogical, causal) appropriately
  - Addresses counterarguments proactively using logical refutation
  - Employs rhetorical devices (metaphor, repetition, parallel structure) to enhance logical points
  - Closes with memorable call to action that reinforces the logical conclusion
  - Maintains their original stance but DRAMATICALLY improves logical coherence and reasoning quality
  - If facts/statistics are included, they MUST be cited with sources or marked as '[NEED SOURCE: claim]'",
  
  "enhanced_feedback": {
    "argument_analysis": {
      "logical_structure": "DETAILED breakdown: Which premises are strong/weak? Where are logical gaps? What fallacies exist? Rate the argument chain step-by-step.",
      "evidence_quality": "SPECIFIC assessment: What logical reasoning frameworks were used? What logical gaps exist? Which premises need strengthening? Rate logical structure on validity, coherence, and reasoning quality. If facts/statistics are mentioned, note they should be cited with sources.",
      "clarity_score": [1-10],
      "persuasiveness": "CONCRETE analysis: What psychological triggers work? What falls flat? How could framing improve? Which words have impact?"
    },
    "data_enhancements": {
      "logical_frameworks": [
        "DEDUCTIVE REASONING: 'If [premise A], and [premise B], then [conclusion]. This creates a valid logical structure.'",
        "INDUCTIVE REASONING: 'Based on [pattern/observation], we can reasonably conclude [generalization].'",
        "ANALOGICAL REASONING: '[Situation X] is like [Situation Y] because [logical similarity]. Therefore, [conclusion].'",
        "CAUSAL REASONING: '[Cause] leads to [Effect] through [mechanism]. This logical chain shows [conclusion].'"
      ],
      "premise_strengthening": [
        "CLARIFY ASSUMPTION: 'Your argument assumes [X]. Either defend this assumption logically or restructure: [alternative premise].'",
        "ADD PREMISE: 'Add a premise: [premise] to bridge the logical gap between [point A] and [point B].'",
        "STRENGTHEN LOGIC: 'Your premise [quote] needs logical support. Restructure as: Because [reason], and because [reason], therefore [conclusion].'"
      ],
      "fallacy_corrections": [
        "IDENTIFY FALLACY: 'You commit [fallacy name] at [quote]. The logical flaw is [reason]. Correct by [specific fix].'",
        "AVOID FALLACY: 'Avoid [fallacy name] by [specific logical correction]. Use [reasoning framework] instead.'",
        "LOGICAL GAP: 'There's a logical gap between [premise] and [conclusion]. Add: [missing logical step].'"
      ],
      "reasoning_improvements": [
        "LOGICAL STRUCTURE: 'Restructure your argument: [premise 1] + [premise 2] → [conclusion]. This creates a valid logical chain.'",
        "COUNTERARGUMENT LOGIC: 'Address the logical counterargument: If [opponent's premise], then [their conclusion]. Refute by showing [logical flaw].'",
        "BURDEN OF PROOF: 'Your argument shifts burden of proof incorrectly. Establish [logical requirement] to meet your burden.'"
      ]
    },
    "counter_arguments": [
      {
        "rebuttal": "STRONGEST OPPONENT ARGUMENT: [Exactly what a skilled opponent would say using logical reasoning, phrased powerfully. Must be 2-3 sentences focusing on logical flaws. Example: 'Your argument fails because [specific logical flaw]. Your premise [quote from transcript] assumes [unstated assumption] without justification. This creates a logical gap because [reason]. A stronger logical structure would require [specific logical element].'",
        "strength_level": "High",
        "supporting_evidence": "LOGICAL REASONING OPPONENT WOULD USE: [Specific logical frameworks and reasoning approaches. Example: 'The opponent would use [deductive/inductive/analogical] reasoning: If [premise A], and [premise B], then [contrary conclusion]. They would point out the logical fallacy of [specific fallacy name] in your argument at [quote location]. They would argue that your conclusion doesn't necessarily follow because [logical gap].'",
        "common_sources": "LOGICAL FRAMEWORKS OPPONENT WOULD USE: [Specific reasoning approaches and logical structures. Example: 'The opponent would likely use: 1) Reductio ad absurdum by showing your argument leads to [absurd conclusion], 2) False dichotomy by pointing out [third option], 3) Causal reasoning to show [alternative cause-effect relationship].'",
        "key_points": [
          "KEY POINT 1: [Specific logical talking point opponent would use. Example: 'Your argument commits [fallacy name] because [specific reason]. The logical structure fails at [premise/conclusion] because [reason].']",
          "KEY POINT 2: [Another specific logical talking point. Example: 'Your conclusion doesn't follow from your premises. You assume [X] but never justify it. A valid argument would require [Y].']",
          "KEY POINT 3: [Third specific logical talking point. Example: 'This ignores the logical principle of [principle name]. If we apply [reasoning framework], we see [contrary conclusion].']",
          "KEY POINT 4: [Fourth specific logical talking point. Example: 'Your causal reasoning is flawed. You claim [A] causes [B], but [C] is a more likely cause, or [B] could occur without [A].']"
        ]
      },
      {
        "rebuttal": "SECOND OPPONENT ATTACK: [Another powerful counterargument that targets a different weakness in their speech. Must be specific and reference their actual argument. 2-3 sentences.]",
        "strength_level": "High",
        "supporting_evidence": "THEIR EVIDENCE: [Specific data, statistics, or case studies with sources. Must include numbers and dates.]",
        "common_sources": "THEIR SOURCES: [Where this argument commonly appears - specific publications, experts, or research]",
        "key_points": [
          "KEY POINT 1: [Specific talking point for this counterargument]",
          "KEY POINT 2: [Another specific talking point with evidence]",
          "KEY POINT 3: [Third specific talking point]",
          "KEY POINT 4: [Fourth specific talking point]"
        ]
      },
      {
        "rebuttal": "THIRD OPPONENT POINT: [Medium-strength counterargument targeting another aspect. Must be specific, not generic. 2-3 sentences.]",
        "strength_level": "Medium",
        "supporting_evidence": "THEIR LOGIC: [How they'd support this point - specific reasoning, examples, or data]",
        "common_sources": "ORIGIN: [Common source of this argument - specific publications or experts]",
        "key_points": [
          "KEY POINT 1: [Specific talking point for this counterargument]",
          "KEY POINT 2: [Another specific talking point]",
          "KEY POINT 3: [Third specific talking point]"
        ]
      }
    ],
    "defense_strategies": [
      {
        "preemptive_defense": "BEFORE THEY ATTACK: '[EXACT WORD-FOR-WORD PHRASE to include in opening that neutralizes counterargument #1 using logical reasoning. Must be 2-3 sentences, ready to use. Example: \"Some might argue that [counterargument], but this commits [fallacy name] because [logical reason]. The logical structure of my argument shows [premise→conclusion chain].\" Include where to place it: \"Place this immediately after your opening hook, at approximately [X] seconds.\"]",
        "direct_response": "WHEN CONFRONTED: '[EXACT WORD-FOR-WORD talking points using logical reasoning to counter rebuttal #1. Focus on logical structure, not unsourced facts. Example: \"I understand your concern about [counterargument], but your reasoning contains [logical flaw]. My argument uses [reasoning framework] where [premise A] and [premise B] logically lead to [conclusion]. Your counterargument assumes [unstated assumption] which I can address by [logical response].\" Make this 3-4 sentences, ready to deliver. If you need facts, say: \"Research shows [claim] - you should verify this from [source type], and it supports my premise because [logical connection].\"]",
        "redirect_technique": "PIVOT STRATEGY: '[EXACT WORD-FOR-WORD technique to acknowledge logical concern then redirect using reasoning. Example: \"While [concede minor logical point], the real issue is [your logical strength]. Consider the logical structure: if [premise], then [conclusion]. This matters because [logical impact].\" Must be 3-4 sentences, actionable.]",
        "evidence_arsenal": "LOGICAL ARSENAL: '[Specific reasoning frameworks and logical approaches to use. List 3-4 logical strategies. Example: \"1) Use deductive reasoning: If [premise A], and [premise B], then [conclusion]. 2) Apply analogical reasoning: [Situation X] is like [Situation Y] because [logical similarity]. 3) Use causal reasoning: [Cause] leads to [Effect] through [mechanism]. 4) Address their fallacy: Their argument commits [fallacy name] because [reason].\" If facts are needed, mark as: \"[NEED SOURCE: claim] - verify from [source type] and cite properly.\"]",
        "key_points": [
          "TALKING POINT 1: [Specific logical point to make when countering. Example: 'Point out their logical fallacy: Their argument commits [fallacy name] because [reason]. A valid logical structure would require [X].']",
          "TALKING POINT 2: [Another specific logical point. Example: 'Use [reasoning framework]: If [premise A], and [premise B], then [your conclusion]. Their counterargument fails because it assumes [unstated assumption].']",
          "TALKING POINT 3: [Third specific logical point. Example: 'Strengthen your premise: Your argument assumes [X]. Defend this by showing [logical justification]. Alternatively, restructure: Because [Y], and because [Z], therefore [conclusion].']",
          "TALKING POINT 4: [Fourth specific logical point. Example: 'Address their logical gap: They claim [X] causes [Y], but this ignores [alternative explanation]. The logical relationship is actually [corrected relationship].']"
        ]
      },
      {
        "preemptive_defense": "NEUTRALIZE #2: '[EXACT WORD-FOR-WORD preemptive framing for counterargument #2. Include where to place it in speech. 2-3 sentences, ready to use.]",
        "direct_response": "COUNTER #2: '[EXACT WORD-FOR-WORD response with specific evidence. Include actual statistics and quotes. 3-4 sentences, ready to deliver.]",
        "redirect_technique": "REFRAME #2: '[EXACT WORD-FOR-WORD technique to turn their attack into your advantage. Example format. 3-4 sentences, actionable.]",
        "evidence_arsenal": "DATA DUMP #2: '[List 3-4 specific pieces of evidence with full attribution: statistics, expert quotes, case studies. Each with source, date, and specific numbers.]",
        "key_points": [
          "TALKING POINT 1: [Specific point for countering argument #2]",
          "TALKING POINT 2: [Another specific point with evidence]",
          "TALKING POINT 3: [Third specific point]",
          "TALKING POINT 4: [Fourth specific point]",
          "TALKING POINT 5: [Fifth specific point]"
        ]
      },
      {
        "preemptive_defense": "ADDRESS #3: '[EXACT WORD-FOR-WORD how to handle counterargument #3 proactively. Include placement in speech. 2-3 sentences, ready to use.]",
        "direct_response": "REFUTE #3: '[EXACT WORD-FOR-WORD direct counter with specifics. Include actual data and examples. 3-4 sentences, ready to deliver.]",
        "redirect_technique": "SPIN #3: '[EXACT WORD-FOR-WORD reframing technique. Complete sentences, actionable. 3-4 sentences.]",
        "evidence_arsenal": "PROOF #3: '[List 3-4 specific pieces of evidence with full attribution. Each with source, date, numbers/quotes. Ready to use.]",
        "key_points": [
          "TALKING POINT 1: [Specific point for countering argument #3]",
          "TALKING POINT 2: [Another specific point]",
          "TALKING POINT 3: [Third specific point]",
          "TALKING POINT 4: [Fourth specific point]"
        ]
      }
    ],
    "strategic_recommendations": [
      "OPENING STRATEGY: [Specific technique for powerful introduction with example]",
      "EVIDENCE STRATEGY: [Which types of evidence to prioritize and where to place them]",
      "EMOTIONAL APPEAL: [Specific story, metaphor, or framing to use]",
      "STRUCTURAL IMPROVEMENT: [Exact reorganization of arguments for maximum impact]",
      "CLOSING TECHNIQUE: [Specific call-to-action or memorable final statement]",
      "DELIVERY TIP: [Concrete advice on pacing, emphasis, or rhetorical devices]"
    ]
  }
}

CRITICAL REQUIREMENTS FOR ACCURACY:
- Score BASED ON ACTUAL PERFORMANCE, not participation
- Logic: Review argument structure, logical connections, evidence use, fallacies. Identify SPECIFIC logical gaps by quoting their exact words.
- Rhetoric: Analyze persuasive devices (ethos, pathos, logos), language impact, narrative structure. Name SPECIFIC rhetorical devices they used or missed.
- Empathy: Look for perspective-taking, acknowledgment of counterarguments, respectful tone. Quote where they addressed or failed to address opposing views.
- Delivery: Assess clarity from transcript, organization, coherence, articulation indicators. Reference SPECIFIC sentences or phrases that demonstrate clarity or confusion.
- Provide SPECIFIC, CONCRETE examples from their speech - quote exact phrases
- Give ACTIONABLE advice with exact techniques to improve - include word-for-word examples
- NO vague feedback like "be better" - give SPECIFIC strategies with exact wording
- Enhanced argument should be dramatically improved, not just polished - rewrite with real statistics and examples

CRITICAL - MANDATORY SECTIONS - THESE MUST ALWAYS BE INCLUDED:

1. "missing_points": MUST provide at least 3-5 specific points they missed. Each should be a logical argument, premise gap, or reasoning framework they could add.

2. "enhanced_argument": MUST provide a completely rewritten version of their speech with improved logical structure, rhetorical devices, and addressing counterarguments.

3. "enhanced_feedback.counter_arguments": MUST provide EXACTLY 3 counterarguments. Each MUST:
   - Include "rebuttal" (2-3 sentences of what opponent would say)
   - Include "strength_level" ("High", "Medium", or "Low")
   - Include "supporting_logic" (logical reasoning opponent would use)
   - Include "logical_frameworks" (reasoning approaches like deductive, inductive, etc.)
   - Include "key_points" array with 4 specific logical talking points

4. "enhanced_feedback.defense_strategies": MUST provide EXACTLY 3 defense strategies (one for each counterargument). Each MUST:
   - Include "preemptive_defense" (2-3 sentences, word-for-word phrases)
   - Include "direct_response" (3-4 sentences, ready to use)
   - Include "redirect_technique" (3-4 sentences, reframing technique)
   - Include "logical_arsenal" (3-4 logical approaches to use)
   - Include "key_points" array with 4 specific talking points

5. "enhanced_feedback.argument_analysis": MUST include:
   - "logical_structure" (detailed breakdown)
   - "reasoning_quality" (assessment of reasoning types used)
   - "clarity_score" (1-10 number)
   - "persuasiveness" (concrete analysis)

6. "enhanced_feedback.strategic_recommendations": MUST provide at least 5-7 strategic recommendations

ALL THESE SECTIONS ARE REQUIRED - DO NOT OMIT ANY OF THEM. If a section seems difficult, provide reasonable defaults but always include the structure.

VALIDATION CHECKLIST - Before returning JSON, verify:
✓ Every counter_argument.rebuttal is 2-3 sentences and references their actual speech
✓ Every counter_argument.supporting_evidence includes specific numbers, dates, and source names
✓ Every counter_argument.key_points has 4 specific talking points (opponent's key arguments)
✓ Every defense_strategy.direct_response is 3-4 sentences with exact wording
✓ Every defense_strategy.evidence_arsenal lists 3-4 specific pieces of evidence with sources
✓ Every defense_strategy.key_points has 4 specific talking points (speaker's defense points)
✓ All feedback points are specific and actionable (no vague phrases)
✓ All feedback references exact quotes from their transcript
✓ All arrays have at least 3 items
✓ Counter and defense key_points lists each have exactly 4 entries and are directly reused in the enhanced argument/defense narratives
✓ All key_points are specific, actionable, and include evidence or exact wording

FINAL REMINDER - CRITICAL FOR QUALITY:
1. Every single feedback point MUST quote their exact words from the transcript
2. Every suggestion MUST include exact word-for-word replacements, not vague advice
3. counter_arguments MUST be 3 detailed counterarguments (2-3 sentences each) with specific statistics and sources
4. counter_arguments.key_points MUST be 4 specific talking points the opponent will use (each with evidence/statistics)
5. defense_strategies MUST be 3 complete defense strategies (3-4 sentences each) with exact word-for-word phrases ready to use
6. defense_strategies.key_points MUST be 4 specific talking points the speaker should use (each with exact wording, stats, or quotes ready to deliver)
7. NO generic feedback like "improve your argument" - MUST be specific: "Your premise '[exact quote]' needs [specific statistic] from [source]"
8. If any section seems incomplete, expand it until it meets the minimum requirements
9. Explicitly reuse each counter/defense key_point inside the enhanced argument and defense responses so the points are actionable in performance

OUTPUT FORMAT REQUIREMENTS - CRITICAL:

YOU MUST RETURN A VALID JSON OBJECT with ALL required fields. Do NOT include explanatory text before or after the JSON. Return ONLY the JSON object.

REQUIRED JSON STRUCTURE:
{
  "logic_score": <0-10 number>,
  "logic_feedback": ["feedback1", "feedback2", ...],
  "rhetoric_score": <0-10 number>,
  "rhetoric_feedback": ["feedback1", "feedback2", ...],
  "empathy_score": <0-5 number>,
  "empathy_feedback": ["feedback1", "feedback2", ...],
  "delivery_score": <0-5 number>,
  "delivery_feedback": ["feedback1", "feedback2", ...],
  "missing_points": ["point1", "point2", ...],
  "enhanced_argument": "<full rewritten argument text here - must be substantial, 200+ words>",
  "enhanced_feedback": {
    "argument_analysis": {
      "logical_structure": "<detailed analysis>",
      "evidence_quality": "<detailed analysis>",
      "clarity_score": <1-10 number>,
      "persuasiveness": "<detailed analysis>"
    },
    "data_enhancements": {
      "logical_frameworks": ["framework1", "framework2", ...],
      "premise_strengthening": ["premise1", "premise2", ...],
      "fallacy_corrections": ["correction1", "correction2", ...],
      "reasoning_improvements": ["improvement1", "improvement2", ...]
    },
    "counter_arguments": [
      {
        "rebuttal": "<2-3 sentences of opponent's argument>",
        "strength_level": "High|Medium|Low",
        "supporting_evidence": "<logical reasoning opponent would use>",
        "common_sources": "<where opponent finds this>",
        "key_points": ["point1", "point2", "point3", "point4"]
      },
      ... (must have 3 counterarguments)
    ],
    "defense_strategies": [
      {
        "preemptive_defense": "<2-3 sentences ready to use>",
        "direct_response": "<3-4 sentences ready to use>",
        "redirect_technique": "<3-4 sentences ready to use>",
        "evidence_arsenal": "<logical approaches and evidence>",
        "key_points": ["point1", "point2", "point3", "point4", "point5"]
      },
      ... (must have 3 defense strategies)
    ],
    "strategic_recommendations": ["rec1", "rec2", ...]
  }
}

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanatory text
2. enhanced_argument MUST be a substantial rewritten version (200+ words minimum)
3. counter_arguments MUST have exactly 3 items, each with all fields filled
4. defense_strategies MUST have exactly 3 items, each with all fields filled
5. All arrays must have at least 3 items
6. All text fields must be substantial (not empty strings)
7. Use proper JSON escaping for quotes and newlines

DO NOT wrap the JSON in markdown code blocks. Return the raw JSON object only.
`;
  }

  private parseAnalysis(analysis: string, originalTranscript: string): ScoreResult {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 PARSE ANALYSIS - Starting parse...');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📥 Raw AI response received, length:', analysis.length);
    console.log('📥 First 1000 chars:', analysis.substring(0, 1000));
    console.log('📥 Last 1000 chars:', analysis.substring(Math.max(0, analysis.length - 1000)));
    
    // Check what format we're dealing with
    const hasJsonCodeBlock = /```(?:json)?\s*\{/.test(analysis);
    const hasJsonBraces = analysis.includes('{') && analysis.includes('"logic_score"');
    const isJsonLike = hasJsonCodeBlock || analysis.trim().startsWith('{') || hasJsonBraces || analysis.includes('"enhanced_argument"');
    const isTextLike = !isJsonLike && (analysis.includes('LOGIC SCORE') || analysis.includes('Enhanced Argument') || analysis.includes('Counterargument'));
    
    console.log('🔍 Format detection - Has JSON code block:', hasJsonCodeBlock);
    console.log('🔍 Format detection - Has JSON braces:', hasJsonBraces);
    console.log('🔍 Format detection - JSON-like:', isJsonLike, 'Text-like:', isTextLike);
    
    // Try JSON parsing first if it looks like JSON
    if (isJsonLike) {
      try {
        console.log('🔍 Attempting JSON parsing (format detected as JSON)...');
        const jsonResult = this.parseAsJson(analysis, originalTranscript);
        console.log('✅ JSON parsing successful!');
        console.log('📊 JSON Result - Enhanced Argument length:', jsonResult.enhancedArgument?.length || 0);
        console.log('📊 JSON Result - Enhanced Argument preview:', jsonResult.enhancedArgument?.substring(0, 300) || 'N/A');
        console.log('📊 JSON Result - Counter arguments:', jsonResult.enhancedFeedback?.counterArguments?.length || 0);
        console.log('📊 JSON Result - Defense strategies:', jsonResult.enhancedFeedback?.defenseStrategies?.length || 0);
        return jsonResult;
      } catch (jsonError) {
        console.warn('⚠️ JSON parsing failed, attempting text parsing:', jsonError instanceof Error ? jsonError.message : String(jsonError));
        console.warn('⚠️ JSON Error details:', jsonError);
        // Fall through to text parsing
      }
    }
    
    // Try text parsing
    try {
      console.log('🔍 Attempting text parsing...');
      const textResult = this.parseAsText(analysis, originalTranscript);
      console.log('✅ Text parsing successful!');
      console.log('📊 Text Result - Enhanced Argument length:', textResult.enhancedArgument?.length || 0);
      console.log('📊 Text Result - Enhanced Argument preview:', textResult.enhancedArgument?.substring(0, 300) || 'N/A');
      console.log('📊 Text Result - Counter arguments:', textResult.enhancedFeedback?.counterArguments?.length || 0);
      console.log('📊 Text Result - Defense strategies:', textResult.enhancedFeedback?.defenseStrategies?.length || 0);
      return textResult;
    } catch (textError) {
      console.error('❌ Text parsing also failed, using fallback');
      console.error('❌ Text Error details:', textError);
      const fallbackResult = this.createFallbackResult(analysis, originalTranscript);
      console.log('📊 Fallback Result - Enhanced Argument length:', fallbackResult.enhancedArgument?.length || 0);
      console.log('📊 Fallback Result - Enhanced Argument preview:', fallbackResult.enhancedArgument?.substring(0, 300) || 'N/A');
      return fallbackResult;
    }
  }

  private parseAsJson(analysis: string, originalTranscript: string): ScoreResult {
    try {
      console.log('🔍 JSON PARSING - Starting JSON extraction...');
      // Clean the response - remove markdown code blocks if present
      let cleanedAnalysis = analysis.trim();
      console.log('🔍 Original analysis length:', cleanedAnalysis.length);
      
      // Remove common prefixes like "Full response:", "Response:", etc.
      cleanedAnalysis = cleanedAnalysis.replace(/^(Full\s+response|Response|Here\s+is|Analysis):\s*/i, '');
      
      // Remove markdown code fences if present (```json or ```) - handle multiline
      // First, try to find and extract JSON between code fences
      const codeBlockMatch = cleanedAnalysis.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch && codeBlockMatch[1]) {
        console.log('✅ Found JSON in code block, extracting...');
        cleanedAnalysis = codeBlockMatch[1].trim();
      } else {
        // Fallback: remove code fences from start/end
        cleanedAnalysis = cleanedAnalysis.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
        cleanedAnalysis = cleanedAnalysis.replace(/\s*```\s*$/i, '');
      }
      
      console.log('🔍 After code block removal, length:', cleanedAnalysis.length);
      
      // Find JSON object boundaries - look for first { and last }
      const firstBrace = cleanedAnalysis.indexOf('{');
      const lastBrace = cleanedAnalysis.lastIndexOf('}');
      
      console.log('🔍 JSON braces found - first:', firstBrace, 'last:', lastBrace);
      
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        console.error('❌ No valid JSON braces found');
        console.error('🔍 First 500 chars of cleaned analysis:', cleanedAnalysis.substring(0, 500));
        throw new Error('No JSON braces found in response');
      }

      // Extract JSON using brace balancing
      let braceCount = 0;
      let jsonStart = firstBrace;
      let jsonEnd = firstBrace;
      let inString = false;
      let escaped = false;
      
      for (let i = firstBrace; i < cleanedAnalysis.length; i++) {
        const char = cleanedAnalysis[i];
        if (char === '\\' && inString) {
          escaped = !escaped;
          continue;
        }
        if (char === '"' && !escaped) {
          inString = !inString;
          escaped = false;
          continue;
        }
        escaped = false;
        if (!inString) {
          if (char === '{') {
            if (braceCount === 0) jsonStart = i;
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              jsonEnd = i;
              break;
            }
          }
        }
      }
      
      let jsonString = '';
      if (braceCount === 0 && jsonEnd > jsonStart) {
        jsonString = cleanedAnalysis.substring(jsonStart, jsonEnd + 1);
        console.log('✅ Found balanced JSON object');
        console.log('🔍 Extracted JSON length:', jsonString.length);
        console.log('🔍 Extracted JSON preview (first 500 chars):', jsonString.substring(0, 500));
      } else {
        jsonString = cleanedAnalysis.substring(firstBrace, lastBrace + 1);
        console.warn('⚠️ Using fallback extraction (brace count:', braceCount, ')');
        console.log('🔍 Fallback JSON length:', jsonString.length);
      }

      jsonString = this.balanceJsonBraces(jsonString);
      console.log('🔍 After balancing braces, JSON length:', jsonString.length);
      let parsed;
      
      try {
        parsed = JSON.parse(jsonString);
        console.log('✅ Successfully parsed JSON on first attempt');
        console.log('📊 Parsed JSON keys:', Object.keys(parsed));
        console.log('📊 Parsed enhanced_argument exists:', !!parsed.enhanced_argument);
        console.log('📊 Parsed enhanced_argument length:', parsed.enhanced_argument?.length || 0);
        console.log('📊 Parsed counter_arguments count:', parsed.enhanced_feedback?.counter_arguments?.length || 0);
        console.log('📊 Parsed defense_strategies count:', parsed.enhanced_feedback?.defense_strategies?.length || 0);
        if (parsed.enhanced_argument) {
          console.log('📊 Parsed enhanced_argument preview:', parsed.enhanced_argument.substring(0, 300));
        }
        if (parsed.enhanced_feedback?.counter_arguments) {
          console.log('📊 First counterargument preview:', JSON.stringify(parsed.enhanced_feedback.counter_arguments[0], null, 2));
        }
        if (parsed.enhanced_feedback?.defense_strategies) {
          console.log('📊 First defense strategy preview:', JSON.stringify(parsed.enhanced_feedback.defense_strategies[0], null, 2));
        }
      } catch (parseError) {
        console.warn('⚠️ Initial JSON parse failed, attempting to fix...');
        console.warn('⚠️ Parse error:', parseError instanceof Error ? parseError.message : String(parseError));
        console.warn('⚠️ JSON string length:', jsonString.length);
        console.warn('⚠️ JSON string preview:', jsonString.substring(0, 500));
        try {
          let fixedJson = this.repairJsonString(jsonString);
          parsed = JSON.parse(fixedJson);
          console.log('✅ Successfully parsed JSON after fixing');
          console.log('📊 Fixed JSON - enhanced_argument exists:', !!parsed.enhanced_argument);
        } catch (fixError) {
          console.warn('⚠️ Fixed JSON parse also failed, trying minimal extraction...');
          console.warn('⚠️ Fix error:', fixError instanceof Error ? fixError.message : String(fixError));
          try {
            const minimalJson = this.extractMinimalValidJson(jsonString);
            parsed = JSON.parse(minimalJson);
            console.log('✅ Successfully parsed minimal JSON');
            console.log('📊 Minimal JSON - enhanced_argument exists:', !!parsed.enhanced_argument);
          } catch (minimalError) {
            console.error('❌ All JSON parsing attempts failed');
            console.error('❌ Minimal error:', minimalError instanceof Error ? minimalError.message : String(minimalError));
            throw new Error(`Failed to parse AI response as JSON. Error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          }
        }
      }

      const result = this.buildScoreResultFromParsed(parsed, originalTranscript);
      console.log('📊 Final Result - Enhanced Argument:', result.enhancedArgument?.substring(0, 200) || 'EMPTY');
      console.log('📊 Final Result - Enhanced Argument full length:', result.enhancedArgument?.length || 0);
      return result;
    } catch (error) {
      throw error;
    }
  }

  private parseAsText(analysis: string, originalTranscript: string): ScoreResult {
    console.log('📝 Parsing as structured text...');
    
    const text = analysis.trim();
    
    // Extract scores using regex patterns
    const extractScore = (label: string, defaultValue: number = 0): number => {
      const patterns = [
        new RegExp(`${label}\\s*[:=]\\s*(\\d+)`, 'i'),
        new RegExp(`${label}\\s+(\\d+)`, 'i'),
        new RegExp(`"${label.toLowerCase().replace(/\s+/g, '_')}"\\s*[:=]\\s*(\\d+)`, 'i'),
        new RegExp(`${label.toUpperCase()}\\s*[:=]\\s*(\\d+)`, 'i')
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const score = parseInt(match[1], 10);
          if (!isNaN(score) && score >= 0 && score <= 10) {
            console.log(`✅ Extracted ${label} score:`, score);
            return score;
          }
        }
      }
      console.warn(`⚠️ Could not extract ${label} score, using default:`, defaultValue);
      return defaultValue;
    };

    // Extract feedback arrays
    const extractFeedback = (label: string): string[] => {
      const patterns = [
        new RegExp(`${label}\\s*[:\\n]\\s*([\\s\\S]*?)(?=\\n\\n|\\n[A-Z]{2,}|\\n\\s*(?:logic|rhetoric|empathy|delivery|missing|enhanced|counter|defense|strategic)|$)`, 'i'),
        new RegExp(`"${label.toLowerCase().replace(/\s+/g, '_')}"\\s*[:\\[\\]]\\s*\\[([\\s\\S]*?)\\]`, 'i'),
        new RegExp(`${label.toUpperCase()}\\s*[:\\n]\\s*([\\s\\S]*?)(?=\\n\\n|\\n[A-Z]{2,}|$)`, 'i')
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const items = match[1]
            .split(/[-•*]\s*|\d+\.\s*|,\s*"/)
            .map(item => item.trim().replace(/^["']|["']$/g, ''))
            .filter(item => item.length > 0 && !item.match(/^[\[\]"]+$/));
          
          if (items.length > 0) {
            console.log(`✅ Extracted ${label} feedback:`, items.length, 'items');
            return items;
          }
        }
      }
      
      const labelIndex = text.toLowerCase().indexOf(label.toLowerCase());
      if (labelIndex !== -1) {
        const afterLabel = text.substring(labelIndex + label.length);
        const nextSection = afterLabel.match(/^[:\n]\s*([^\n]+(?:\n[^\n]+)*)/);
        if (nextSection && nextSection[1]) {
          const item = nextSection[1].trim();
          if (item.length > 0) {
            console.log(`✅ Extracted ${label} feedback (single item):`, item.substring(0, 100));
            return [item];
          }
        }
      }
      
      console.warn(`⚠️ Could not extract ${label} feedback`);
      return [];
    };

    const logicScore = extractScore('logic score|logic_score', 0);
    const rhetoricScore = extractScore('rhetoric score|rhetoric_score', 0);
    const empathyScore = extractScore('empathy score|empathy_score', 0);
    const deliveryScore = extractScore('delivery score|delivery_score', 0);

    const logicFeedback = extractFeedback('logic feedback|logic_feedback');
    const rhetoricFeedback = extractFeedback('rhetoric feedback|rhetoric_feedback');
    const empathyFeedback = extractFeedback('empathy feedback|empathy_feedback');
    const deliveryFeedback = extractFeedback('delivery feedback|delivery_feedback');

    // Extract missing points
    const missingPointsMatch = text.match(/(?:missing points|missing_points)[:\n]\s*([\s\S]*?)(?=\n\n|\n[A-Z]{2,}|enhanced|counter|defense|$)/i);
    const missingPoints = missingPointsMatch 
      ? missingPointsMatch[1].split(/[-•*]\s*|\d+\.\s*|,\s*"/).map(p => p.trim().replace(/^["']|["']$/g, '')).filter(p => p.length > 0 && !p.match(/^[\[\]{}]+$/))
      : [];

    // Extract enhanced argument - improved regex to capture multiline content
    // Try multiple patterns to catch different formats
    let enhancedArgument = '';
    
    console.log('🔍 TEXT PARSING - Looking for enhanced argument in text...');
    console.log('🔍 TEXT PARSING - Text length:', text.length);
    
    // Pattern 1: "enhanced argument:" or "enhanced_argument:" followed by content
    const pattern1 = /(?:enhanced\s+argument|enhanced_argument)\s*[:=]\s*([\s\S]*?)(?=\n\s*(?:enhanced\s+feedback|counter|defense|strategic|argument\s+analysis|data\s+enhancements|missing\s+points|\[|\{)|$)/i;
    let match1 = text.match(pattern1);
    if (match1 && match1[1]) {
      enhancedArgument = match1[1].trim();
      console.log('✅ Pattern 1 matched, length:', enhancedArgument.length);
    }
    
    // Pattern 2: Look for "ENHANCED ARGUMENT:" in uppercase
    if (!enhancedArgument || enhancedArgument.length < 50) {
      const pattern2 = /ENHANCED\s+ARGUMENT\s*[:=]\s*([\s\S]*?)(?=\n\s*(?:ENHANCED|COUNTER|DEFENSE|STRATEGIC|ANALYSIS|MISSING)|$)/i;
      const match2 = text.match(pattern2);
      if (match2 && match2[1] && match2[1].trim().length > enhancedArgument.length) {
        enhancedArgument = match2[1].trim();
        console.log('✅ Pattern 2 matched, length:', enhancedArgument.length);
      }
    }
    
    // Pattern 3: Look for content between "enhanced argument" and next major section
    if (!enhancedArgument || enhancedArgument.length < 50) {
      const enhancedIndex = text.toLowerCase().indexOf('enhanced argument');
      if (enhancedIndex !== -1) {
        console.log('🔍 Found "enhanced argument" at index:', enhancedIndex);
        const afterLabel = text.substring(enhancedIndex + 'enhanced argument'.length);
        // Find the colon or newline after the label
        const colonIndex = afterLabel.indexOf(':');
        const newlineIndex = afterLabel.indexOf('\n');
        const startIndex = colonIndex !== -1 && (newlineIndex === -1 || colonIndex < newlineIndex) 
          ? colonIndex + 1 
          : newlineIndex !== -1 ? newlineIndex + 1 : 0;
        
        const contentStart = afterLabel.substring(startIndex).trim();
        console.log('🔍 Content start preview:', contentStart.substring(0, 200));
        
        // Find where the next major section starts
        const nextSectionPattern = /\n\s*(?:enhanced\s+feedback|counter|defense|strategic|argument\s+analysis|data\s+enhancements|missing\s+points|\[|\{)/i;
        const nextSectionMatch = contentStart.match(nextSectionPattern);
        if (nextSectionMatch) {
          enhancedArgument = contentStart.substring(0, nextSectionMatch.index).trim();
          console.log('✅ Pattern 3 matched (with next section), length:', enhancedArgument.length);
        } else {
          // Take everything until end or next uppercase section header
          const nextUppercase = contentStart.match(/\n[A-Z]{2,}/);
          if (nextUppercase) {
            enhancedArgument = contentStart.substring(0, nextUppercase.index).trim();
            console.log('✅ Pattern 3 matched (with uppercase header), length:', enhancedArgument.length);
          } else {
            // Take a reasonable chunk (up to 5000 chars) if no clear boundary
            enhancedArgument = contentStart.substring(0, 5000).trim();
            console.log('✅ Pattern 3 matched (fallback chunk), length:', enhancedArgument.length);
          }
        }
      }
    }
    
    // Pattern 4: Look for JSON-like structure with "enhanced_argument"
    if (!enhancedArgument || enhancedArgument.length < 50) {
      const jsonPattern = /"enhanced_argument"\s*:\s*"((?:[^"\\]|\\.|\\n)+)"/;
      const jsonMatch = text.match(jsonPattern);
      if (jsonMatch && jsonMatch[1]) {
        const decoded = jsonMatch[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\');
        if (decoded.length > enhancedArgument.length) {
          enhancedArgument = decoded.trim();
          console.log('✅ Pattern 4 matched (JSON), length:', enhancedArgument.length);
        }
      }
    }
    
    // Pattern 5: Look for multiline text after "Enhanced Argument" header
    if (!enhancedArgument || enhancedArgument.length < 50) {
      const headerPattern = /(?:^|\n)\s*(?:Enhanced\s+Argument|ENHANCED\s+ARGUMENT)\s*[:]\s*\n([\s\S]*?)(?=\n\s*(?:Enhanced|Counter|Defense|Strategic|Analysis|Missing|\[|\{)|$)/im;
      const headerMatch = text.match(headerPattern);
      if (headerMatch && headerMatch[1]) {
        const candidate = headerMatch[1].trim();
        if (candidate.length > enhancedArgument.length) {
          enhancedArgument = candidate;
          console.log('✅ Pattern 5 matched (header), length:', enhancedArgument.length);
        }
      }
    }
    
    // Clean up common prefixes/suffixes and markdown
    enhancedArgument = enhancedArgument
      .replace(/^["']|["']$/g, '')
      .replace(/^```[\w]*\n?|\n?```$/g, '')
      .replace(/^\*\*|\*\*$/g, '')
      .replace(/^#+\s*/, '')
      .trim();
    
    console.log('🔍 TEXT PARSING - Enhanced argument extracted:', enhancedArgument?.substring(0, 200) || 'EMPTY');
    console.log('🔍 TEXT PARSING - Enhanced argument length:', enhancedArgument?.length || 0);
    
    // If still empty or too short, log the full text around "enhanced" for debugging
    if (!enhancedArgument || enhancedArgument.length < 50) {
      const enhancedKeywordIndex = text.toLowerCase().indexOf('enhanced');
      if (enhancedKeywordIndex !== -1) {
        const contextStart = Math.max(0, enhancedKeywordIndex - 100);
        const contextEnd = Math.min(text.length, enhancedKeywordIndex + 2000);
        console.warn('⚠️ Enhanced argument not found. Context around "enhanced":', text.substring(contextStart, contextEnd));
      } else {
        console.warn('⚠️ "Enhanced" keyword not found in text at all');
        console.warn('⚠️ Text preview (first 2000 chars):', text.substring(0, 2000));
      }
    }

    // Extract counter arguments - improved extraction
    const extractCounterArguments = (): any[] => {
      console.log('🔍 Extracting counter arguments...');
      const counters: any[] = [];
      
      // Try to find counter arguments section
      const counterSectionPatterns = [
        /(?:counter.?arguments?|counter.?args?|anticipated\s+counterattacks?)[:\n]\s*/i,
        /COUNTER.?ARGUMENTS?[:\n]\s*/i,
        /"counter_arguments"\s*:\s*\[/i
      ];
      
      let counterSection = '';
      let counterSectionStart = -1;
      
      for (const pattern of counterSectionPatterns) {
        const match = text.match(pattern);
        if (match && match.index !== undefined) {
          counterSectionStart = match.index + match[0].length;
          counterSection = text.substring(counterSectionStart);
          console.log('✅ Found counter arguments section at index:', counterSectionStart);
          break;
        }
      }
      
      if (!counterSection) {
        console.warn('⚠️ Counter arguments section not found');
        // Try to find individual counterarguments scattered in text
        const scatteredPattern = /counterargument\s*#?\s*(\d+)[:\n\s]*([\s\S]{100,2000}?)(?=counterargument|defense|strategic|$)/gi;
        let match;
        while ((match = scatteredPattern.exec(text)) !== null && counters.length < 3) {
          const content = match[2] || '';
          const rebuttalMatch = content.match(/(?:rebuttal|the\s+attack|opponent\s+will\s+argue)[:\n\s]*([^\n]+(?:\n[^\n]+){0,5})/i);
          const strengthMatch = content.match(/(?:strength|threat|level)[:\n\s]*(high|medium|low)/i);
          
          counters.push({
            rebuttal: rebuttalMatch ? rebuttalMatch[1].trim() : content.substring(0, 300).trim(),
            strength_level: strengthMatch ? strengthMatch[1].charAt(0).toUpperCase() + strengthMatch[1].slice(1).toLowerCase() : 'Medium',
            supporting_evidence: content.match(/(?:supporting|evidence|logic)[:\n\s]*([^\n]+(?:\n[^\n]+){0,3})/i)?.[1]?.trim() || '',
            common_sources: content.match(/(?:sources?|common)[:\n\s]*([^\n]+(?:\n[^\n]+){0,2})/i)?.[1]?.trim() || '',
            key_points: content.match(/(?:key\s+points?|talking\s+points?)[:\n\s]*([^\n]+(?:\n[^\n]+){0,4})/i)?.[1]?.split(/[-•*]\s*|\d+\.\s*/).map(p => p.trim()).filter(p => p.length > 0) || []
          });
        }
      } else {
        // Extract from counter section
        const counterPatterns = [
          /counterargument\s*#?\s*(\d+)[:\n\s]*([\s\S]{200,3000}?)(?=counterargument\s*#?\s*\d+|defense|strategic|$)/gi,
          /rebuttal\s*#?\s*(\d+)[:\n\s]*([\s\S]{200,3000}?)(?=rebuttal\s*#?\s*\d+|defense|strategic|$)/gi,
          /\{\s*"rebuttal"\s*:\s*"([^"]+)"[\s\S]{100,2000}?\}/g
        ];
        
        for (const pattern of counterPatterns) {
          let match;
          while ((match = pattern.exec(counterSection)) !== null && counters.length < 3) {
            const content = match[2] || match[0] || '';
            
            // Extract rebuttal
            const rebuttalPatterns = [
              /(?:rebuttal|the\s+attack|opponent\s+will\s+argue|strongest\s+opponent)[:\n\s]*([^\n]+(?:\n[^\n]+){0,5})/i,
              /"rebuttal"\s*:\s*"([^"]+)"/i
            ];
            let rebuttal = '';
            for (const rp of rebuttalPatterns) {
              const rm = content.match(rp);
              if (rm && rm[1]) {
                rebuttal = rm[1].trim().replace(/\\"/g, '"').replace(/\\n/g, '\n');
                break;
              }
            }
            if (!rebuttal) {
              rebuttal = content.substring(0, 400).trim();
            }
            
            // Extract strength level
            const strengthMatch = content.match(/(?:strength|threat|level)[:\n\s]*(high|medium|low)/i);
            const strengthLevel = strengthMatch ? strengthMatch[1].charAt(0).toUpperCase() + strengthMatch[1].slice(1).toLowerCase() : 'Medium';
            
            // Extract supporting evidence
            const evidencePatterns = [
              /(?:supporting\s+evidence|supporting_logic|their\s+evidence|logic)[:\n\s]*([^\n]+(?:\n[^\n]+){0,5})/i,
              /"supporting_evidence"\s*:\s*"([^"]+)"/i
            ];
            let supportingEvidence = '';
            for (const ep of evidencePatterns) {
              const em = content.match(ep);
              if (em && em[1]) {
                supportingEvidence = em[1].trim().replace(/\\"/g, '"').replace(/\\n/g, '\n');
                break;
              }
            }
            
            // Extract common sources
            const sourcesMatch = content.match(/(?:common\s+sources?|sources?)[:\n\s]*([^\n]+(?:\n[^\n]+){0,3})/i);
            const commonSources = sourcesMatch ? sourcesMatch[1].trim() : '';
            
            // Extract key points
            const keyPointsMatch = content.match(/(?:key\s+points?|talking\s+points?)[:\n\s]*([\s\S]{50,1000}?)(?=\n\s*(?:key|talking|defense|strategic)|$)/i);
            let keyPoints: string[] = [];
            if (keyPointsMatch) {
              keyPoints = keyPointsMatch[1]
                .split(/[-•*]\s*|\d+\.\s*|\n\s*(?=\w)/)
                .map(p => p.trim())
                .filter(p => p.length > 10 && !p.match(/^(key|talking|points?)/i));
            }
            
            if (rebuttal && rebuttal.length > 20) {
              counters.push({
                rebuttal: rebuttal,
                strength_level: strengthLevel,
                supporting_evidence: supportingEvidence,
                common_sources: commonSources,
                key_points: keyPoints.length > 0 ? keyPoints : []
              });
              console.log(`✅ Extracted counterargument ${counters.length}, rebuttal length:`, rebuttal.length);
            }
          }
          if (counters.length >= 3) break;
        }
      }
      
      // If we still don't have enough, try JSON format
      if (counters.length < 3) {
        const jsonCounterMatch = text.match(/"counter_arguments"\s*:\s*\[([\s\S]*?)\]/i);
        if (jsonCounterMatch) {
          const counterObjects = jsonCounterMatch[1].match(/\{[\s\S]{100,2000}?\}/g);
          if (counterObjects) {
            counterObjects.slice(0, 3).forEach((objStr, idx) => {
              if (counters.length < 3) {
                const rebuttalMatch = objStr.match(/"rebuttal"\s*:\s*"([^"]+)"/i);
                const strengthMatch = objStr.match(/"strength_level"\s*:\s*"([^"]+)"/i);
                const evidenceMatch = objStr.match(/"supporting_evidence"\s*:\s*"([^"]+)"/i);
                const sourcesMatch = objStr.match(/"common_sources"\s*:\s*"([^"]+)"/i);
                const keyPointsMatch = objStr.match(/"key_points"\s*:\s*\[([\s\S]*?)\]/i);
                
                let keyPoints: string[] = [];
                if (keyPointsMatch) {
                  keyPoints = keyPointsMatch[1]
                    .match(/"([^"]+)"/g)
                    ?.map(kp => kp.replace(/^"|"$/g, '').replace(/\\"/g, '"').replace(/\\n/g, '\n')) || [];
                }
                
                counters.push({
                  rebuttal: rebuttalMatch ? rebuttalMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : `Counterargument ${idx + 1}`,
                  strength_level: strengthMatch ? strengthMatch[1] : 'Medium',
                  supporting_evidence: evidenceMatch ? evidenceMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '',
                  common_sources: sourcesMatch ? sourcesMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '',
                  key_points: keyPoints
                });
              }
            });
          }
        }
      }
      
      // Fill up to 3 if needed (but only if we have at least some content)
      while (counters.length < 3 && counters.length > 0) {
        const lastCounter = counters[counters.length - 1];
        if (lastCounter.rebuttal && lastCounter.rebuttal.length > 50) {
          // Don't add empty placeholders if we have real content
          break;
        }
        counters.push({
          rebuttal: `Counterargument ${counters.length + 1}: Analysis of potential opposing views`,
          strength_level: 'Medium',
          supporting_evidence: '',
          common_sources: '',
          key_points: []
        });
      }
      
      console.log(`✅ Extracted ${counters.length} counter arguments`);
      return counters.slice(0, 3);
    };

    // Extract defense strategies - improved extraction
    const extractDefenseStrategies = (): any[] => {
      console.log('🔍 Extracting defense strategies...');
      const defenses: any[] = [];
      
      // Try to find defense strategies section
      const defenseSectionPatterns = [
        /(?:defense.?strategies?|defense\s+strategies?)[:\n]\s*/i,
        /DEFENSE.?STRATEGIES?[:\n]\s*/i,
        /"defense_strategies"\s*:\s*\[/i
      ];
      
      let defenseSection = '';
      let defenseSectionStart = -1;
      
      for (const pattern of defenseSectionPatterns) {
        const match = text.match(pattern);
        if (match && match.index !== undefined) {
          defenseSectionStart = match.index + match[0].length;
          defenseSection = text.substring(defenseSectionStart);
          console.log('✅ Found defense strategies section at index:', defenseSectionStart);
          break;
        }
      }
      
      if (!defenseSection) {
        console.warn('⚠️ Defense strategies section not found');
        // Try to find individual defense strategies scattered in text
        const scatteredPattern = /defense\s+strategy\s*#?\s*(\d+)[:\n\s]*([\s\S]{200,3000}?)(?=defense\s+strategy|strategic|$)/gi;
        let match;
        while ((match = scatteredPattern.exec(text)) !== null && defenses.length < 3) {
          const content = match[2] || '';
          const preemptiveMatch = content.match(/(?:preemptive|before\s+they\s+attack|neutralize)[:\n\s]*([^\n]+(?:\n[^\n]+){0,5})/i);
          const directMatch = content.match(/(?:direct\s+response|when\s+confronted|counter)[:\n\s]*([^\n]+(?:\n[^\n]+){0,5})/i);
          const redirectMatch = content.match(/(?:redirect|pivot|reframe)[:\n\s]*([^\n]+(?:\n[^\n]+){0,5})/i);
          const evidenceMatch = content.match(/(?:evidence\s+arsenal|logical\s+arsenal|weapons)[:\n\s]*([^\n]+(?:\n[^\n]+){0,5})/i);
          
          defenses.push({
            preemptive_defense: preemptiveMatch ? preemptiveMatch[1].trim() : content.substring(0, 300).trim(),
            direct_response: directMatch ? directMatch[1].trim() : '',
            redirect_technique: redirectMatch ? redirectMatch[1].trim() : '',
            evidence_arsenal: evidenceMatch ? evidenceMatch[1].trim() : '',
            key_points: content.match(/(?:key\s+points?|talking\s+points?)[:\n\s]*([^\n]+(?:\n[^\n]+){0,4})/i)?.[1]?.split(/[-•*]\s*|\d+\.\s*/).map(p => p.trim()).filter(p => p.length > 0) || []
          });
        }
      } else {
        // Extract from defense section
        const defensePatterns = [
          /defense\s+strategy\s*#?\s*(\d+)[:\n\s]*([\s\S]{300,4000}?)(?=defense\s+strategy\s*#?\s*\d+|strategic|$)/gi,
          /strategy\s*#?\s*(\d+)[:\n\s]*([\s\S]{300,4000}?)(?=strategy\s*#?\s*\d+|strategic|$)/gi,
          /\{\s*"preemptive_defense"\s*:\s*"([^"]+)"[\s\S]{200,3000}?\}/g
        ];
        
        for (const pattern of defensePatterns) {
          let match;
          while ((match = pattern.exec(defenseSection)) !== null && defenses.length < 3) {
            const content = match[2] || match[0] || '';
            
            // Extract preemptive defense
            const preemptivePatterns = [
              /(?:preemptive\s+defense|before\s+they\s+attack|neutralize)[:\n\s]*([^\n]+(?:\n[^\n]+){0,8})/i,
              /"preemptive_defense"\s*:\s*"([^"]+)"/i
            ];
            let preemptiveDefense = '';
            for (const pp of preemptivePatterns) {
              const pm = content.match(pp);
              if (pm && pm[1]) {
                preemptiveDefense = pm[1].trim().replace(/\\"/g, '"').replace(/\\n/g, '\n');
                break;
              }
            }
            if (!preemptiveDefense) {
              preemptiveDefense = content.substring(0, 500).trim();
            }
            
            // Extract direct response
            const directPatterns = [
              /(?:direct\s+response|when\s+confronted|counter)[:\n\s]*([^\n]+(?:\n[^\n]+){0,8})/i,
              /"direct_response"\s*:\s*"([^"]+)"/i
            ];
            let directResponse = '';
            for (const dp of directPatterns) {
              const dm = content.match(dp);
              if (dm && dm[1]) {
                directResponse = dm[1].trim().replace(/\\"/g, '"').replace(/\\n/g, '\n');
                break;
              }
            }
            
            // Extract redirect technique
            const redirectPatterns = [
              /(?:redirect\s+technique|pivot|reframe)[:\n\s]*([^\n]+(?:\n[^\n]+){0,8})/i,
              /"redirect_technique"\s*:\s*"([^"]+)"/i
            ];
            let redirectTechnique = '';
            for (const rp of redirectPatterns) {
              const rm = content.match(rp);
              if (rm && rm[1]) {
                redirectTechnique = rm[1].trim().replace(/\\"/g, '"').replace(/\\n/g, '\n');
                break;
              }
            }
            
            // Extract evidence arsenal
            const evidencePatterns = [
              /(?:evidence\s+arsenal|logical\s+arsenal|weapons|data\s+dump)[:\n\s]*([^\n]+(?:\n[^\n]+){0,8})/i,
              /"evidence_arsenal"\s*:\s*"([^"]+)"/i,
              /"logical_arsenal"\s*:\s*"([^"]+)"/i
            ];
            let evidenceArsenal = '';
            for (const ep of evidencePatterns) {
              const em = content.match(ep);
              if (em && em[1]) {
                evidenceArsenal = em[1].trim().replace(/\\"/g, '"').replace(/\\n/g, '\n');
                break;
              }
            }
            
            // Extract key points
            const keyPointsMatch = content.match(/(?:key\s+points?|talking\s+points?)[:\n\s]*([\s\S]{50,1500}?)(?=\n\s*(?:key|talking|defense|strategic)|$)/i);
            let keyPoints: string[] = [];
            if (keyPointsMatch) {
              keyPoints = keyPointsMatch[1]
                .split(/[-•*]\s*|\d+\.\s*|\n\s*(?=\w)/)
                .map(p => p.trim())
                .filter(p => p.length > 10 && !p.match(/^(key|talking|points?)/i));
            }
            
            if (preemptiveDefense && preemptiveDefense.length > 30) {
              defenses.push({
                preemptive_defense: preemptiveDefense,
                direct_response: directResponse,
                redirect_technique: redirectTechnique,
                evidence_arsenal: evidenceArsenal,
                key_points: keyPoints.length > 0 ? keyPoints : []
              });
              console.log(`✅ Extracted defense strategy ${defenses.length}, preemptive length:`, preemptiveDefense.length);
            }
          }
          if (defenses.length >= 3) break;
        }
      }
      
      // If we still don't have enough, try JSON format
      if (defenses.length < 3) {
        const jsonDefenseMatch = text.match(/"defense_strategies"\s*:\s*\[([\s\S]*?)\]/i);
        if (jsonDefenseMatch) {
          const defenseObjects = jsonDefenseMatch[1].match(/\{[\s\S]{200,4000}?\}/g);
          if (defenseObjects) {
            defenseObjects.slice(0, 3).forEach((objStr, idx) => {
              if (defenses.length < 3) {
                const preemptiveMatch = objStr.match(/"preemptive_defense"\s*:\s*"([^"]+)"/i);
                const directMatch = objStr.match(/"direct_response"\s*:\s*"([^"]+)"/i);
                const redirectMatch = objStr.match(/"redirect_technique"\s*:\s*"([^"]+)"/i);
                const evidenceMatch = objStr.match(/"evidence_arsenal"\s*:\s*"([^"]+)"/i) || objStr.match(/"logical_arsenal"\s*:\s*"([^"]+)"/i);
                const keyPointsMatch = objStr.match(/"key_points"\s*:\s*\[([\s\S]*?)\]/i);
                
                let keyPoints: string[] = [];
                if (keyPointsMatch) {
                  keyPoints = keyPointsMatch[1]
                    .match(/"([^"]+)"/g)
                    ?.map(kp => kp.replace(/^"|"$/g, '').replace(/\\"/g, '"').replace(/\\n/g, '\n')) || [];
                }
                
                defenses.push({
                  preemptive_defense: preemptiveMatch ? preemptiveMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : `Defense Strategy ${idx + 1}`,
                  direct_response: directMatch ? directMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '',
                  redirect_technique: redirectMatch ? redirectMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '',
                  evidence_arsenal: evidenceMatch ? evidenceMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '',
                  key_points: keyPoints
                });
              }
            });
          }
        }
      }
      
      // Fill up to 3 if needed (but only if we have at least some content)
      while (defenses.length < 3 && defenses.length > 0) {
        const lastDefense = defenses[defenses.length - 1];
        if (lastDefense.preemptive_defense && lastDefense.preemptive_defense.length > 50) {
          // Don't add empty placeholders if we have real content
          break;
        }
        defenses.push({
          preemptive_defense: `Defense Strategy ${defenses.length + 1}: How to counter opposing arguments`,
          direct_response: '',
          redirect_technique: '',
          evidence_arsenal: '',
          key_points: []
        });
      }
      
      console.log(`✅ Extracted ${defenses.length} defense strategies`);
      return defenses.slice(0, 3);
    };

    const counterArgs = extractCounterArguments();
    const defenseStrats = extractDefenseStrategies();

    // Extract argument analysis
    const extractArgumentAnalysis = () => {
      const logicalStructureMatch = text.match(/(?:logical.?structure)[:\n]\s*([^\n]+(?:\n[^\n]+)*)/i);
      const reasoningMatch = text.match(/(?:reasoning.?quality)[:\n]\s*([^\n]+(?:\n[^\n]+)*)/i);
      const clarityMatch = text.match(/(?:clarity.?score)[:\n]\s*(\d+)/i);
      const persuasivenessMatch = text.match(/(?:persuasiveness)[:\n]\s*([^\n]+(?:\n[^\n]+)*)/i);
      
      return {
        logical_structure: logicalStructureMatch ? logicalStructureMatch[1].trim() : '',
        reasoning_quality: reasoningMatch ? reasoningMatch[1].trim() : '',
        clarity_score: clarityMatch ? parseInt(clarityMatch[1], 10) : 5,
        persuasiveness: persuasivenessMatch ? persuasivenessMatch[1].trim() : ''
      };
    };

    const argumentAnalysis = extractArgumentAnalysis();

    // Extract strategic recommendations
    const strategicMatch = text.match(/(?:strategic.?recommendations?|recommendations?)[:\n]\s*([\s\S]*?)(?=\n\n|\n[A-Z]{2,}|$)/i);
    const strategicRecommendations = strategicMatch
      ? strategicMatch[1].split(/[-•*]\s*|\d+\.\s*|,\s*"/).map(r => r.trim().replace(/^["']|["']$/g, '')).filter(r => r.length > 0 && !r.match(/^[\[\]{}]+$/))
      : [];

    console.log('✅ Successfully parsed as structured text');
    console.log('📊 Text parsing - Enhanced Argument extracted:', enhancedArgument?.substring(0, 200) || 'EMPTY');
    console.log('📊 Text parsing - Enhanced Argument length:', enhancedArgument?.length || 0);
    
    const parsed = {
      logic_score: logicScore,
      rhetoric_score: rhetoricScore,
      empathy_score: empathyScore,
      delivery_score: deliveryScore,
      logic_feedback: logicFeedback.length > 0 ? logicFeedback : ['No specific logic feedback provided.'],
      rhetoric_feedback: rhetoricFeedback.length > 0 ? rhetoricFeedback : ['No specific rhetoric feedback provided.'],
      empathy_feedback: empathyFeedback.length > 0 ? empathyFeedback : ['No specific empathy feedback provided.'],
      delivery_feedback: deliveryFeedback.length > 0 ? deliveryFeedback : ['No specific delivery feedback provided.'],
      missing_points: missingPoints.length > 0 ? missingPoints : ['Review your logical structure', 'Add more specific examples', 'Strengthen your premises'],
      enhanced_argument: enhancedArgument && enhancedArgument.trim().length > 0 ? enhancedArgument.trim() : 'Enhanced argument analysis would be provided here. The AI is analyzing your speech and will generate an improved version that strengthens your logical reasoning and argument structure.',
      enhanced_feedback: {
        argument_analysis: argumentAnalysis,
        data_enhancements: {
          statistical_support: [],
          expert_citations: [],
          case_studies: [],
          quantifiable_claims: []
        },
        counter_arguments: counterArgs,
        defense_strategies: defenseStrats,
        strategic_recommendations: strategicRecommendations.length > 0 ? strategicRecommendations : ['Focus on logical structure', 'Address counterarguments', 'Strengthen your reasoning']
      }
    };

    const result = this.buildScoreResultFromParsed(parsed, originalTranscript);
    console.log('📊 Text Parse Final Result - Enhanced Argument:', result.enhancedArgument?.substring(0, 200) || 'EMPTY');
    console.log('📊 Text Parse Final Result - Enhanced Argument length:', result.enhancedArgument?.length || 0);
    return result;
  }

  private createFallbackResult(analysis: string, originalTranscript: string): ScoreResult {
    console.log('🔄 Creating fallback result from raw text');
    
    const scoreMatches = analysis.match(/(\d+)\s*(?:out of|\/)\s*(?:10|5)/gi);
    const scores = scoreMatches ? scoreMatches.map(m => parseInt(m.match(/\d+/)?.[0] || '0', 10)) : [];
    
    const fullText = analysis.length > 2000 ? analysis.substring(0, 2000) + '...' : analysis;
    
    return {
      score: {
        logic: scores[0] || 0,
        rhetoric: scores[1] || 0,
        empathy: scores[2] || 0,
        delivery: scores[3] || 0,
        total: scores.slice(0, 4).reduce((a, b) => a + b, 0)
      },
      feedback: {
        logic: this.extractRelevantSection(analysis, 'logic') || 'Analysis provided in full response below.',
        rhetoric: this.extractRelevantSection(analysis, 'rhetoric') || 'Analysis provided in full response below.',
        empathy: this.extractRelevantSection(analysis, 'empathy') || 'Analysis provided in full response below.',
        delivery: this.extractRelevantSection(analysis, 'delivery') || 'Analysis provided in full response below.',
        overall: `Your speech has been analyzed. ${fullText.substring(0, 200)}...`
      },
      missingPoints: ["Review logical structure", "Add specific examples", "Strengthen premises"],
      enhancedArgument: analysis.length > 500 ? analysis.substring(0, 500) + '...' : analysis,
      enhancedFeedback: {
        argumentAnalysis: {
          logicalStructure: this.extractRelevantSection(analysis, 'logical structure') || 'Analysis of logical structure',
          evidenceQuality: this.extractRelevantSection(analysis, 'evidence') || 'Analysis of evidence quality',
          clarityScore: 5,
          persuasiveness: this.extractRelevantSection(analysis, 'persuasive') || 'Analysis of persuasiveness'
        },
        dataEnhancements: {
          statisticalSupport: [],
          expertCitations: [],
          caseStudies: [],
          quantifiableClaims: []
        },
        counterArguments: [
          {
            rebuttal: 'Potential counterargument: Review the analysis above for opposing viewpoints',
            strengthLevel: 'Medium',
            supportingEvidence: '',
            commonSources: '',
            keyPoints: []
          },
          {
            rebuttal: 'Another counterargument: Consider alternative perspectives',
            strengthLevel: 'Medium',
            supportingEvidence: '',
            commonSources: '',
            keyPoints: []
          },
          {
            rebuttal: 'Third counterargument: Evaluate different reasoning approaches',
            strengthLevel: 'Medium',
            supportingEvidence: '',
            commonSources: '',
            keyPoints: []
          }
        ],
        defenseStrategies: [
          {
            preemptiveDefense: 'Pre-emptive defense: Address concerns proactively',
            directResponse: 'Direct response: Counter opposing arguments logically',
            redirectTechnique: 'Redirect: Reframe the discussion to your strengths',
            evidenceArsenal: 'Evidence: Use logical reasoning and structured arguments',
            keyPoints: []
          },
          {
            preemptiveDefense: 'Pre-emptive defense: Anticipate and address counterarguments',
            directResponse: 'Direct response: Provide logical refutation',
            redirectTechnique: 'Redirect: Shift focus to stronger points',
            evidenceArsenal: 'Evidence: Strengthen your logical framework',
            keyPoints: []
          },
          {
            preemptiveDefense: 'Pre-emptive defense: Establish logical foundation early',
            directResponse: 'Direct response: Defend your reasoning structure',
            redirectTechnique: 'Redirect: Emphasize your logical strengths',
            evidenceArsenal: 'Evidence: Use reasoning frameworks effectively',
            keyPoints: []
          }
        ],
        strategicRecommendations: ['Focus on logical structure', 'Address counterarguments', 'Strengthen reasoning', 'Use clear premises', 'Avoid logical fallacies']
      },
      transcript: originalTranscript
    };
  }

  private extractRelevantSection(text: string, keyword: string): string {
    const lowerText = text.toLowerCase();
    const keywordIndex = lowerText.indexOf(keyword);
    if (keywordIndex === -1) return '';
    
    const start = Math.max(0, keywordIndex - 50);
    const end = Math.min(text.length, keywordIndex + 500);
    return text.substring(start, end).trim();
  }

  private buildScoreResultFromParsed(parsed: any, originalTranscript: string): ScoreResult {
    console.log('🔨 BUILD SCORE RESULT - Starting build from parsed data...');
    console.log('📊 Parsed data keys:', Object.keys(parsed));
    
    const logicScore = parsed.logic_score || 0;
    const rhetoricScore = parsed.rhetoric_score || 0;
    const empathyScore = parsed.empathy_score || 0;
    const deliveryScore = parsed.delivery_score || 0;
    const totalScore = logicScore + rhetoricScore + empathyScore + deliveryScore;

    // Parse enhanced feedback
    const enhancedFeedback = parsed.enhanced_feedback || {};
    const argumentAnalysis = enhancedFeedback.argument_analysis || {};
    const dataEnhancements = enhancedFeedback.data_enhancements || {};
    const counterArgs = enhancedFeedback.counter_arguments || [];
    const defenseStrats = enhancedFeedback.defense_strategies || [];
    
    console.log('📊 Enhanced argument from parsed:', parsed.enhanced_argument?.substring(0, 200) || 'NOT FOUND');
    console.log('📊 Enhanced argument type:', typeof parsed.enhanced_argument);
    console.log('📊 Enhanced argument length:', parsed.enhanced_argument?.length || 0);
    console.log('📊 Missing points count:', parsed.missing_points?.length || 0);
    console.log('📊 Counter arguments count:', counterArgs.length);
    console.log('📊 Defense strategies count:', defenseStrats.length);

    const enhancedArgumentValue = (() => {
      const rawEnhanced = parsed.enhanced_argument;
      console.log('🔨 Building enhancedArgument from:', typeof rawEnhanced);
      console.log('🔨 Raw enhanced_argument value:', rawEnhanced?.substring(0, 200) || 'EMPTY/NULL');
      
      if (rawEnhanced && typeof rawEnhanced === 'string' && rawEnhanced.trim().length > 0) {
        const trimmed = rawEnhanced.trim();
        console.log('✅ Using parsed enhanced_argument, length:', trimmed.length);
        return trimmed;
      } else {
        console.warn('⚠️ Enhanced argument is empty or invalid, using fallback');
        return 'Enhanced argument analysis would be provided here. The AI is analyzing your speech and will generate an improved version that strengthens your logical reasoning and argument structure for your chosen position.';
      }
    })();

    const result: ScoreResult = {
      score: {
        logic: logicScore,
        rhetoric: rhetoricScore,
        empathy: empathyScore,
        delivery: deliveryScore,
        total: totalScore
      },
      feedback: {
        logic: Array.isArray(parsed.logic_feedback) ? parsed.logic_feedback.join(' ') : (typeof parsed.logic_feedback === 'string' ? parsed.logic_feedback : 'No logic feedback provided.'),
        rhetoric: Array.isArray(parsed.rhetoric_feedback) ? parsed.rhetoric_feedback.join(' ') : (typeof parsed.rhetoric_feedback === 'string' ? parsed.rhetoric_feedback : 'No rhetoric feedback provided.'),
        empathy: Array.isArray(parsed.empathy_feedback) ? parsed.empathy_feedback.join(' ') : (typeof parsed.empathy_feedback === 'string' ? parsed.empathy_feedback : 'No empathy feedback provided.'),
        delivery: Array.isArray(parsed.delivery_feedback) ? parsed.delivery_feedback.join(' ') : (typeof parsed.delivery_feedback === 'string' ? parsed.delivery_feedback : 'No delivery feedback provided.'),
        overall: `Your speech scored ${totalScore}/30. Focus on improving areas with lower scores for better performance.`
      },
      missingPoints: parsed.missing_points || [],
      enhancedArgument: (() => {
        const rawEnhanced = parsed.enhanced_argument;
        console.log('🔨 Building enhancedArgument from:', typeof rawEnhanced);
        console.log('🔨 Raw enhanced_argument value:', rawEnhanced?.substring(0, 200) || 'EMPTY/NULL');
        
        if (rawEnhanced && typeof rawEnhanced === 'string' && rawEnhanced.trim().length > 0) {
          const trimmed = rawEnhanced.trim();
          console.log('✅ Using parsed enhanced_argument, length:', trimmed.length);
          return trimmed;
        } else {
          console.warn('⚠️ Enhanced argument is empty or invalid, using fallback');
          return 'Enhanced argument analysis would be provided here. The AI is analyzing your speech and will generate an improved version that strengthens your logical reasoning and argument structure for your chosen position.';
        }
      })(),
      enhancedFeedback: {
        argumentAnalysis: {
          logicalStructure: argumentAnalysis.logical_structure || argumentAnalysis.reasoning_quality || '',
          evidenceQuality: argumentAnalysis.evidence_quality || '',
          clarityScore: argumentAnalysis.clarity_score || 0,
          persuasiveness: argumentAnalysis.persuasiveness || ''
        },
        dataEnhancements: {
          logicalFrameworks: dataEnhancements.logical_frameworks || [],
          premiseStrengthening: dataEnhancements.premise_strengthening || [],
          fallacyCorrections: dataEnhancements.fallacy_corrections || [],
          reasoningImprovements: dataEnhancements.reasoning_improvements || [],
          // Legacy fields for backward compatibility
          statisticalSupport: dataEnhancements.statistical_support || [],
          expertCitations: dataEnhancements.expert_citations || [],
          caseStudies: dataEnhancements.case_studies || [],
          quantifiableClaims: dataEnhancements.quantifiable_claims || []
        },
        counterArguments: counterArgs.map((arg: any) => ({
          rebuttal: arg.rebuttal || '',
          strengthLevel: arg.strength_level || 'Medium',
          supportingEvidence: arg.supporting_evidence || arg.supporting_logic || '',
          commonSources: arg.common_sources || '',
          keyPoints: arg.key_points || []
        })),
        defenseStrategies: defenseStrats.map((strategy: any) => ({
          preemptiveDefense: strategy.preemptive_defense || '',
          directResponse: strategy.direct_response || '',
          redirectTechnique: strategy.redirect_technique || '',
          evidenceArsenal: strategy.evidence_arsenal || strategy.logical_arsenal || '',
          keyPoints: strategy.key_points || []
        })),
        strategicRecommendations: enhancedFeedback.strategic_recommendations || []
      },
      transcript: originalTranscript
    };
    
    console.log('✅ BUILD SCORE RESULT - Final result built');
    console.log('📊 Final enhancedArgument:', result.enhancedArgument?.substring(0, 200) || 'EMPTY');
    console.log('📊 Final enhancedArgument length:', result.enhancedArgument?.length || 0);
    
    return result;
  }

  private repairJsonString(json: string): string {
    let fixed = json;
    
    // Step 1: Remove trailing commas before } or ]
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // Step 2: Fix unescaped quotes in string values
    // This is tricky - we need to escape quotes that are inside string values but not those that delimit strings
    // Strategy: Process character by character, tracking when we're inside a string value
    
    let result = '';
    let inString = false;
    let escaped = false;
    let isInValue = false; // Track if we're in a value (after colon)
    
    for (let i = 0; i < fixed.length; i++) {
      const char = fixed[i];
      const nextChar = i + 1 < fixed.length ? fixed[i + 1] : '';
      const prevChar = i > 0 ? fixed[i - 1] : '';
      const prev2Char = i > 1 ? fixed[i - 2] : '';
      
      // Check if we're entering a value (after colon and whitespace)
      if (!inString && char === ':' && !isInValue) {
        isInValue = true;
        result += char;
        continue;
      }
      
      // Reset isInValue when we hit a comma, bracket, or brace outside of string
      if (!inString && (char === ',' || char === '}' || char === ']')) {
        isInValue = false;
        result += char;
        continue;
      }
      
      // Handle escape sequences
      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        result += char;
        continue;
      }
      
      // Handle control characters (must be escaped in JSON strings)
      if (inString) {
        // Control characters that need escaping: \n, \r, \t, and other control chars (0x00-0x1F)
        if (char === '\n') {
          result += '\\n';
          continue;
        } else if (char === '\r') {
          result += '\\r';
          continue;
        } else if (char === '\t') {
          result += '\\t';
          continue;
        } else if (char.charCodeAt(0) < 32 && char !== '\n' && char !== '\r' && char !== '\t') {
          // Other control characters - escape as unicode
          result += '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
          continue;
        }
      }
      
      // Handle quotes
      if (char === '"') {
        if (!inString) {
          // Opening quote
          inString = true;
          result += char;
        } else {
          // Closing quote - check if it's really closing or if there's content after
          // If next char is also ", or if next is comma/brace/bracket, it's closing
          if (nextChar === '"' || nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === '\n' || nextChar === ' ') {
            inString = false;
            isInValue = false;
            result += char;
          } else {
            // This quote is likely inside the string value and should be escaped
            result += '\\"';
          }
        }
      } else {
        result += char;
      }
    }
    
    return result;
  }

  private extractMinimalValidJson(jsonString: string): string {
    // Try to extract the essential parts and create a minimal valid JSON
    // This is a fallback when the full JSON is too corrupted
    
    const minimal: any = {
      logic_score: 0,
      logic_feedback: [],
      rhetoric_score: 0,
      rhetoric_feedback: [],
      empathy_score: 0,
      empathy_feedback: [],
      delivery_score: 0,
      delivery_feedback: [],
      missing_points: [],
      enhanced_argument: "",
      enhanced_feedback: {
        argument_analysis: {
          logical_structure: "",
          evidence_quality: "",
          clarity_score: 0,
          persuasiveness: ""
        },
        data_enhancements: {
          statistical_support: [],
          expert_citations: [],
          case_studies: [],
          quantifiable_claims: []
        },
        counter_arguments: [],
        defense_strategies: [],
        strategic_recommendations: []
      }
    };

    // Try to extract what we can using regex
    const extractField = (field: string, defaultValue: any) => {
      const regex = new RegExp(`"${field}"\\s*:\\s*([^,}\\]\\n]+)`, 'i');
      const match = jsonString.match(regex);
      return match ? match[1].replace(/^["']|["']$/g, '') : defaultValue;
    };

    const extractArray = (field: string): string[] => {
      // Try to find the array field and extract its contents
      const regex = new RegExp(`"${field}"\\s*:\\s*\\[`, 'i');
      const match = jsonString.match(regex);
      if (match) {
        const startIndex = match.index! + match[0].length;
        let depth = 1;
        let i = startIndex;
        let content = '';
        
        while (i < jsonString.length && depth > 0) {
          const char = jsonString[i];
          if (char === '[') depth++;
          else if (char === ']') depth--;
          else if (depth === 1) content += char;
          i++;
        }
        
        // Try to parse the content as JSON array items
        try {
          // Clean up the content and try to split into items
          const items = content.split(',').map(item => {
            const trimmed = item.trim();
            // Remove quotes if present
            if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
                (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
              return trimmed.slice(1, -1);
            }
            return trimmed;
          }).filter(item => item.length > 0 && item !== 'null');
          
          return items.slice(0, 5); // Limit items
        } catch (e) {
          return [];
        }
      }
      return [];
    };

    // Extract scores
    const logicScore = extractField('logic_score', 0);
    const rhetoricScore = extractField('rhetoric_score', 0);
    const empathyScore = extractField('empathy_score', 0);
    const deliveryScore = extractField('delivery_score', 0);

    minimal.logic_score = parseInt(logicScore) || 0;
    minimal.rhetoric_score = parseInt(rhetoricScore) || 0;
    minimal.empathy_score = parseInt(empathyScore) || 0;
    minimal.delivery_score = parseInt(deliveryScore) || 0;

    // Extract feedback arrays
    minimal.logic_feedback = extractArray('logic_feedback');
    minimal.rhetoric_feedback = extractArray('rhetoric_feedback');
    minimal.empathy_feedback = extractArray('empathy_feedback');
    minimal.delivery_feedback = extractArray('delivery_feedback');
    minimal.missing_points = extractArray('missing_points');

    // Try to extract enhanced_argument if present - handle multiline strings
    // First try standard JSON string format
    let enhancedArgMatch = jsonString.match(/"enhanced_argument"\s*:\s*"((?:[^"\\]|\\.|\\n)*)"/s);
    if (!enhancedArgMatch) {
      // Try to find it as a multiline string (might span multiple lines)
      const enhancedStart = jsonString.indexOf('"enhanced_argument"');
      if (enhancedStart !== -1) {
        const afterColon = jsonString.indexOf(':', enhancedStart);
        const firstQuote = jsonString.indexOf('"', afterColon);
        if (firstQuote !== -1) {
          // Find the closing quote, handling escaped quotes
          let quoteEnd = firstQuote + 1;
          let escaped = false;
          while (quoteEnd < jsonString.length) {
            if (jsonString[quoteEnd] === '\\') {
              escaped = !escaped;
              quoteEnd++;
              continue;
            }
            if (jsonString[quoteEnd] === '"' && !escaped) {
              break;
            }
            escaped = false;
            quoteEnd++;
          }
          if (quoteEnd < jsonString.length) {
            const content = jsonString.substring(firstQuote + 1, quoteEnd);
            enhancedArgMatch = [null, content];
          }
        }
      }
    }
    if (enhancedArgMatch && enhancedArgMatch[1]) {
      minimal.enhanced_argument = enhancedArgMatch[1]
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .trim();
    }

    // Try to extract enhanced_feedback sections
    const extractEnhancedField = (path: string[], defaultValue: any) => {
      const fieldName = path[path.length - 1];
      // Look for the field in the enhanced_feedback structure
      const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'is');
      const match = jsonString.match(regex);
      if (match) {
        return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').substring(0, 500); // Limit length
      }
      return defaultValue;
    };

    // Extract argument analysis fields
    minimal.enhanced_feedback.argument_analysis.logical_structure = extractEnhancedField(['enhanced_feedback', 'argument_analysis', 'logical_structure'], '');
    minimal.enhanced_feedback.argument_analysis.evidence_quality = extractEnhancedField(['enhanced_feedback', 'argument_analysis', 'evidence_quality'], '');
    minimal.enhanced_feedback.argument_analysis.persuasiveness = extractEnhancedField(['enhanced_feedback', 'argument_analysis', 'persuasiveness'], '');

    // Extract data enhancements arrays
    minimal.enhanced_feedback.data_enhancements.statistical_support = extractArray('statistical_support');
    minimal.enhanced_feedback.data_enhancements.expert_citations = extractArray('expert_citations');
    minimal.enhanced_feedback.data_enhancements.case_studies = extractArray('case_studies');
    minimal.enhanced_feedback.data_enhancements.quantifiable_claims = extractArray('quantifiable_claims');

    // Extract counter_arguments and defense_strategies with actual content
    const extractCounterArgs = () => {
      const results: any[] = [];
      
      // Find all counter_arguments objects
      const counterRegex = /"counter_arguments"\s*:\s*\[/i;
      const match = jsonString.match(counterRegex);
      if (!match) return [];
      
      // Extract individual counter argument objects
      let searchIndex = match.index! + match[0].length;
      
      // Find up to 3 counter arguments
      for (let i = 0; i < 3; i++) {
        // Find the opening brace of a counter argument object
        const objStart = jsonString.indexOf('{', searchIndex);
        if (objStart === -1) break;
        
        // Find the matching closing brace
        let braceDepth = 1;
        let objEnd = objStart + 1;
        while (objEnd < jsonString.length && braceDepth > 0) {
          if (jsonString[objEnd] === '{') braceDepth++;
          else if (jsonString[objEnd] === '}') braceDepth--;
          objEnd++;
        }
        
        if (braceDepth > 0) break; // Incomplete object
        
        const objStr = jsonString.substring(objStart, objEnd);
        
        // Extract fields from this object - handle multiline strings
        const extractFieldFromObj = (fieldName: string): string => {
          // Try multiple patterns to handle different formats
          let regex = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\[\\\\"nrtbf])+)"`, 's');
          let fieldMatch = objStr.match(regex);
          
          if (!fieldMatch) {
            regex = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\[\\\\"nrtbf]|\\\\n|\\\\r|\\\\t)+)"`, 's');
            fieldMatch = objStr.match(regex);
          }
          
          if (!fieldMatch) {
            const fieldStart = objStr.indexOf(`"${fieldName}"`);
            if (fieldStart !== -1) {
              const colonPos = objStr.indexOf(':', fieldStart);
              const quoteStart = objStr.indexOf('"', colonPos);
              if (quoteStart !== -1) {
                let quoteEnd = quoteStart + 1;
                let escaped = false;
                while (quoteEnd < objStr.length) {
                  if (objStr[quoteEnd] === '\\') {
                    escaped = !escaped;
                    quoteEnd++;
                    continue;
                  }
                  if (objStr[quoteEnd] === '"' && !escaped) {
                    break;
                  }
                  escaped = false;
                  quoteEnd++;
                }
                if (quoteEnd < objStr.length) {
                  const content = objStr.substring(quoteStart + 1, quoteEnd);
                  fieldMatch = [null, content];
                }
              }
            }
          }
          
          if (fieldMatch && fieldMatch[1]) {
            return fieldMatch[1]
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\\\/g, '\\');
          }
          return '';
        };
        
        const extractStrengthLevel = (): string => {
          const regex = /"strength_level"\s*:\s*"([^"]+)"/i;
          const match = objStr.match(regex);
          return match ? match[1] : 'Medium';
        };
        
        const extractKeyPoints = (): string[] => {
          const keyPointsRegex = /"key_points"\s*:\s*\[/i;
          const kpMatch = objStr.match(keyPointsRegex);
          if (!kpMatch) return [];
          
          const kpStart = kpMatch.index! + kpMatch[0].length;
          const kpEnd = objStr.indexOf(']', kpStart);
          if (kpEnd === -1) return [];
          
          const kpContent = objStr.substring(kpStart, kpEnd);
          // Extract quoted strings from the array
          const kpItems: string[] = [];
          const kpRegex = /"([^"]*(?:\\.[^"]*)*)"/g;
          let kpItemMatch;
          while ((kpItemMatch = kpRegex.exec(kpContent)) !== null) {
            kpItems.push(kpItemMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'));
          }
          return kpItems;
        };
        
        const rebuttal = extractFieldFromObj('rebuttal');
        const supportingEvidence = extractFieldFromObj('supporting_evidence');
        const commonSources = extractFieldFromObj('common_sources');
        
        // Only add if we actually extracted content
        if (rebuttal || supportingEvidence || commonSources) {
          results.push({
            rebuttal: rebuttal,
            strength_level: extractStrengthLevel(),
            supporting_evidence: supportingEvidence,
            common_sources: commonSources,
            key_points: extractKeyPoints()
          });
        }
        
        searchIndex = objEnd;
      }
      
      return results.length > 0 ? results : [];
    };

    const extractDefenseStrats = () => {
      const results: any[] = [];
      
      // Find all defense_strategies objects
      const defenseRegex = /"defense_strategies"\s*:\s*\[/i;
      const match = jsonString.match(defenseRegex);
      if (!match) return [];
      
      // Extract individual defense strategy objects
      let searchIndex = match.index! + match[0].length;
      
      // Find up to 3 defense strategies
      for (let i = 0; i < 3; i++) {
        // Find the opening brace of a defense strategy object
        const objStart = jsonString.indexOf('{', searchIndex);
        if (objStart === -1) break;
        
        // Find the matching closing brace
        let braceDepth = 1;
        let objEnd = objStart + 1;
        while (objEnd < jsonString.length && braceDepth > 0) {
          if (jsonString[objEnd] === '{') braceDepth++;
          else if (jsonString[objEnd] === '}') braceDepth--;
          objEnd++;
        }
        
        if (braceDepth > 0) break; // Incomplete object
        
        const objStr = jsonString.substring(objStart, objEnd);
        
        // Extract fields from this object - handle multiline strings (same as above)
        const extractFieldFromObj = (fieldName: string): string => {
          // Try multiple patterns to handle different formats
          let regex = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\[\\\\"nrtbf])+)"`, 's');
          let fieldMatch = objStr.match(regex);
          
          if (!fieldMatch) {
            regex = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\[\\\\"nrtbf]|\\\\n|\\\\r|\\\\t)+)"`, 's');
            fieldMatch = objStr.match(regex);
          }
          
          if (!fieldMatch) {
            const fieldStart = objStr.indexOf(`"${fieldName}"`);
            if (fieldStart !== -1) {
              const colonPos = objStr.indexOf(':', fieldStart);
              const quoteStart = objStr.indexOf('"', colonPos);
              if (quoteStart !== -1) {
                let quoteEnd = quoteStart + 1;
                let escaped = false;
                while (quoteEnd < objStr.length) {
                  if (objStr[quoteEnd] === '\\') {
                    escaped = !escaped;
                    quoteEnd++;
                    continue;
                  }
                  if (objStr[quoteEnd] === '"' && !escaped) {
                    break;
                  }
                  escaped = false;
                  quoteEnd++;
                }
                if (quoteEnd < objStr.length) {
                  const content = objStr.substring(quoteStart + 1, quoteEnd);
                  fieldMatch = [null, content];
                }
              }
            }
          }
          
          if (fieldMatch && fieldMatch[1]) {
            return fieldMatch[1]
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\\\/g, '\\');
          }
          return '';
        };
        
        const extractKeyPoints = (): string[] => {
          const keyPointsRegex = /"key_points"\s*:\s*\[/i;
          const kpMatch = objStr.match(keyPointsRegex);
          if (!kpMatch) return [];
          
          const kpStart = kpMatch.index! + kpMatch[0].length;
          const kpEnd = objStr.indexOf(']', kpStart);
          if (kpEnd === -1) return [];
          
          const kpContent = objStr.substring(kpStart, kpEnd);
          // Extract quoted strings from the array
          const kpItems: string[] = [];
          const kpRegex = /"([^"]*(?:\\.[^"]*)*)"/g;
          let kpItemMatch;
          while ((kpItemMatch = kpRegex.exec(kpContent)) !== null) {
            kpItems.push(kpItemMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'));
          }
          return kpItems;
        };
        
        const preemptiveDefense = extractFieldFromObj('preemptive_defense');
        const directResponse = extractFieldFromObj('direct_response');
        const redirectTechnique = extractFieldFromObj('redirect_technique');
        const evidenceArsenal = extractFieldFromObj('evidence_arsenal');
        
        // Only add if we actually extracted content
        if (preemptiveDefense || directResponse || redirectTechnique || evidenceArsenal) {
          results.push({
            preemptive_defense: preemptiveDefense,
            direct_response: directResponse,
            redirect_technique: redirectTechnique,
            evidence_arsenal: evidenceArsenal,
            key_points: extractKeyPoints()
          });
        }
        
        searchIndex = objEnd;
      }
      
      return results.length > 0 ? results : [];
    };

    minimal.enhanced_feedback.counter_arguments = extractCounterArgs();
    minimal.enhanced_feedback.defense_strategies = extractDefenseStrats();
    minimal.enhanced_feedback.strategic_recommendations = extractArray('strategic_recommendations');

    return JSON.stringify(minimal);
  }
}

export const aiService = new AIService();
