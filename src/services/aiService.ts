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
  private apiKey: string = "AIzaSyCsUkpLciG1gmhnHQnxm6hTiBOvXOdvEA4";

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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
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
You are an expert debate coach and argument analyst. Analyze this speech on the topic "${request.topic}" ${request.stance ? `(taking the ${request.stance} stance)` : ''}.

TRANSCRIPT:
"${request.transcript}"

SPEECH DURATION: ${request.duration} seconds

Please provide a comprehensive analysis in the following JSON format:

{
  "logic_score": [0-10],
  "logic_feedback": ["specific feedback point 1", "specific feedback point 2"],
  "rhetoric_score": [0-10], 
  "rhetoric_feedback": ["specific feedback point 1", "specific feedback point 2"],
  "empathy_score": [0-5],
  "empathy_feedback": ["specific feedback point 1"],
  "delivery_score": [0-5],
  "delivery_feedback": ["specific feedback point 1"],
  "missing_points": [
    "Specific argument or evidence they could have included",
    "Another missing point",
    "A third improvement opportunity"
  ],
  "enhanced_argument": "A rewritten version of their argument that incorporates the missing points and improves structure, flow, and persuasiveness while maintaining their original stance and viewpoint.",
  "enhanced_feedback": {
    "argument_analysis": {
      "logical_structure": "Detailed evaluation of the logical flow and reasoning chain",
      "evidence_quality": "Assessment of the strength and relevance of supporting evidence",
      "clarity_score": [1-10],
      "persuasiveness": "Analysis of what makes the argument compelling or weak"
    },
    "data_enhancements": {
      "statistical_support": ["Specific statistics, studies, or data points that would strengthen their position"],
      "expert_citations": ["Authoritative sources, experts, or institutions to quote"],
      "case_studies": ["Real-world examples or historical precedents that support their argument"],
      "quantifiable_claims": ["Help transform vague assertions into specific, measurable statements"]
    },
    "counter_arguments": [
      {
        "rebuttal": "Clearly state a strong counterargument an opponent might use",
        "strength_level": "High/Medium/Low",
        "supporting_evidence": "What data or logic an opponent might use",
        "common_sources": "Where opponents typically find this counterargument"
      }
    ],
    "defense_strategies": [
      {
        "preemptive_defense": "How to address this counterargument in the original argument",
        "direct_response": "Specific talking points to counter the rebuttal",
        "redirect_technique": "How to pivot the conversation back to their strengths",
        "evidence_arsenal": "Data, quotes, or examples to use in defense"
      }
    ],
    "strategic_recommendations": [
      "Overall strategic advice for strengthening their position",
      "Specific tactics for this debate topic"
    ]
  }
}

SCORING CRITERIA:
- Logic (0-10): Argument structure, flow, reasoning, evidence
- Rhetoric (0-10): Persuasive language, examples, rhetorical devices
- Empathy (0-5): Respectful tone, acknowledgment of other perspectives
- Delivery (0-5): Fluency, confidence, clarity (based on transcript quality)

ENHANCED FEEDBACK REQUIREMENTS:
- Provide 3-5 of the strongest possible counterarguments
- Include specific, actionable advice rather than generic suggestions
- Prioritize evidence-based recommendations
- Be supportive but brutally honest about weaknesses
- Write as an experienced debate coach who wants them to win

Be constructive and specific in feedback. Focus on actionable improvements.
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