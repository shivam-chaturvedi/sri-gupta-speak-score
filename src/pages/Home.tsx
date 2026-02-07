import { useState, useEffect } from "react";
import { Mic, Target, Trophy, Zap, Heart, Sparkles, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MotionCard } from "@/components/MotionCard";
import { getDailyMotion, getRandomMotions, motions as allMotionsData, type Motion } from "@/data/motions";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
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

const Home = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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

  const handleStartSpeech = (motion: Motion, duration: number, stance?: string) => {
    // Navigate to recording page with state
    navigate("/recording", { 
      state: { motion, duration, stance }
    });
  };

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
              <Link to="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:text-white hover:bg-white/20 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Profile
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
            Dialecta
          </h1>
          
          <p className="text-xl md:text-2xl mb-4 opacity-90">
            Your go-to preparation for intellectual interviews and dialogue portfolios
          </p>
          
          <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
            Master the art of debate and public speaking with AI-powered feedback - perfect for Schoolhouse dialogues and intellectual interviews. Practice daily, track your progress, and become a confident, quick-thinking speaker.
          </p>
          
          {/* 5-Step Process Flowchart */}
          <div className="max-w-4xl mx-auto mb-12 mt-12">
            <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg mb-3">1</div>
                <Target className="w-8 h-8 mb-2 text-white" />
                <span className="text-sm font-medium text-center">Choose a topic</span>
              </div>
              <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg mb-3">2</div>
                <Mic className="w-8 h-8 mb-2 text-white" />
                <span className="text-sm font-medium text-center">Record your argument</span>
              </div>
              <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg mb-3">3</div>
                <Sparkles className="w-8 h-8 mb-2 text-white" />
                <span className="text-sm font-medium text-center">Let AI analyse your Point of view</span>
              </div>
              <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg mb-3">4</div>
                <Zap className="w-8 h-8 mb-2 text-white" />
                <span className="text-sm font-medium text-center">Generate detailed feedback</span>
              </div>
              <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg mb-3">5</div>
                <Trophy className="w-8 h-8 mb-2 text-white" />
                <span className="text-sm font-medium text-center">Track your progress and improve your skills</span>
              </div>
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="max-w-4xl mx-auto mt-16 mb-8">
            <h2 className="text-2xl font-bold mb-8 text-center">What Students Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-sm mb-3 italic">"Dialecta helped me prepare for my Schoolhouse interview. The AI feedback on logical structure was incredibly detailed and actionable."</p>
                <p className="text-xs opacity-80">- Student preparing for intellectual interviews</p>
              </div>
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-sm mb-3 italic">"The practice sessions improved my ability to think on my feet and articulate complex ideas clearly. Perfect for dialogue portfolios!"</p>
                <p className="text-xs opacity-80">- Student building dialogue portfolio</p>
              </div>
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-sm mb-3 italic">"I love how the feedback focuses on logical reasoning rather than just facts. It's made me a much stronger debater."</p>
                <p className="text-xs opacity-80">- Competitive debater</p>
              </div>
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
    </div>
  );
};

export default Home;
