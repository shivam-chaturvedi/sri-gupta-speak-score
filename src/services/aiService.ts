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
  transcript: string;
}

interface SpeechAnalysisRequest {
  transcript: string;
  topic: string;
  stance?: string;
  duration: number;
}

export class AIService {
  private apiKey: string | null = null;

  constructor() {
    // For now, we'll ask the user for their API key
    this.apiKey = null;
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
            maxOutputTokens: 2000,
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
Analyze this speech on the topic "${request.topic}" ${request.stance ? `(taking the ${request.stance} stance)` : ''}.

TRANSCRIPT:
"${request.transcript}"

SPEECH DURATION: ${request.duration} seconds

Please provide a detailed analysis in the following JSON format:

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
  "enhanced_argument": "A rewritten version of their argument that incorporates the missing points and improves structure, flow, and persuasiveness while maintaining their original stance and viewpoint."
}

SCORING CRITERIA:
- Logic (0-10): Argument structure, flow, reasoning, evidence
- Rhetoric (0-10): Persuasive language, examples, rhetorical devices
- Empathy (0-5): Respectful tone, acknowledgment of other perspectives
- Delivery (0-5): Fluency, confidence, clarity (based on transcript quality)

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
        transcript: originalTranscript
      };
    } catch (error) {
      console.error('Failed to parse AI analysis:', error);
      throw new Error('Failed to parse AI response');
    }
  }
}

export const aiService = new AIService();