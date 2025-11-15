import { useState } from "react";
import { Mic, Target, Trophy, Zap, Heart, Sparkles, Loader2, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MotionCard } from "@/components/MotionCard";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { getDailyMotion, getRandomMotions, motions as allMotionsData, type Motion } from "@/data/motions";
import { aiService } from "@/services/aiService";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
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

type AppState = "home" | "recording" | "results";

interface AnalysisErrorState {
  title: string;
  description: string;
}

interface SessionData {
  motion: Motion;
  duration: number;
  stance?: string;
  audioBlob?: Blob;
}

const Index = () => {
  const { user, signOut } = useAuth();
  const [currentState, setCurrentState] = useState<AppState>("home");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [scoreData, setScoreData] = useState<any>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<AnalysisErrorState | null>(null);
  const [recorderResetCounter, setRecorderResetCounter] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<string>("All Themes");
  const [motions, setMotions] = useState(() => {
    const daily = getDailyMotion({ stanceOnly: true });
    const random = getRandomMotions(2, { stanceOnly: true });
    return [daily, ...random];
  });

  // Extract unique themes from ALL motions data and sort alphabetically
  const allThemes = Array.from(new Set(allMotionsData.map(motion => motion.category))).sort();
  const themeOptions = ["All Themes", ...allThemes];

  // Filter motions based on selected theme
  const filteredMotions = selectedTheme === "All Themes" 
    ? motions 
    : allMotionsData.filter(motion => motion.category === selectedTheme);
  
  // Get daily motion for theme-specific filtering
  const dailyMotion = motions[0];

  const resetSessionForRetry = () => {
    setSessionData(prev => {
      if (!prev) return prev;
      return {
        motion: prev.motion,
        duration: prev.duration,
        stance: prev.stance,
      };
    });
  };

  const resetRecorderComponent = () => setRecorderResetCounter(prev => prev + 1);

  const handleStartSpeech = (motion: Motion, duration: number, stance?: string) => {
    setAnalysisError(null);
    setSessionData({ motion, duration, stance });
    setCurrentState("recording");
  };

  const handleRestartAfterError = () => {
    resetSessionForRetry();
    resetRecorderComponent();
    setAnalysisError(null);
  };

  const handleRecordingComplete = async (audioBlob: Blob, transcript?: string) => {
    if (!sessionData) return;
    
    setSessionData({ ...sessionData, audioBlob });
    setAnalysisError(null);
    
    console.log('Recording complete. Transcript received:', transcript);
    console.log('Transcript length:', transcript?.length || 0);
    
    // AI analysis - require minimum transcript length
    if (transcript && transcript.trim().length > 20) {
      setIsAnalyzing(true);
      try {
        console.log('Starting AI analysis with transcript:', transcript);
        const results = await aiService.analyzeSpeeches({
          transcript,
          topic: sessionData.motion.topic,
          stance: sessionData.stance,
          duration: sessionData.duration
        });
        console.log('AI analysis successful:', results);
        setScoreData(results);
        setCurrentState("results");
      } catch (error) {
        console.error('AI analysis failed:', error);
        const message = error instanceof Error ? error.message : "AI analysis failed. Please restart your speech.";
        const normalizedMessage = message.toLowerCase();
        
        let errorState: AnalysisErrorState = {
          title: "AI Analysis Failed",
          description: "Something went wrong while scoring your speech. Please restart your speech and try again.",
        };
        
        if (
          normalizedMessage.includes('gemini is not available') ||
          normalizedMessage.includes('temporarily unavailable') ||
          normalizedMessage.includes('model is overloaded') ||
          normalizedMessage.includes('unavailable')
        ) {
          errorState = {
            title: "Gemini is not available right now",
            description: "Gemini servers are overloaded. Please restart your speech and try again in a few minutes.",
          };
        } else if (
          normalizedMessage.includes('limit exhausted') ||
          normalizedMessage.includes('rate limit') ||
          normalizedMessage.includes('429')
        ) {
          errorState = {
            title: "Gemini limit exhausted",
            description: "Gemini usage limit has been reached. Please wait a moment before restarting your speech.",
          };
        }
        
        resetSessionForRetry();
        resetRecorderComponent();
        setScoreData(null);
        setCurrentState("recording");
        setAnalysisError(errorState);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      console.warn('No valid transcript for AI analysis. Transcript:', transcript);
      
      const transcriptUnavailable = !transcript || transcript === "Transcription unavailable" || transcript.trim().length < 20;
      
      const errorState: AnalysisErrorState = transcriptUnavailable
        ? {
            title: "Recording Failed",
            description: "We could not capture your speech. Please check your microphone and restart your speech.",
          }
        : {
            title: "Transcript too short",
            description: "Speech recognition only captured a few words. Please restart your speech and try again.",
          };

      setScoreData(null);
      setCurrentState("recording");
      resetSessionForRetry();
      resetRecorderComponent();
      setAnalysisError(errorState);
    }
  };

  const handleApiKeySet = (apiKey: string) => {
    localStorage.setItem('gemini_api_key', apiKey);
    aiService.setApiKey(apiKey);
    
    // Continue with AI analysis if we have a pending recording
    if (sessionData?.audioBlob) {
      handleRecordingComplete(sessionData.audioBlob, "Transcript would be generated here");
    }
  };

  const handleTryAgain = () => {
    setAnalysisError(null);
    setScoreData(null);
    resetSessionForRetry();
    setCurrentState("recording");
  };

  const handleNewTopic = () => {
    // Generate new random motions
    const daily = getDailyMotion({ stanceOnly: true });
    const random = getRandomMotions(2, { stanceOnly: true });
    setMotions([daily, ...random]);
    setCurrentState("home");
    setSessionData(null);
    setScoreData(null);
    setAnalysisError(null);
  };

  const handleBackToHome = () => {
    setCurrentState("home");
    setSessionData(null);
    setScoreData(null);
    setAnalysisError(null);
  };

  if (currentState === "recording" && sessionData) {
    return (
      <div className="min-h-screen bg-speech-bg p-4 flex flex-col items-center">
        <div className="w-full max-w-5xl flex-1 flex flex-col items-center">
          {analysisError && (
            <div className="w-full max-w-3xl mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-5 shadow-lg">
              <p className="text-base font-semibold text-destructive-foreground">{analysisError.title}</p>
              <p className="text-sm text-destructive-foreground/80 mt-1">{analysisError.description}</p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button
                  onClick={handleRestartAfterError}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Restart Speech
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAnalysisError(null)}
                  className="border-destructive/40 text-destructive-foreground hover:bg-destructive/10"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
          <div className="flex-1 flex items-center justify-center w-full">
            <VoiceRecorder
              key={recorderResetCounter}
              motion={sessionData.motion}
              duration={sessionData.duration}
              stance={sessionData.stance}
              onRecordingComplete={handleRecordingComplete}
              onBack={handleBackToHome}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentState === "results" && sessionData && scoreData) {
    return (
      <div className="min-h-screen bg-speech-bg p-4 py-8">
        <ScoreDisplay
          motion={sessionData.motion}
          stance={sessionData.stance}
          score={scoreData.score}
          feedback={scoreData.feedback}
          transcript={scoreData.transcript}
          missingPoints={scoreData.missingPoints}
          enhancedArgument={scoreData.enhancedArgument}
          enhancedFeedback={scoreData.enhancedFeedback}
          onTryAgain={handleTryAgain}
          onNewTopic={handleNewTopic}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-speech-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* User Menu */}
        <div className="absolute top-6 right-6 z-10">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-white/80 text-sm">Welcome, {user.email}</span>
              <Link to="/progress">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:text-white hover:bg-white/20 flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  Progress
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/20 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign Out</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to sign out? You'll need to sign in again to access your progress and continue practicing.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={signOut}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <Link to="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/20 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Duolingo for Public Speaking</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Dialectica
          </h1>
          
          <p className="text-xl md:text-2xl mb-4 opacity-90">
            Speak. Score. Improve.
          </p>
          
          <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
            Master the art of debate and public speaking with AI-powered feedback. 
            Practice daily, track your progress, and become a confident speaker.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <Target className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Logic</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <Zap className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Rhetoric</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <Heart className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Empathy</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <Trophy className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Choose Your Challenge
          </h2>
          <p className="text-lg text-muted-foreground">
            Pick a topic and start speaking. Get scored on Logic, Rhetoric, Empathy, and Delivery.
          </p>
        </div>

        {/* Theme Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <label htmlFor="theme-filter" className="text-lg font-medium text-foreground">
              Filter by Theme:
            </label>
            <Select value={selectedTheme} onValueChange={setSelectedTheme}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTheme !== "All Themes" && (
              <span className="text-sm text-muted-foreground">
                ({filteredMotions.length} topic{filteredMotions.length !== 1 ? 's' : ''} found)
              </span>
            )}
          </div>
        </div>

        {/* Daily Motion Highlight */}
        {(selectedTheme === "All Themes" || dailyMotion.category === selectedTheme) && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-gradient-primary rounded-full animate-pulse"></div>
              <h3 className="text-xl font-semibold text-foreground">Today's Featured Topic</h3>
            </div>
            <MotionCard 
              motion={dailyMotion} 
              onStartSpeech={handleStartSpeech}
              isLoggedIn={!!user}
            />
          </div>
        )}

        {/* More Topics */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            {selectedTheme === "All Themes" ? "More Topics" : `${selectedTheme} Topics`}
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {(selectedTheme === "All Themes" 
              ? motions.slice(1) 
              : filteredMotions.filter(motion => motion.id !== dailyMotion.id)
            ).map((motion) => (
              <MotionCard 
                key={motion.id} 
                motion={motion} 
                onStartSpeech={handleStartSpeech}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        </div>

        {/* Refresh Topics */}
        <div className="text-center">
          <Button
            onClick={() => {
              const daily = getDailyMotion({ stanceOnly: true });
              const random = getRandomMotions(2, { stanceOnly: true });
              setMotions([daily, ...random]);
              setSelectedTheme("All Themes");
            }}
            variant="outline"
            className="font-medium"
          >
            🎲 Get New Topics
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid gap-6 md:grid-cols-3 mt-16">
          <Card className="bg-gradient-to-br from-speech-card to-speech-card/90 border-0 shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Quick Practice</h3>
              <p className="text-sm text-muted-foreground">
                60 or 90-second speeches with instant feedback. Perfect for daily practice.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-speech-card to-speech-card/90 border-0 shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI Scoring</h3>
              <p className="text-sm text-muted-foreground">
                Get detailed feedback on logic, rhetoric, empathy, and delivery.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-speech-card to-speech-card/90 border-0 shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-speech-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-speech-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Watch your scores improve over time and earn achievement badges.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onApiKeySet={handleApiKeySet}
        onClose={() => setShowApiKeyModal(false)}
      />

      {/* Loading Overlay for AI Analysis */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="bg-speech-card border-0 shadow-xl p-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-2">Analyzing Your Speech</h3>
                <p className="text-sm text-muted-foreground">AI is evaluating your logic, rhetoric, empathy, and delivery...</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;
