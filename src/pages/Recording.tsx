import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import type { Motion } from "@/data/motions";
import { generateMockScore } from "@/utils/mockScoring";
import { aiService } from "@/services/aiService";
import { toast } from "@/hooks/use-toast";

const Recording = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get motion, duration, and stance from navigation state
  const motion: Motion = location.state?.motion;
  const duration: number = location.state?.duration || 60;
  const stance: string | undefined = location.state?.stance;
  
  const [scoreData, setScoreData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Redirect to home if no motion data
  if (!motion) {
    navigate("/");
    return null;
  }

  const handleRecordingComplete = async (audioBlob: Blob, transcript?: string) => {
    console.log('📥 Recording complete. Transcript received:', transcript);
    console.log('📏 Transcript length:', transcript?.length || 0);
    console.log('📝 Transcript content:', transcript?.substring(0, 200));
    
    // Clean transcript - remove error messages
    const cleanTranscript = transcript?.trim()
      .replace(/Please speak clearly\. No transcript was captured\./g, '')
      .replace(/No transcript was captured/g, '')
      .replace(/please speak clearly/gi, '')
      .trim() || '';
    
    console.log('✨ Clean transcript:', cleanTranscript);
    console.log('✨ Clean transcript length:', cleanTranscript.length);
    
    // AI analysis - require minimum transcript length
    if (cleanTranscript && cleanTranscript.length > 20 && 
        !cleanTranscript.includes("Speech recorded successfully")) {
      setIsAnalyzing(true);
      try {
        console.log('🤖 Starting AI analysis with clean transcript:', cleanTranscript.substring(0, 100));
        const results = await aiService.analyzeSpeeches({
          transcript: cleanTranscript,
          topic: motion.topic,
          stance: stance,
          duration: duration
        });
        console.log('✅ AI analysis successful');
        
        // Ensure transcript is in results object
        const resultsWithTranscript = {
          ...results,
          transcript: cleanTranscript
        };
        
        setScoreData(resultsWithTranscript);
        navigate("/results", { 
          state: { 
            motion, 
            stance, 
            results: resultsWithTranscript,
            transcript: cleanTranscript 
          }
        });
      } catch (error) {
        console.error('AI analysis failed:', error);
        toast({
          title: "AI Analysis Failed",
          description: error instanceof Error ? error.message : "Falling back to demo mode.",
          variant: "destructive",
        });
        
        // Fallback to mock scoring
        const results = generateMockScore(audioBlob, motion.topic, stance, cleanTranscript);
        setScoreData(results);
        navigate("/results", { 
          state: { 
            motion, 
            stance, 
            results: {
              ...results,
              transcript: cleanTranscript
            },
            transcript: cleanTranscript 
          }
        });
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      console.warn('No valid transcript for AI analysis. Transcript:', transcript);
      
      // Check if transcript is unavailable or empty (using cleanTranscript)
      const transcriptUnavailable = !cleanTranscript || cleanTranscript.length < 20;
      
      if (transcriptUnavailable) {
        toast({
          title: "Recording Failed",
          description: "Could not capture speech. Please check your microphone and try again.",
          variant: "destructive",
        });
        
        // Don't navigate to results
        return;
      }
      
      // If there's some text but it's limited, show a warning but still proceed
      if (cleanTranscript && cleanTranscript.length > 0) {
        toast({
          title: "Limited transcript",
          description: "Speech recognition captured limited text. Using demo analysis.",
          variant: "destructive",
        });
        // Fallback to mock scoring if limited transcript
        const results = generateMockScore(audioBlob, motion.topic, stance, cleanTranscript);
        setScoreData(results);
        navigate("/results", { 
          state: { 
            motion, 
            stance, 
            results: {
              ...results,
              transcript: cleanTranscript
            },
            transcript: cleanTranscript 
          }
        });
      }
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-speech-bg p-4 flex items-center justify-center">
      <VoiceRecorder
        motion={motion}
        duration={duration}
        stance={stance}
        onRecordingComplete={handleRecordingComplete}
        onBack={handleBack}
      />
      
      {/* Loading Overlay for AI Analysis */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-speech-card border-0 shadow-xl p-8 rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-2">Analyzing Your Speech</h3>
                <p className="text-sm text-muted-foreground">AI is evaluating your logic, rhetoric, empathy, and delivery...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recording;

