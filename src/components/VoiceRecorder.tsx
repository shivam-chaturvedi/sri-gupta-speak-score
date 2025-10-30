import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Play, Pause, RotateCcw, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  motion: {
    topic: string;
    category: string;
  };
  duration: number;
  stance?: string;
  onRecordingComplete: (audioBlob: Blob, transcript?: string) => void;
  onBack: () => void;
}

export function VoiceRecorder({ 
  motion, 
  duration, 
  stance, 
  onRecordingComplete, 
  onBack 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepTime, setPrepTime] = useState(10);
  const [recordTime, setRecordTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [showLoader, setShowLoader] = useState(false);
  const [recognitionTranscript, setRecognitionTranscript] = useState<string>("");
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef("");
  const recognitionTranscriptRef = useRef("");
  const currentTranscriptRef = useRef("");

  const updateTranscript = (value: string) => {
    transcriptRef.current = value;
    setTranscript(value);
  };

  const updateRecognitionTranscript = (value: string) => {
    recognitionTranscriptRef.current = value;
    setRecognitionTranscript(value);
  };

  const updateCurrentTranscript = (value: string) => {
    currentTranscriptRef.current = value;
    setCurrentTranscript(value);
  };

  const joinTranscript = (...parts: string[]) =>
    parts
      .map(part => part?.trim())
      .filter(Boolean)
      .join(" ");
  
  // Initialize Speech Recognition - matching VoiceAssistant pattern
  useEffect(() => {
    let recognitionInstance: any = null;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        updateCurrentTranscript("");
        console.log('Speech recognition started');
      };
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptChunk;
          } else {
            interimTranscript += transcriptChunk;
          }
        }
        
        updateCurrentTranscript(interimTranscript);
        
        if (finalTranscript) {
          const accumulatedFinal = joinTranscript(recognitionTranscriptRef.current, finalTranscript);
          updateRecognitionTranscript(accumulatedFinal);
          const displayValue = interimTranscript
            ? joinTranscript(accumulatedFinal, interimTranscript)
            : accumulatedFinal;
          updateTranscript(displayValue);
        } else if (interimTranscript) {
          const displayValue = joinTranscript(recognitionTranscriptRef.current, interimTranscript);
          updateTranscript(displayValue);
        } else if (recognitionTranscriptRef.current) {
          updateTranscript(recognitionTranscriptRef.current);
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          // Silent error handling - no toast
        }
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        updateCurrentTranscript("");
        if (recognitionTranscriptRef.current) {
          updateTranscript(recognitionTranscriptRef.current);
        }
        console.log('Speech recognition ended');
      };
      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  const startPrep = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted, stream active:', stream.active);
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      console.log('MediaRecorder created, state:', mediaRecorder.state);

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        console.log('MediaRecorder data available, size:', e.data.size);
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started successfully');
      };

      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped, chunks collected:', chunks.length);
        
        if (chunks.length === 0) {
          console.error('No audio data was recorded!');
          return;
        }
        
        const blob = new Blob(chunks, { type: 'audio/webm' });
        console.log('Audio blob created, size:', blob.size);
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setIsCompleted(true);
        stream.getTracks().forEach(track => track.stop());
        
        // Wait a bit more to ensure final results are captured
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Stop speech recognition and wait for it to finish
        if (recognition && isListening) {
          try {
            recognition.stop();
            // Wait for onend to fire
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (e) {
            console.log('Recognition already stopped');
          }
        }
        
        // Get the final transcript - use recognitionTranscript which has all final results
        let finalTranscript = recognitionTranscriptRef.current.trim();
        
        // If recognitionTranscript is empty, try transcript state
        if (!finalTranscript || finalTranscript.length === 0) {
          finalTranscript = transcriptRef.current.trim();
        }
        
        // Remove any error messages from transcript before checking
        const cleanTranscript = finalTranscript
          .replace(/Please speak clearly\. No transcript was captured\./g, '')
          .replace(/No transcript was captured/g, '')
          .trim();
        
        console.log('🔍 Transcript Debug:');
        console.log('  recognitionTranscript:', recognitionTranscriptRef.current);
        console.log('  transcript state:', transcriptRef.current);
        console.log('  currentTranscript:', currentTranscriptRef.current);
        console.log('  cleanTranscript:', cleanTranscript);
        
        // If we have a valid transcript (not empty and not error message)
        // Only set error message if we truly have NO transcript at all
        if (cleanTranscript && cleanTranscript.length > 0) {
          updateTranscript(cleanTranscript);
          console.log('✅ Transcript captured successfully:', cleanTranscript.substring(0, 100));
        } else if (recognitionTranscriptRef.current.trim().length > 0) {
          // Double check - if recognitionTranscript has content, use it
          updateTranscript(recognitionTranscriptRef.current.trim());
          console.log('✅ Using recognitionTranscript:', recognitionTranscriptRef.current.trim().substring(0, 100));
        } else if (transcriptRef.current.trim().length > 0 && !transcriptRef.current.includes("No transcript")) {
          // Triple check - if current transcript state has content, use it
          updateTranscript(transcriptRef.current.trim());
          console.log('✅ Using current transcript state:', transcriptRef.current.trim().substring(0, 100));
        } else {
          console.warn('❌ No valid transcript found after all checks');
          // Only set error message if absolutely nothing was captured
          updateTranscript("Please speak clearly. No transcript was captured.");
        }
      };

      // Start speech recognition when recording starts - exactly like VoiceAssistant
      if (recognition && !isListening) {
        try {
          updateRecognitionTranscript("");
          updateTranscript("");
          updateCurrentTranscript("");
          recognition.start();
          console.log('Speech recognition started');
        } catch (error) {
          console.log('Speech recognition start error:', error);
          // Try to restart if already started
          if (recognition) {
            try {
              recognition.stop();
              setTimeout(() => recognition.start(), 100);
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }
      }

      setIsPreparing(true);
      setPrepTime(10);

      prepTimerRef.current = setInterval(() => {
        setPrepTime(prev => {
          if (prev <= 1) {
            setIsPreparing(false);
            setIsRecording(true);
            setRecordTime(0);
            
            // Ensure speech recognition is running before starting media recorder
            if (recognition && !isListening) {
              try {
                recognition.start();
                console.log('Speech recognition started at recording start');
              } catch (e) {
                console.log('Recognition start error (may already be running):', e);
              }
            }
            
            mediaRecorder.start();
            
            recordTimerRef.current = setInterval(() => {
              setRecordTime(prev => {
                if (prev >= duration - 1) {
                  console.log('Recording time completed, stopping...');
                  mediaRecorder.stop();
                  setIsRecording(false);
                  // Don't stop speech recognition here - let onstop handler do it
                  return duration;
                }
                return prev + 1;
              });
            }, 1000);

            if (prepTimerRef.current) clearInterval(prepTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record your speech.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      // Speech recognition will be stopped in the onstop handler
    }
  };

  const playAudio = async () => {
    if (!audioRef.current || !audioUrl) {
      toast({
        title: "No audio available",
        description: "Please record audio first.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      } else {
        // Ensure audio is loaded
        if (audioRef.current.readyState < 2) {
          await new Promise((resolve) => {
            audioRef.current!.onloadeddata = resolve;
          });
        }
        
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      toast({
        title: "Playback failed",
        description: "Could not play audio. Try recording again.",
        variant: "destructive",
      });
    }
  };

  const reset = () => {
    setIsRecording(false);
    setIsPreparing(false);
    setPrepTime(10);
    setRecordTime(0);
    setIsPlaying(false);
    setAudioBlob(null);
    setAudioUrl("");
    setIsCompleted(false);
    setShowLoader(false);
    updateTranscript("");
    updateRecognitionTranscript("");
    updateCurrentTranscript("");
    
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (audioRef.current) audioRef.current.pause();
  };

  // Removed startTranscription - now handled directly in onstop

  const submitRecording = () => {
    if (audioBlob) {
      setShowLoader(true);
      
      // Use the best available transcript - prioritize recognitionTranscript (final results)
      let finalTranscript = recognitionTranscriptRef.current.trim();
      
      // Fallback to transcript state if recognitionTranscript is empty
      if (!finalTranscript || finalTranscript.length === 0) {
        finalTranscript = transcriptRef.current.trim();
      }
      
      // Clean any error messages from transcript
      const cleanedForSubmit = finalTranscript
        .replace(/Please speak clearly\. No transcript was captured\./g, '')
        .replace(/No transcript was captured/g, '')
        .replace(/please speak clearly/gi, '')
        .trim();
      
      console.log('📤 Submitting recording:');
      console.log('  Original transcript:', finalTranscript.substring(0, 100));
      console.log('  Cleaned transcript:', cleanedForSubmit.substring(0, 100));
      
      // Only submit if we have a valid transcript (not error message)
      if (cleanedForSubmit && cleanedForSubmit.length > 0) {
        onRecordingComplete(audioBlob, cleanedForSubmit);
      } else {
        console.warn('⚠️ No valid transcript to submit - will show error');
        onRecordingComplete(audioBlob, undefined);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  const getProgressPercentage = () => {
    if (isPreparing) return ((10 - prepTime) / 10) * 100;
    if (isRecording || isCompleted) return (recordTime / duration) * 100;
    return 0;
  };

  const getStatusText = () => {
    if (isPreparing) return `Get ready... ${prepTime}s`;
    if (isRecording) return `Recording... ${duration - recordTime}s left`;
    if (isCompleted) return "Recording complete!";
    return "Ready to record";
  };

  const trimmedTranscript = transcript.trim();
  const trimmedCurrentTranscript = currentTranscript.trim();
  const displayTranscript = trimmedTranscript.length > 0 ? transcript : currentTranscript;
  const hasTranscript = trimmedTranscript.length > 0 || trimmedCurrentTranscript.length > 0;

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-speech-card to-speech-card/90 border-0 shadow-speech">
      <CardHeader className="pb-4">
        <div className="text-center space-y-2">
          <CardTitle className="text-lg font-bold text-foreground">
            {motion.topic}
          </CardTitle>
          {stance && (
            <div className="inline-block px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
              Arguing {stance === "for" ? "FOR" : "AGAINST"}
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {duration} seconds • {motion.category}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{getStatusText()}</span>
            <span className="text-muted-foreground">
              {isRecording || isCompleted ? `${recordTime}s` : ""}
            </span>
          </div>
          <Progress 
            value={getProgressPercentage()} 
            className="h-2"
          />
        </div>

        {/* Recording Visual */}
        <div className="flex justify-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording 
              ? "bg-destructive animate-pulse shadow-glow" 
              : isPreparing 
                ? "bg-warning animate-pulse" 
                : isCompleted
                  ? "bg-success"
                  : "bg-muted"
          }`}>
            {isCompleted ? (
              <CheckCircle className="w-10 h-10 text-success-foreground" />
            ) : (
              <Mic className={`w-10 h-10 ${
                isRecording || isPreparing ? "text-white" : "text-muted-foreground"
              }`} />
            )}
          </div>
        </div>

        {/* Transcript Display */}
        {hasTranscript && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                {isCompleted ? "Transcript" : "Live transcript"}
              </span>
              {!isCompleted && (
                <span className="text-xs text-muted-foreground">Updating in real time</span>
              )}
            </div>
            <div
              className="p-3 bg-speech-card rounded-lg border border-border text-sm text-foreground max-h-40 overflow-y-auto whitespace-pre-wrap"
              role="status"
              aria-live="polite"
            >
              {displayTranscript}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3">
          {!isCompleted && !isRecording && !isPreparing && (
            <Button
              onClick={startPrep}
              className="w-full bg-gradient-primary hover:opacity-90 border-0 text-white font-semibold py-3 h-12"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="w-full font-semibold py-3 h-12"
            >
              <MicOff className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          )}

          {isCompleted && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={playAudio}
                  variant="outline"
                  className="font-medium"
                >
                  {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button
                  onClick={reset}
                  variant="outline"
                  className="font-medium"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              </div>
              
              {!showLoader ? (
                <Button
                  onClick={submitRecording}
                  className="w-full bg-gradient-success hover:opacity-90 border-0 text-white font-semibold py-3 h-12"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Get My Score
                </Button>
              ) : (
                <Button
                  disabled
                  className="w-full bg-gradient-success hover:opacity-90 border-0 text-white font-semibold py-3 h-12"
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </Button>
              )}
            </div>
          )}

          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full"
            disabled={isRecording || isPreparing}
          >
            Back to Topics
          </Button>
        </div>

        {/* Hidden Audio Element */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onError={(e) => {
              console.error('Audio element error:', e);
              toast({
                title: "Audio error",
                description: "Error loading audio file.",
                variant: "destructive",
              });
            }}
            className="hidden"
          />
        )}
      </CardContent>
    </Card>
  );
}
