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
                  text: `You are an expert debate coach and public speaking instructor. Analyze speeches and provide constructive feedback to help improve debating skills.\n\n${prompt}`
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
    return `You are an EXPERT DEBATE COACH and ARGUMENT STRATEGIST. Analyze this debate speech with CRITICAL ACURACY and provide SPECIFIC, QUANTIFIABLE feedback.

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
   - 9-10: Outstanding structure with clear premises→conclusion chains
   - 7-8: Good arguments but minor gaps in logic or evidence
   - 5-6: Some valid points but significant logical weaknesses
   - 3-4: Major flaws in reasoning or missing evidence
   - 0-2: Fundamental logical errors or no coherent argument

2. Rhetoric Score:
   - 9-10: Masterful use of rhetorical devices, powerful language, compelling narrative
   - 7-8: Good persuasive techniques with room for improvement
   - 5-6: Basic persuasive language but lacks impact
   - 3-4: Weak rhetorical choices, not engaging
   - 0-2: No clear persuasive strategy

3. Empathy Score:
   - 5: Shows deep understanding of multiple perspectives
   - 4: Good awareness of other viewpoints
   - 3: Some recognition of opposing views
   - 2: Limited perspective-taking
   - 1: No consideration of others' perspectives
   - 0: Dismissive or antagonistic tone

4. Delivery Score (from transcript only):
   - 5: Extremely clear, organized, confident expression
   - 4: Clear and well-organized
   - 3: Generally understandable
   - 2: Unclear or disorganized
   - 1: Very difficult to understand
   - 0: Incomprehensible

CRITICAL: Score ACCURATELY based on the actual content. Be BRUTAL if they deserve low scores. Be GENEROUS only if they deserve high scores. No participation trophies!

Provide analysis in this EXACT JSON format (NO MARKDOWN, NO CODE BLOCKS, JUST PURE JSON):

{
  "logic_score": [0-10],
  "logic_feedback": [
    "SPECIFIC weakness or strength in logical structure",
    "CONCRETE example of where reasoning could improve",
    "ACTIONABLE suggestion with specific technique"
  ],
  "rhetoric_score": [0-10], 
  "rhetoric_feedback": [
    "SPECIFIC assessment of persuasive language use",
    "CONCRETE rhetorical device they used or missed",
    "ACTIONABLE improvement with example phrase"
  ],
  "empathy_score": [0-5],
  "empathy_feedback": ["SPECIFIC comment on tone and perspective-taking"],
  "delivery_score": [0-5],
  "delivery_feedback": ["SPECIFIC assessment of clarity and confidence from transcript"],
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
        "rebuttal": "STRONGEST OPPONENT ARGUMENT: [Exactly what they'd say, phrased persuasively]",
        "strength_level": "High",
        "supporting_evidence": "SPECIFIC DATA OPPONENT WOULD USE: [Real statistics, studies, or examples that support their rebuttal]",
        "common_sources": "WHERE OPPONENT FINDS THIS: [Specific publications, think tanks, experts they'd cite]"
      },
      {
        "rebuttal": "SECOND OPPONENT ATTACK: [Another powerful counterargument]",
        "strength_level": "High",
        "supporting_evidence": "THEIR EVIDENCE: [Specific data supporting this rebuttal]",
        "common_sources": "THEIR SOURCES: [Where this argument commonly appears]"
      },
      {
        "rebuttal": "THIRD OPPONENT POINT: [Medium-strength counterargument]",
        "strength_level": "Medium",
        "supporting_evidence": "THEIR LOGIC: [How they'd support this point]",
        "common_sources": "ORIGIN: [Common source of this argument]"
      }
    ],
    "defense_strategies": [
      {
        "preemptive_defense": "BEFORE THEY ATTACK: '[Specific phrase to include in opening that neutralizes counterargument #1]'",
        "direct_response": "WHEN CONFRONTED: '[Exact talking points with specific data to counter rebuttal #1]'",
        "redirect_technique": "PIVOT STRATEGY: '[How to acknowledge concern then redirect to your strength] Example: 'While [concede minor point], the real issue is [your strength]''",
        "evidence_arsenal": "WEAPONS: '[Specific statistic], [Expert quote], [Case study] that defeats their counterargument'"
      },
      {
        "preemptive_defense": "NEUTRALIZE #2: '[Specific preemptive framing for counterargument #2]'",
        "direct_response": "COUNTER #2: '[Exact response with specific evidence]'",
        "redirect_technique": "REFRAME #2: '[How to turn their attack into your advantage]'",
        "evidence_arsenal": "DATA DUMP #2: '[Specific facts/quotes/examples to use]'"
      },
      {
        "preemptive_defense": "ADDRESS #3: '[How to handle counterargument #3 proactively]'",
        "direct_response": "REFUTE #3: '[Direct counter with specifics]'",
        "redirect_technique": "SPIN #3: '[Reframing technique]'",
        "evidence_arsenal": "PROOF #3: '[Supporting evidence]'"
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
- Logic: Review argument structure, logical connections, evidence use, fallacies
- Rhetoric: Analyze persuasive devices (ethos, pathos, logos), language impact, narrative structure
- Empathy: Look for perspective-taking, acknowledgment of counterarguments, respectful tone
- Delivery: Assess clarity from transcript, organization, coherence, articulation indicators
- Provide SPECIFIC, CONCRETE examples from their speech
- Give ACTIONABLE advice with exact techniques to improve
- NO vague feedback like "be better" - give SPECIFIC strategies
- Enhanced argument should be dramatically improved, not just polished

JSON FORMAT REQUIREMENTS:
- Return ONLY valid JSON object
- NO markdown code blocks
- NO text before or after the JSON
- NO explanations, just the JSON
- All scores must be integers
- All arrays must contain strings
- Example structure (use real analysis from their speech):
{"logic_score":7,"logic_feedback":["Weak evidence for X","Missing logical bridge between Y and Z","Add statistic on..."],"rhetoric_score":6,"rhetoric_feedback":["Used metaphor effectively","Lacks emotional appeal","Needs stronger call to action"],"empathy_score":3,"empathy_feedback":["Didn't acknowledge opposing view","Failed to address counterargument about..."],"delivery_score":4,"delivery_feedback":["Clear but needs more confidence indicators","Good organization"],"missing_points":["Stat on climate from IPCC 2023","Historical precedent: Kyoto Protocol 1997"],"enhanced_argument":"[Full rewritten version]"}

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
      
      // Extract JSON from the response
      const jsonMatch = cleanedAnalysis.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in AI response. Response:', analysis.substring(0, 500));
        throw new Error('No JSON found in AI response. The AI may not have returned valid JSON format.');
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Attempted to parse:', jsonMatch[0].substring(0, 500));
        throw new Error('Failed to parse AI response as JSON. The response format may be invalid.');
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
            commonSources: arg.common_sources || ''
          })),
          defenseStrategies: defenseStrats.map((strategy: any) => ({
            preemptiveDefense: strategy.preemptive_defense || '',
            directResponse: strategy.direct_response || '',
            redirectTechnique: strategy.redirect_technique || '',
            evidenceArsenal: strategy.evidence_arsenal || ''
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
}

export const aiService = new AIService();