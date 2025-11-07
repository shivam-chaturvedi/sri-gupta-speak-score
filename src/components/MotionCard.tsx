import { useState, useEffect, useMemo } from "react";
import { Clock, Play, Mic, RotateCcw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";

interface Motion {
  id: string;
  topic: string;
  category: string;
  description?: string;
  type: "opinion" | "stance";
}

interface MotionCardProps {
  motion: Motion;
  onStartSpeech: (motion: Motion, duration: number, stance?: string) => void;
  isLoggedIn?: boolean;
}

export function MotionCard({ motion, onStartSpeech, isLoggedIn = false }: MotionCardProps) {
  const [selectedStance, setSelectedStance] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<number>(60);

  // Reset stance when motion changes to prevent state from persisting incorrectly
  useEffect(() => {
    // Reset stance when motion ID changes (new motion selected)
    setSelectedStance("");
  }, [motion.id]); // Reset when motion ID changes

  // Memoize whether this is a stance motion to prevent re-renders from hiding buttons
  const isStanceMotion = useMemo(() => {
    if (!motion || !motion.type) return false;
    return motion.type === "stance";
  }, [motion?.type, motion?.id]);

  const getCategoryColor = (category: string) => {
    const colors = {
      Politics: "bg-destructive",
      Ethics: "bg-success", 
      Education: "bg-primary",
      Technology: "bg-accent",
      Abstract: "bg-speech-accent",
      "Pop Culture": "bg-warning"
    };
    return colors[category as keyof typeof colors] || "bg-muted";
  };

  const handleStart = () => {
    if (!isLoggedIn) {
      return; // Don't proceed if not logged in
    }
    onStartSpeech(
      motion, 
      selectedDuration, 
      isStanceMotion ? selectedStance : undefined
    );
  };

  // Early return if motion is invalid
  if (!motion || !motion.id) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-speech-card to-speech-card/90 border-0 shadow-speech hover:shadow-glow transition-all duration-300 hover:scale-105">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <Badge className={`${getCategoryColor(motion.category)} text-white border-0`}>
            {motion.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {isStanceMotion ? "For/Against" : "Opinion"}
          </Badge>
        </div>
        <CardTitle className="text-lg font-bold leading-tight text-foreground">
          {motion.topic}
        </CardTitle>
        {motion.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {motion.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isStanceMotion ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">Choose your stance:</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedStance === "for" ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedStance("for");
                }}
                className="h-8"
                type="button"
                aria-label="Select For stance"
              >
                For
              </Button>
              <Button
                variant={selectedStance === "against" ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedStance("against");
                }}
                className="h-8"
                type="button"
                aria-label="Select Against stance"
              >
                Against
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Speech duration:</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={selectedDuration === 60 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDuration(60)}
              className="h-8"
            >
              <Clock className="w-3 h-3 mr-1" />
              60s
            </Button>
            <Button
              variant={selectedDuration === 90 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDuration(90)}
              className="h-8"
            >
              <Clock className="w-3 h-3 mr-1" />
              90s
            </Button>
          </div>
        </div>

        {isLoggedIn ? (
          <Button
            onClick={handleStart}
            disabled={isStanceMotion && !selectedStance}
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity border-0 text-white font-semibold py-3 h-12"
          >
            <Mic className="w-4 h-4 mr-2" />
            Start Speaking
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isStanceMotion && !selectedStance}
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity border-0 text-white font-semibold py-3 h-12"
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Speaking
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Login Required</AlertDialogTitle>
                <AlertDialogDescription>
                  Please login first to start practicing. You need to be logged in to save your progress and track your achievements.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Link to="/login" className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Go to Login
                  </Link>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}