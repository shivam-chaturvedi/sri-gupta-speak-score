import { Trophy, Target, Heart, Zap, RotateCcw, Share2, MessageSquare, Lightbulb, Star, Shield, TrendingUp, Users, Brain, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type ScoreData } from "@/utils/mockScoring";

interface CounterArgument {
  rebuttal: string;
  strengthLevel: 'Low' | 'Medium' | 'High';
  supportingEvidence: string;
  commonSources: string;
  keyPoints?: string[];
}

interface DefenseStrategy {
  preemptiveDefense: string;
  directResponse: string;
  redirectTechnique: string;
  evidenceArsenal: string;
  keyPoints?: string[];
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

interface ScoreDisplayProps {
  motion: {
    topic: string;
    category: string;
  };
  stance?: string;
  score: ScoreData['score'];
  feedback: ScoreData['feedback'];
  transcript: string;
  missingPoints: string[];
  enhancedArgument: string;
  enhancedFeedback?: EnhancedFeedback;
  onTryAgain: () => void;
  onNewTopic: () => void;
}

export function ScoreDisplay({ 
  motion, 
  stance, 
  score, 
  feedback, 
  transcript,
  missingPoints,
  enhancedArgument,
  enhancedFeedback,
  onTryAgain, 
  onNewTopic 
}: ScoreDisplayProps) {
  const totalScore = score.total;
  const maxScore = 30;
  
  const getScoreColor = (points: number, max: number) => {
    const percentage = (points / max) * 100;
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  const getOverallGrade = () => {
    const percentage = (totalScore / maxScore) * 100;
    if (percentage >= 90) return { grade: "A+", color: "bg-success", message: "Outstanding!" };
    if (percentage >= 80) return { grade: "A", color: "bg-success", message: "Excellent!" };
    if (percentage >= 70) return { grade: "B", color: "bg-warning", message: "Good work!" };
    if (percentage >= 60) return { grade: "C", color: "bg-warning", message: "Not bad!" };
    if (percentage >= 50) return { grade: "D", color: "bg-destructive", message: "Keep practicing!" };
    return { grade: "F", color: "bg-destructive", message: "Room for improvement!" };
  };

  const overall = getOverallGrade();

  const categories = [
    { 
      name: "Logic", 
      icon: Target, 
      score: score.logic, 
      max: 10, 
      feedback: feedback.logic,
      description: "Structure & flow"
    },
    { 
      name: "Rhetoric", 
      icon: Zap, 
      score: score.rhetoric, 
      max: 10, 
      feedback: feedback.rhetoric,
      description: "Persuasive language"
    },
    { 
      name: "Empathy", 
      icon: Heart, 
      score: score.empathy, 
      max: 5, 
      feedback: feedback.empathy,
      description: "Respectful tone"
    },
    { 
      name: "Delivery", 
      icon: Trophy, 
      score: score.delivery, 
      max: 5, 
      feedback: feedback.delivery,
      description: "Fluency & confidence"
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header with topic */}
      <Card className="bg-gradient-to-br from-speech-card to-speech-card/90 border-0 shadow-speech">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg font-bold text-foreground">
            {motion.topic}
          </CardTitle>
          {stance && (
            <Badge className="bg-primary text-primary-foreground border-0 mx-auto">
              Argued {stance === "for" ? "FOR" : "AGAINST"}
            </Badge>
          )}
        </CardHeader>
      </Card>

      {/* Overall Score */}
      <Card className="bg-gradient-to-br from-speech-card to-speech-card/90 border-0 shadow-speech">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${overall.color} text-white text-2xl font-bold`}>
              {overall.grade}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">{totalScore}/{maxScore}</h3>
              <p className="text-muted-foreground">{overall.message}</p>
            </div>
            <Progress value={(totalScore / maxScore) * 100} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <Card key={category.name} className="bg-gradient-to-br from-speech-card to-speech-card/90 border-0 shadow-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <category.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{category.name}</h4>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${getScoreColor(category.score, category.max)}`}>
                    {category.score}
                  </span>
                  <span className="text-muted-foreground">/{category.max}</span>
                </div>
              </div>
              <Progress 
                value={(category.score / category.max) * 100} 
                className="h-2 mb-3" 
              />
              <p className="text-sm text-muted-foreground">{category.feedback}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Three-Panel Results Display */}
      <Card className="bg-gradient-to-br from-speech-card to-speech-card/90 border-0 shadow-speech">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Detailed Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transcript" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-1 h-auto p-1.5 sm:p-1">
              <TabsTrigger value="transcript" className="flex flex-col sm:flex-row items-center justify-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-2.5 sm:py-1.5 min-h-[48px] sm:min-h-0">
                <MessageSquare className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                <span className="text-center">Speech</span>
              </TabsTrigger>
              <TabsTrigger value="missing" className="flex flex-col sm:flex-row items-center justify-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-2.5 sm:py-1.5 min-h-[48px] sm:min-h-0">
                <Lightbulb className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                <span className="text-center">Missing</span>
              </TabsTrigger>
              <TabsTrigger value="enhanced" className="flex flex-col sm:flex-row items-center justify-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-2.5 sm:py-1.5 min-h-[48px] sm:min-h-0">
                <Star className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                <span className="text-center">Enhanced</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex flex-col sm:flex-row items-center justify-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-2.5 sm:py-1.5 min-h-[48px] sm:min-h-0">
                <Brain className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                <span className="text-center">Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="counterargs" className="flex flex-col sm:flex-row items-center justify-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-2.5 sm:py-1.5 min-h-[48px] sm:min-h-0">
                <AlertTriangle className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                <span className="text-center">Counters</span>
              </TabsTrigger>
              <TabsTrigger value="defense" className="flex flex-col sm:flex-row items-center justify-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-2.5 sm:py-1.5 min-h-[48px] sm:min-h-0">
                <Shield className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                <span className="text-center">Defense</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transcript" className="mt-4">
              <div className="prose prose-sm max-w-none">
                <h4 className="text-foreground font-semibold mb-3">Your Original Speech</h4>
                <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
                  <p className="text-muted-foreground leading-relaxed">{transcript}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="missing" className="mt-4">
              <div className="prose prose-sm max-w-none">
                <h4 className="text-foreground font-semibold mb-3">Missing Points Analysis</h4>
                <p className="text-muted-foreground mb-4">
                  Here are key arguments and evidence you could include to strengthen your position:
                </p>
                <ul className="space-y-2">
                  {missingPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="enhanced" className="mt-4">
              <div className="prose prose-sm max-w-none">
                <h4 className="text-foreground font-semibold mb-3">Enhanced Argument</h4>
                <p className="text-muted-foreground mb-4">
                  Here's how your argument could be improved with better structure and the missing points:
                </p>
                <div className="bg-success/10 p-4 rounded-lg border-l-4 border-success">
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {enhancedArgument}
                  </div>
                </div>
              </div>
            </TabsContent>

            {enhancedFeedback && (
              <>
                <TabsContent value="analysis" className="mt-4">
                  <div className="prose prose-sm max-w-none space-y-6">
                    <div>
                      <h4 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary" />
                        🎯 Argument Analysis
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-foreground mb-2">Logical Structure</h5>
                          <p className="text-muted-foreground">{enhancedFeedback.argumentAnalysis.logicalStructure}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-foreground mb-2">Evidence Quality</h5>
                          <p className="text-muted-foreground">{enhancedFeedback.argumentAnalysis.evidenceQuality}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-foreground mb-2">Clarity Score: {enhancedFeedback.argumentAnalysis.clarityScore}/10</h5>
                          <Progress value={enhancedFeedback.argumentAnalysis.clarityScore * 10} className="w-full mb-2" />
                        </div>
                        <div>
                          <h5 className="font-medium text-foreground mb-2">Persuasiveness</h5>
                          <p className="text-muted-foreground">{enhancedFeedback.argumentAnalysis.persuasiveness}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        📊 Data Enhancement Opportunities
                      </h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        {enhancedFeedback.dataEnhancements.statisticalSupport.length > 0 && (
                          <div>
                            <h5 className="font-medium text-foreground mb-2">Statistical Support</h5>
                            <ul className="space-y-1">
                              {enhancedFeedback.dataEnhancements.statisticalSupport.map((stat, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                  {stat}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {enhancedFeedback.dataEnhancements.expertCitations.length > 0 && (
                          <div>
                            <h5 className="font-medium text-foreground mb-2">Expert Citations</h5>
                            <ul className="space-y-1">
                              {enhancedFeedback.dataEnhancements.expertCitations.map((citation, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                  {citation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {enhancedFeedback.dataEnhancements.caseStudies.length > 0 && (
                          <div>
                            <h5 className="font-medium text-foreground mb-2">Case Studies</h5>
                            <ul className="space-y-1">
                              {enhancedFeedback.dataEnhancements.caseStudies.map((study, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                  {study}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {enhancedFeedback.dataEnhancements.quantifiableClaims.length > 0 && (
                          <div>
                            <h5 className="font-medium text-foreground mb-2">Quantifiable Claims</h5>
                            <ul className="space-y-1">
                              {enhancedFeedback.dataEnhancements.quantifiableClaims.map((claim, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                  {claim}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="counterargs" className="mt-4">
                  <div className="prose prose-sm max-w-none">
                    <h4 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-primary" />
                      ⚔️ Anticipated Counterattacks
                    </h4>
                    <div className="space-y-4">
                      {enhancedFeedback.counterArguments.map((counter, i) => (
                        <div key={i} className="border border-muted rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-foreground">Counterargument #{i + 1}</h5>
                            <Badge variant={counter.strengthLevel === 'High' ? 'destructive' : counter.strengthLevel === 'Medium' ? 'default' : 'secondary'}>
                              {counter.strengthLevel} Threat
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <strong className="text-foreground">The Rebuttal:</strong>
                              <p className="text-muted-foreground mt-1">{counter.rebuttal}</p>
                            </div>
                            <div>
                              <strong className="text-foreground">Supporting Evidence:</strong>
                              <p className="text-muted-foreground mt-1">{counter.supportingEvidence}</p>
                            </div>
                            <div>
                              <strong className="text-foreground">Common Sources:</strong>
                              <p className="text-muted-foreground mt-1">{counter.commonSources}</p>
                            </div>
                            {counter.keyPoints && counter.keyPoints.length > 0 && (
                              <div>
                                <strong className="text-foreground flex items-center gap-2 mb-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Key Talking Points (Opponent Will Use):
                                </strong>
                                <ul className="space-y-2 ml-6">
                                  {counter.keyPoints.map((point, idx) => (
                                    <li key={idx} className="text-muted-foreground flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-destructive rounded-full mt-2 flex-shrink-0" />
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="defense" className="mt-4">
                  <div className="prose prose-sm max-w-none">
                    <h4 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      🛡️ Defense Strategies
                    </h4>
                    <div className="space-y-4">
                      {enhancedFeedback.defenseStrategies.map((strategy, i) => (
                        <div key={i} className="border border-muted rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-3">Defense Strategy #{i + 1} (Against Counterargument #{i + 1})</h5>
                          <div className="space-y-3">
                            <div>
                              <strong className="text-foreground">Pre-emptive Defense:</strong>
                              <p className="text-muted-foreground mt-1">{strategy.preemptiveDefense}</p>
                            </div>
                            <div>
                              <strong className="text-foreground">Direct Response:</strong>
                              <p className="text-muted-foreground mt-1">{strategy.directResponse}</p>
                            </div>
                            <div>
                              <strong className="text-foreground">Redirect Technique:</strong>
                              <p className="text-muted-foreground mt-1">{strategy.redirectTechnique}</p>
                            </div>
                            <div>
                              <strong className="text-foreground">Evidence Arsenal:</strong>
                              <p className="text-muted-foreground mt-1">{strategy.evidenceArsenal}</p>
                            </div>
                            {strategy.keyPoints && strategy.keyPoints.length > 0 && (
                              <div>
                                <strong className="text-foreground flex items-center gap-2 mb-2">
                                  <Shield className="w-4 h-4" />
                                  Key Talking Points (Use These to Defend):
                                </strong>
                                <ul className="space-y-2 ml-6">
                                  {strategy.keyPoints.map((point, idx) => (
                                    <li key={idx} className="text-muted-foreground flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-success rounded-full mt-2 flex-shrink-0" />
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 bg-primary/10 p-4 rounded-lg">
                      <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        💡 Strategic Recommendations
                      </h5>
                      <ul className="space-y-2">
                        {enhancedFeedback.strategicRecommendations.map((rec, i) => (
                          <li key={i} className="text-muted-foreground flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Overall Feedback */}
      <Card className="bg-gradient-to-br from-speech-card to-speech-card/90 border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Coach's Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{feedback.overall}</p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid gap-3 md:grid-cols-3">
        <Button
          onClick={onTryAgain}
          variant="outline"
          className="font-medium"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        
        <Button
          onClick={onNewTopic}
          className="bg-gradient-primary hover:opacity-90 border-0 text-white font-semibold"
        >
          New Topic
        </Button>
        
        <Button
          variant="outline"
          className="font-medium"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'My Dialectica Score',
                text: `I scored ${totalScore}/${maxScore} on "${motion.topic}" - ${overall.message}`,
                url: window.location.href
              });
            }
          }}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}