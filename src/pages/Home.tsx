import { useState, useEffect } from "react";
import { Mic, Target, Trophy, Zap, Heart, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MotionCard } from "@/components/MotionCard";
import { getDailyMotion, getRandomMotions, motions as allMotionsData, type Motion } from "@/data/motions";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState<string>("All Themes");
  const [motions, setMotions] = useState(() => {
    const daily = getDailyMotion();
    const random = getRandomMotions(2);
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
              <Button
                onClick={signOut}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/20"
              >
                Sign Out
              </Button>
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
              />
            ))}
          </div>
        </div>

        {/* Refresh Topics */}
        <div className="text-center">
          <Button
            onClick={() => {
              const daily = getDailyMotion();
              const random = getRandomMotions(2);
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

