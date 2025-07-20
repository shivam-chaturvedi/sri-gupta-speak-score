interface ScoreResult {
  score: number;
  feedback: string[];
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
      throw new Error('API key not set. Please provide your OpenAI API key.');
    }

    const prompt = this.buildAnalysisPrompt(request);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: 'You are an expert debate coach and public speaking instructor. Analyze speeches and provide constructive feedback to help improve debating skills.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = data.choices[0].message.content;

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

      const totalScore = parsed.logic_score + parsed.rhetoric_score + parsed.empathy_score + parsed.delivery_score;

      const allFeedback = [
        ...parsed.logic_feedback,
        ...parsed.rhetoric_feedback,
        ...parsed.empathy_feedback,
        ...parsed.delivery_feedback
      ];

      return {
        score: totalScore,
        feedback: allFeedback,
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