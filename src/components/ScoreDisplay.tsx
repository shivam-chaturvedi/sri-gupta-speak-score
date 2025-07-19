import { Trophy, Target, Heart, Zap, RotateCcw, Share2, MessageSquare, Lightbulb, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type ScoreData } from "@/utils/mockScoring";

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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transcript" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Your Argument
              </TabsTrigger>
              <TabsTrigger value="missing" className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                What You Missed
              </TabsTrigger>
              <TabsTrigger value="enhanced" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Enhanced Version
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