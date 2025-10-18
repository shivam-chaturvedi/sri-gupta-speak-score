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
  private apiKey: string = "AIzaSyDemiHqUVekPovaBmYn9AF8FLAJ7g2v8dU";

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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
            maxOutputTokens: 4000,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = data.candidates[0].content.parts[0].text;

      return this.parseAnalysis(analysis, request.transcript);
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(request: SpeechAnalysisRequest): string {
    return `
You are an EXPERT DEBATE COACH and ARGUMENT STRATEGIST. Analyze this debate speech with brutal honesty and provide SPECIFIC, ACTIONABLE feedback.

DEBATE TOPIC: "${request.topic}"
STANCE: ${request.stance ? request.stance.toUpperCase() : 'NEUTRAL'}
DURATION: ${request.duration} seconds

TRANSCRIPT:
"${request.transcript}"

Your job is to:
1. Identify the STRONGEST points in their argument
2. Find MISSING evidence and arguments they should have used
3. Predict opponent's BEST counterattacks
4. Provide SPECIFIC defense strategies with real data

Provide analysis in this EXACT JSON format:

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

CRITICAL REQUIREMENTS:
- Every piece of feedback must be SPECIFIC and ACTIONABLE
- Include REAL statistics, studies, experts (even if examples - make them realistic)
- NO generic advice like "be more confident" - give EXACT techniques
- Counterarguments must be GENUINELY STRONG (what a skilled opponent would use)
- Defense strategies must include SPECIFIC phrases and data points
- Enhanced argument must be 2-3x better than original
- Be BRUTALLY HONEST about weaknesses but CONSTRUCTIVELY supportive
- Think like a debate coach who wants them to WIN

Return ONLY valid JSON, no additional text.
`;
  }

  private parseAnalysis(analysis: string, originalTranscript: string): ScoreResult {
    try {
      // Extract JSON from the response
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

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