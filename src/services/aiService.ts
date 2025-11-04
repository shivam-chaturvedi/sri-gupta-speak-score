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
    statisticalSupport: string[];
    expertCitations: string[];
    caseStudies: string[];
    quantifiableClaims: string[];
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

export class AIService {
  private apiKey: string = "AIzaSyCTCIx4gdJmRQ6iGN6gj89NCtsAjeRY7uU";

  constructor() {
    // API key is hardcoded
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async analyzeSpeeches(request: SpeechAnalysisRequest): Promise<ScoreResult> {
    if (!this.apiKey) {
      throw new Error('API key not set. Please provide your Google Gemini API key.');
    }

    const prompt = this.buildAnalysisPrompt(request);

    try {
      // Use Gemini 2.5 Flash model with header-based authentication
      const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
      console.log('Calling Gemini 2.5 Flash API...');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an EXPERT DEBATE COACH with 20+ years of experience training world championship debaters. You MUST provide SPECIFIC, ACTIONABLE feedback with EXACT word-for-word examples. You MUST generate detailed counterarguments and defense strategies. NO vague feedback allowed.\n\n${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 8192,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request failed:', response.status, response.statusText);
        console.error('Error response body:', errorText);
        
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          // Gemini API error format
          if (errorJson.error) {
            errorMessage = errorJson.error.message || errorJson.error.status || errorMessage;
          } else if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch (e) {
          // If error response is not JSON, use the text (limit length)
          errorMessage = errorText ? (errorText.substring(0, 200) + (errorText.length > 200 ? '...' : '')) : errorMessage;
        }
        
        // Provide specific guidance for common errors
        if (response.status === 404) {
          errorMessage = 'API endpoint not found. The Gemini API endpoint may have changed or the API key is invalid.';
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'Invalid API key. Please check your Google Gemini API key and ensure it has the correct permissions.';
        } else if (response.status === 429) {
          errorMessage = 'API rate limit exceeded. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Check for API errors in response
      if (data.error) {
        throw new Error(`AI API error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      // Check if response structure is valid
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error('Invalid API response structure:', data);
        throw new Error('Invalid response format from AI service');
      }

      const analysis = data.candidates[0].content.parts[0].text;

      if (!analysis) {
        throw new Error('Empty response from AI service');
      }

      return this.parseAnalysis(analysis, request.transcript);
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Provide more helpful error messages
      if (error instanceof Error) {
        // Check if it's an API key issue
        if (error.message.includes('API_KEY') || error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Invalid API key. Please check your Google Gemini API key.');
        }
        throw error;
      }
      throw new Error('AI analysis failed due to an unknown error');
    }
  }

  private buildAnalysisPrompt(request: SpeechAnalysisRequest): string {
    return `You are an EXPERT DEBATE COACH, ARGUMENT STRATEGIST, and COMPETITIVE DEBATE JUDGE with 20+ years of experience. You have trained world championship debaters. Analyze this debate speech with MILITARY PRECISION and provide BRUTALLY HONEST, SPECIFIC, ACTIONABLE feedback.

DEBATE TOPIC: "${request.topic}"
STANCE: ${request.stance ? request.stance.toUpperCase() : 'NEUTRAL'}
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
1. EVERY feedback point MUST be SPECIFIC and ACTIONABLE:
   - ❌ BAD: "Your logic needs improvement"
   - ✅ GOOD: "Your second premise lacks evidence. Add a statistic from the World Bank 2023 report showing X% of countries experience Y. Connect this to your conclusion using a causal chain: 'Because [statistic], therefore [conclusion].'"

2. ALWAYS reference EXACT QUOTES from their transcript:
   - ❌ BAD: "Your argument is weak"
   - ✅ GOOD: "When you said '[exact quote from transcript]', you made an unsupported claim. Replace with: '[specific improved version with evidence]'"

3. Provide CONCRETE EXAMPLES and TECHNIQUES:
   - ❌ BAD: "Use better rhetoric"
   - ✅ GOOD: "Add anaphora (repetition) like: 'We must act. We must change. We must lead.' Place this at 0:45 in your speech for maximum impact."

4. NEVER use vague phrases like:
   - "could be better", "needs improvement", "work on", "try to", "consider", "maybe", "perhaps"
   - Instead: "MUST add [specific thing]", "REPLACE [X] with [Y]", "INSERT [specific element] at [specific location]"

Provide analysis in this EXACT JSON format (NO MARKDOWN, NO CODE BLOCKS, JUST PURE JSON):

{
  "logic_score": [0-10],
  "logic_feedback": [
    "SPECIFIC weakness or strength: Quote their exact words from transcript, then explain the logical flaw or strength. Example: 'When you said \"[exact quote]\", this creates a logical gap because [specific reason]. To fix this, add: [exact improved version]'",
    "CONCRETE example: Identify the SPECIFIC premise that fails. Quote it. Explain why it fails. Provide exact replacement. Example: 'Your second premise \"[exact quote]\" lacks evidence. Add: \"According to [Source, Year], [statistic]% of [population] experience [effect].\" This strengthens your argument because [reason].'",
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
    "SPECIFIC statistic or study they should cite (with example source)",
    "CONCRETE historical precedent they overlooked",
    "SPECIFIC expert opinion or authority they could quote",
    "ACTIONABLE economic/social argument they missed",
    "REAL-WORLD example or case study they should mention"
  ],
  "enhanced_argument": "A COMPLETELY REWRITTEN version of their speech that:
  - Opens with a powerful hook
  - Includes SPECIFIC statistics and citations
  - Uses CONCRETE examples and case studies
  - Addresses counterarguments proactively
  - Employs rhetorical devices (metaphor, repetition, parallel structure)
  - Closes with memorable call to action
  - Maintains their original stance but DRAMATICALLY improves persuasiveness",
  
  "enhanced_feedback": {
    "argument_analysis": {
      "logical_structure": "DETAILED breakdown: Which premises are strong/weak? Where are logical gaps? What fallacies exist? Rate the argument chain step-by-step.",
      "evidence_quality": "SPECIFIC assessment: What types of evidence used? What's missing? Which claims need support? Rate evidence on relevance, recency, authority.",
      "clarity_score": [1-10],
      "persuasiveness": "CONCRETE analysis: What psychological triggers work? What falls flat? How could framing improve? Which words have impact?"
    },
    "data_enhancements": {
      "statistical_support": [
        "SPECIFIC STAT: '[Exact number]% of [population] experience [effect] according to [Source, Year]'",
        "RESEARCH FINDING: 'Study by [Institution] found [specific result]'",
        "TREND DATA: '[Metric] has increased/decreased by [amount] since [year]'"
      ],
      "expert_citations": [
        "QUOTE: '[Expert name], [credentials] states: '[specific quote]''",
        "AUTHORITY: '[Institution/Organization] reports that [finding]'",
        "EXPERT CONSENSUS: '[Percentage] of [field] experts agree that [position]'"
      ],
      "case_studies": [
        "REAL EXAMPLE: 'In [location/year], [specific event] resulted in [specific outcome]'",
        "PRECEDENT: 'When [country/company] implemented [policy], [measurable result]'",
        "PARALLEL CASE: '[Situation] mirrors current issue and shows [relevant lesson]'"
      ],
      "quantifiable_claims": [
        "VAGUE → SPECIFIC: Transform '[vague claim]' into '[precise, measurable statement with numbers]'",
        "ADD METRICS: 'This would save [X dollars/lives/hours] per [timeframe]'",
        "CONCRETE IMPACT: '[Specific group] would see [measurable benefit] within [timeline]'"
      ]
    },
    "counter_arguments": [
      {
        "rebuttal": "STRONGEST OPPONENT ARGUMENT: [Exactly what a skilled opponent would say, phrased powerfully and persuasively. Must be 2-3 sentences, not vague. Example: 'Your argument fails because [specific reason]. Studies from [Institute, Year] show that [contrary finding]. This directly contradicts your claim that [specific claim from transcript].'",
        "strength_level": "High",
        "supporting_evidence": "SPECIFIC DATA OPPONENT WOULD USE: [Real, verifiable statistics, studies, or examples. Must include numbers, dates, and source names. Example: 'According to the 2023 World Economic Forum report, [specific percentage]% of [specific group] experience [specific outcome]. The Harvard Business Review study from 2022 found that [specific finding].'",
        "common_sources": "WHERE OPPONENT FINDS THIS: [Specific publications, think tanks, experts, research institutions. Example: 'Common sources include: The Brookings Institution, The Economist 2023 analysis, Professor [Name]'s research at [University], and the World Bank Development Report 2023.'",
        "key_points": [
          "KEY POINT 1: [Specific talking point opponent would use. Example: 'The economic cost of [policy] would be [specific amount] according to [source]']",
          "KEY POINT 2: [Another specific talking point. Example: '[Country/Study] tried this approach and it failed because [specific reason]']",
          "KEY POINT 3: [Third specific talking point. Example: 'This ignores the fundamental principle that [specific principle], which [expert] argues is essential']",
          "KEY POINT 4: [Fourth specific talking point with evidence. Example: 'The data shows [specific statistic]% of [population] would be negatively affected']"
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
        "preemptive_defense": "BEFORE THEY ATTACK: '[EXACT WORD-FOR-WORD PHRASE to include in opening that neutralizes counterargument #1. Must be 2-3 sentences, ready to use. Example: \"Some might argue that [counterargument], but this overlooks [key point]. The evidence clearly shows [specific fact].\" Include where to place it: \"Place this immediately after your opening hook, at approximately [X] seconds.\"]",
        "direct_response": "WHEN CONFRONTED: '[EXACT WORD-FOR-WORD talking points with specific data to counter rebuttal #1. Must include actual statistics/quotes. Example: \"I understand your concern about [counterargument], but [specific statistic] from [source, year] demonstrates [your point]. When [specific case study] was implemented in [location, year], it resulted in [specific outcome].\" Make this 3-4 sentences, ready to deliver.]",
        "redirect_technique": "PIVOT STRATEGY: '[EXACT WORD-FOR-WORD technique to acknowledge concern then redirect. Example: \"While [concede minor point], the real issue is [your strength]. Consider that [specific example], which shows [your point]. This matters because [specific impact].\" Must be 3-4 sentences, actionable.]",
        "evidence_arsenal": "WEAPONS: '[Specific statistic with source], [Expert quote with credentials], [Case study with location/year] that defeats their counterargument. List 3-4 specific pieces of evidence, each with source attribution. Example: \"1) The 2023 World Bank report showing [X]% of [population]. 2) Quote from [Expert Name], [Title]: '[exact quote]'. 3) Case study: [Country/Company] implemented [policy] in [year], resulting in [specific outcome].\"]",
        "key_points": [
          "TALKING POINT 1: [Specific point to make when countering. Example: 'Cite the [Year] [Study] showing [specific result] that contradicts their claim']",
          "TALKING POINT 2: [Another specific point. Example: 'Reference [Country/Company] case study where [policy] succeeded with [specific outcome]']",
          "TALKING POINT 3: [Third specific point. Example: 'Use the expert quote from [Expert Name]: \"[exact quote]\" to demonstrate [your point]']",
          "TALKING POINT 4: [Fourth specific point. Example: 'Present the statistic: [X]% of [population] benefit from [policy] according to [Source, Year]']",
          "TALKING POINT 5: [Fifth specific point. Example: 'Frame it as: While they focus on [their concern], the real issue is [your strength] which [specific example] demonstrates']"
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

MANDATORY SECTIONS - CANNOT BE EMPTY:
1. counter_arguments: MUST provide 3 counterarguments. Each MUST:
   - Be specific to their actual speech (not generic)
   - Reference their exact claims from the transcript
   - Include real statistics, studies, or examples with sources
   - Be phrased as a skilled opponent would deliver it
   - Be 2-3 sentences minimum, not one-liners
   - Include key_points array with 3-4 specific talking points the opponent would use (each with specific evidence/statistics)

2. defense_strategies: MUST provide 3 defense strategies (one for each counterargument). Each MUST:
   - Include EXACT word-for-word phrases ready to use
   - Provide specific statistics, quotes, or case studies with sources
   - Include placement instructions (where in speech)
   - Be 3-4 sentences for direct_response and redirect_technique
   - Include 3-4 pieces of evidence in evidence_arsenal with full attribution
   - Include key_points array with 4-5 specific talking points the speaker should use to defend (each with exact wording, statistics, or quotes ready to deliver)

3. All feedback arrays MUST have at least 3 items, not 1-2
4. All text fields MUST be substantial (minimum 2-3 sentences), not one-liners

VALIDATION CHECKLIST - Before returning JSON, verify:
✓ Every counter_argument.rebuttal is 2-3 sentences and references their actual speech
✓ Every counter_argument.supporting_evidence includes specific numbers, dates, and source names
✓ Every counter_argument.key_points has 3-4 specific talking points (opponent's key arguments)
✓ Every defense_strategy.direct_response is 3-4 sentences with exact wording
✓ Every defense_strategy.evidence_arsenal lists 3-4 specific pieces of evidence with sources
✓ Every defense_strategy.key_points has 4-5 specific talking points (speaker's defense points)
✓ All feedback points are specific and actionable (no vague phrases)
✓ All feedback references exact quotes from their transcript
✓ All arrays have at least 3 items
✓ All key_points are specific, actionable, and include evidence or exact wording

FINAL REMINDER - CRITICAL FOR QUALITY:
1. Every single feedback point MUST quote their exact words from the transcript
2. Every suggestion MUST include exact word-for-word replacements, not vague advice
3. counter_arguments MUST be 3 detailed counterarguments (2-3 sentences each) with specific statistics and sources
4. counter_arguments.key_points MUST be 3-4 specific talking points the opponent will use (each with evidence/statistics)
5. defense_strategies MUST be 3 complete defense strategies (3-4 sentences each) with exact word-for-word phrases ready to use
6. defense_strategies.key_points MUST be 4-5 specific talking points the speaker should use (each with exact wording, stats, or quotes ready to deliver)
7. NO generic feedback like "improve your argument" - MUST be specific: "Your premise '[exact quote]' needs [specific statistic] from [source]"
8. If any section seems incomplete, expand it until it meets the minimum requirements

JSON FORMAT REQUIREMENTS - CRITICAL FOR PARSING:
- Return ONLY valid JSON object
- NO markdown code blocks
- NO text before or after the JSON
- NO explanations, just the JSON
- ESCAPE ALL QUOTES IN STRING VALUES: Use \\" for quotes inside strings (e.g., "He said \\"hello\\"" not "He said "hello"")
- ESCAPE ALL SPECIAL CHARACTERS: Use \\n for newlines, \\t for tabs, \\r for carriage returns
- All scores must be integers
- All arrays must contain strings (minimum 3 items per array)
- counter_arguments array MUST have exactly 3 items, each with rebuttal (2-3 sentences), supporting_evidence (with numbers/sources), and common_sources
- defense_strategies array MUST have exactly 3 items, each with preemptive_defense (2-3 sentences), direct_response (3-4 sentences), redirect_technique (3-4 sentences), and evidence_arsenal (3-4 pieces of evidence)
- EXAMPLE OF PROPER ESCAPING: If your text contains "He said 'hello'", write it as: "He said 'hello'" (single quotes OK) or "He said \\"hello\\"" (escaped double quotes)
- Example structure (use real analysis from their speech):
{"logic_score":7,"logic_feedback":["When you said '[exact quote]', this creates a logical gap because [reason]. Add: '[exact improved version]'","Your premise '[exact quote]' lacks evidence. Add: 'According to World Bank 2023, 45% of countries experience X'","Use causal chain: 'Because [claim], and because [fact], therefore [conclusion]' at [location]"],"rhetoric_score":6,"rhetoric_feedback":["Your phrase '[exact quote]' uses anaphora effectively. Add more: '[exact 3-part example]'","Replace '[vague phrase]' with '[exact powerful phrase]'","You missed metaphor. Add: '[exact metaphor]'"],"empathy_score":3,"empathy_feedback":["You never acknowledged '[counterargument]'. Add: 'Some argue [counterargument], but [response]'","Your phrase '[exact quote]' sounds dismissive. Replace with '[empathetic version]'"],"delivery_score":4,"delivery_feedback":["Your sentence '[exact quote]' is unclear. Rewrite as: '[clearer version]'","Add transition '[exact phrase]' between [point A] and [point B]"],"missing_points":["IPCC 2023 report: 1.5°C warming threshold will be exceeded by 2030 without action","Historical precedent: Kyoto Protocol 1997 reduced emissions by 5.2% in 37 countries"],"enhanced_argument":"[Full rewritten version with statistics and examples]","enhanced_feedback":{"argument_analysis":{...},"counter_arguments":[{...},{...},{...}],"defense_strategies":[{...},{...},{...}]}}

Return the analysis as pure JSON starting with { and ending with }
`;
  }

  private parseAnalysis(analysis: string, originalTranscript: string): ScoreResult {
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedAnalysis = analysis.trim();
      
      // Remove markdown code fences if present
      cleanedAnalysis = cleanedAnalysis.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
      cleanedAnalysis = cleanedAnalysis.replace(/\s*```\s*$/i, '');
      
      // Extract JSON from the response - try to find the JSON object
      let jsonMatch = cleanedAnalysis.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in AI response. Response:', analysis.substring(0, 500));
        throw new Error('No JSON found in AI response. The AI may not have returned valid JSON format.');
      }

      let jsonString = jsonMatch[0];
      let parsed;
      
      // Try to parse the JSON with multiple fallback strategies
      try {
        parsed = JSON.parse(jsonString);
      } catch (parseError) {
        console.warn('Initial JSON parse failed, attempting to fix common issues...');
        
        // Try to fix common JSON issues
        try {
          let fixedJson = this.repairJsonString(jsonString);
          parsed = JSON.parse(fixedJson);
          console.log('Successfully parsed JSON after fixing common issues');
        } catch (fixError) {
          // If fixing doesn't work, try to extract and parse just the essential parts
          console.error('JSON parse error after fixes:', fixError);
          console.error('JSON string length:', jsonString.length);
          console.error('JSON preview (first 1000 chars):', jsonString.substring(0, 1000));
          console.error('JSON preview (last 1000 chars):', jsonString.substring(Math.max(0, jsonString.length - 1000)));
          
          // Try to find the error position and show context
          if (parseError instanceof SyntaxError && 'message' in parseError) {
            const errorMsg = parseError.message;
            const positionMatch = errorMsg.match(/position (\d+)/);
            if (positionMatch) {
              const position = parseInt(positionMatch[1]);
              const start = Math.max(0, position - 100);
              const end = Math.min(jsonString.length, position + 100);
              console.error('Error context around position', position, ':', jsonString.substring(start, end));
            }
          }
          
          // Last resort: try to construct a minimal valid response
          try {
            const minimalJson = this.extractMinimalValidJson(jsonString);
            parsed = JSON.parse(minimalJson);
            console.log('Successfully parsed minimal JSON');
          } catch (minimalError) {
            throw new Error(`Failed to parse AI response as JSON. The response may contain invalid characters or be truncated. Error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          }
        }
      }

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

      return {
        score: {
          logic: logicScore,
          rhetoric: rhetoricScore,
          empathy: empathyScore,
          delivery: deliveryScore,
          total: totalScore
        },
        feedback: {
          logic: Array.isArray(parsed.logic_feedback) ? parsed.logic_feedback.join(' ') : 'No logic feedback provided.',
          rhetoric: Array.isArray(parsed.rhetoric_feedback) ? parsed.rhetoric_feedback.join(' ') : 'No rhetoric feedback provided.',
          empathy: Array.isArray(parsed.empathy_feedback) ? parsed.empathy_feedback.join(' ') : 'No empathy feedback provided.',
          delivery: Array.isArray(parsed.delivery_feedback) ? parsed.delivery_feedback.join(' ') : 'No delivery feedback provided.',
          overall: `Your speech scored ${totalScore}/30. Focus on improving areas with lower scores for better performance.`
        },
        missingPoints: parsed.missing_points || [],
        enhancedArgument: parsed.enhanced_argument || '',
        enhancedFeedback: {
          argumentAnalysis: {
            logicalStructure: argumentAnalysis.logical_structure || '',
            evidenceQuality: argumentAnalysis.evidence_quality || '',
            clarityScore: argumentAnalysis.clarity_score || 0,
            persuasiveness: argumentAnalysis.persuasiveness || ''
          },
          dataEnhancements: {
            statisticalSupport: dataEnhancements.statistical_support || [],
            expertCitations: dataEnhancements.expert_citations || [],
            caseStudies: dataEnhancements.case_studies || [],
            quantifiableClaims: dataEnhancements.quantifiable_claims || []
          },
          counterArguments: counterArgs.map((arg: any) => ({
            rebuttal: arg.rebuttal || '',
            strengthLevel: arg.strength_level || 'Medium',
            supportingEvidence: arg.supporting_evidence || '',
            commonSources: arg.common_sources || '',
            keyPoints: arg.key_points || []
          })),
          defenseStrategies: defenseStrats.map((strategy: any) => ({
            preemptiveDefense: strategy.preemptive_defense || '',
            directResponse: strategy.direct_response || '',
            redirectTechnique: strategy.redirect_technique || '',
            evidenceArsenal: strategy.evidence_arsenal || '',
            keyPoints: strategy.key_points || []
          })),
          strategicRecommendations: enhancedFeedback.strategic_recommendations || []
        },
        transcript: originalTranscript
      };
    } catch (error) {
      console.error('Failed to parse AI analysis:', error);
      throw new Error('Failed to parse AI response');
    }
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

    // Try to extract enhanced_argument if present
    const enhancedArgMatch = jsonString.match(/"enhanced_argument"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
    if (enhancedArgMatch) {
      minimal.enhanced_argument = enhancedArgMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
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