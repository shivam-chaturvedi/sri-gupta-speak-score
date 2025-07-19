import { Trophy, Target, Heart, Zap, RotateCcw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Score {
  logic: number;
  rhetoric: number;
  empathy: number;
  delivery: number;
}

interface ScoreDisplayProps {
  motion: {
    topic: string;
    category: string;
  };
  stance?: string;
  score: Score;
  feedback: {
    logic: string;
    rhetoric: string;
    empathy: string;
    delivery: string;
    overall: string;
  };
  onTryAgain: () => void;
  onNewTopic: () => void;
}

export function ScoreDisplay({ 
  motion, 
  stance, 
  score, 
  feedback, 
  onTryAgain, 
  onNewTopic 
}: ScoreDisplayProps) {
  const totalScore = score.logic + score.rhetoric + score.empathy + score.delivery;
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
    <div className="w-full max-w-2xl mx-auto space-y-6">
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

      {/* Overall Feedback */}
      <Card className="bg-gradient-to-br from-speech-card to-speech-card/90 border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Overall Feedback</CardTitle>
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