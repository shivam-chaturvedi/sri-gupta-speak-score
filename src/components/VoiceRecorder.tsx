import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Play, Pause, RotateCcw, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { transcribeWithAssemblyAI, isAssemblyAIAvailable } from "@/services/assemblyAITranscription";

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
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [usingAssemblyAIFallback, setUsingAssemblyAIFallback] = useState(false);
  const [showTranscribeButton, setShowTranscribeButton] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef("");
  const recognitionTranscriptRef = useRef("");
  const currentTranscriptRef = useRef("");
  const isRecordingRef = useRef(false);

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
  
  // Check browser support for speech recognition
  useEffect(() => {
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setSpeechRecognitionSupported(isSupported);
    
    if (!isSupported) {
      console.warn('Browser speech recognition not supported - will use AssemblyAI fallback');
      // Always set fallback if webkit is not available
      setUsingAssemblyAIFallback(true);
      // Check AssemblyAI availability
      const assemblyAIAvailable = isAssemblyAIAvailable();
      if (assemblyAIAvailable) {
        toast({
          title: "Using AssemblyAI Transcription",
          description: "Your browser doesn't support native speech recognition. Audio will be transcribed using AssemblyAI after recording.",
          variant: "default",
        });
      } else {
        toast({
          title: "Transcription Limited",
          description: "Your browser doesn't support speech recognition. Audio will be recorded but transcription may not be available.",
          variant: "default",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        console.log('✅ Speech recognition started successfully');
        setPermissionChecked(true);
      };
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result && result[0]) {
            const transcriptChunk = result[0].transcript;
            if (result.isFinal) {
              finalTranscript += transcriptChunk + ' ';
            } else {
              interimTranscript += transcriptChunk;
            }
          }
        }
        
        // Update current interim transcript
        if (interimTranscript) {
          updateCurrentTranscript(interimTranscript);
        }
        
        // Process final results
        if (finalTranscript.trim()) {
          const accumulatedFinal = joinTranscript(recognitionTranscriptRef.current, finalTranscript.trim());
          updateRecognitionTranscript(accumulatedFinal);
          console.log('✅ Final transcript chunk captured:', finalTranscript.trim());
          console.log('📝 Accumulated final transcript:', accumulatedFinal);
        }
        
        // Update display transcript (final + interim)
        const displayValue = interimTranscript
          ? joinTranscript(recognitionTranscriptRef.current, interimTranscript)
          : recognitionTranscriptRef.current;
        updateTranscript(displayValue);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          console.error('Microphone permission denied for speech recognition');
          setUsingAssemblyAIFallback(true); // Use AssemblyAI as fallback
          toast({
            title: "Using AssemblyAI Fallback",
            description: "Microphone permission denied for live transcription. Will use AssemblyAI to transcribe after recording.",
            variant: "default",
          });
          setPermissionChecked(true);
        } else if (event.error === 'no-speech') {
          console.log('No speech detected (this is normal during pauses)');
        } else if (event.error === 'aborted') {
          console.log('Speech recognition aborted');
          // If aborted and we don't have transcript, use AssemblyAI
          if (!recognitionTranscriptRef.current.trim()) {
            setUsingAssemblyAIFallback(true);
          }
        } else if (event.error === 'network') {
          setUsingAssemblyAIFallback(true); // Use AssemblyAI as fallback
          toast({
            title: "Using AssemblyAI Fallback",
            description: "Network error with speech recognition. Will use AssemblyAI to transcribe after recording.",
            variant: "default",
          });
        } else if (event.error === 'service-not-allowed') {
          setUsingAssemblyAIFallback(true); // Use AssemblyAI as fallback
          toast({
            title: "Using AssemblyAI Fallback",
            description: "Speech recognition service not available. Will use AssemblyAI to transcribe after recording.",
            variant: "default",
          });
        } else {
          console.error('Speech recognition error:', event.error);
          // For other errors, enable AssemblyAI fallback
          setUsingAssemblyAIFallback(true);
          toast({
            title: "Using AssemblyAI Fallback",
            description: `Speech recognition error: ${event.error}. Will use AssemblyAI to transcribe after recording.`,
            variant: "default",
          });
        }
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        updateCurrentTranscript("");
        const finalTranscript = recognitionTranscriptRef.current.trim();
        if (finalTranscript) {
          updateTranscript(finalTranscript);
          console.log('✅ Speech recognition ended. Final transcript:', finalTranscript.substring(0, 100));
        }
        console.log('Speech recognition ended');
        
        // Auto-restart if we're still recording (to handle browser auto-stop)
        if (isRecordingRef.current && recognitionInstance) {
          try {
            setTimeout(() => {
              if (isRecordingRef.current && recognitionInstance) {
                recognitionInstance.start();
                console.log('🔄 Auto-restarted speech recognition');
              }
            }, 100);
          } catch (e) {
            console.log('Could not auto-restart recognition:', e);
          }
        }
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

  // Handle transcription button click
  const handleTranscribe = async () => {
    if (!audioBlob) {
      toast({
        title: "No Audio",
        description: "Please record audio first.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🔄 Starting transcription with AssemblyAI...');
      setIsTranscribing(true);
      setShowTranscribeButton(false);
      updateTranscript("Transcribing audio with AssemblyAI... Please wait.");
      
      const transcript = await transcribeWithAssemblyAI(audioBlob);
      
      if (transcript && transcript.trim().length > 0) {
        updateTranscript(transcript);
        updateRecognitionTranscript(transcript);
        console.log('✅ AssemblyAI transcription successful, length:', transcript.length);
        toast({
          title: "Transcription Complete",
          description: "Your speech has been transcribed successfully.",
          variant: "default",
        });
      } else {
        throw new Error('No transcript returned from AssemblyAI');
      }
    } catch (error: any) {
      console.error('❌ AssemblyAI transcription failed:', error);
      const errorMessage = error?.message || 'Unknown error';
      updateTranscript("Transcription failed. Please try again.");
      toast({
        title: "Transcription Failed",
        description: `Could not transcribe audio: ${errorMessage}`,
        variant: "destructive",
      });
      setShowTranscribeButton(true); // Show button again to retry
    } finally {
      setIsTranscribing(false);
    }
  };

  // Request speech recognition permission explicitly
  const requestSpeechRecognitionPermission = async (): Promise<boolean> => {
    if (!speechRecognitionSupported || !recognition) {
      return false;
    }

    try {
      // Try to start recognition briefly to trigger permission request
      // This must be done in response to user gesture
      recognition.start();
      // Immediately stop it - we just want to trigger the permission prompt
      await new Promise(resolve => setTimeout(resolve, 100));
      recognition.stop();
      return true;
    } catch (error: any) {
      console.log('Speech recognition permission check:', error);
      // If it's a permission error, we'll handle it in onerror
      if (error.name === 'NotAllowedError' || error.message?.includes('not-allowed')) {
        toast({
          title: "Speech Recognition Permission Required",
          description: "Please allow microphone access for speech transcription. Your browser will ask for permission.",
          variant: "destructive",
        });
        return false;
      }
      // Other errors might be okay (like already started)
      return true;
    }
  };

  const startPrep = async () => {
    try {
      console.log('Requesting microphone access for recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted for recording, stream active:', stream.active);
      
      // Request speech recognition permission separately
      if (speechRecognitionSupported && recognition) {
        console.log('Requesting speech recognition permission...');
        await requestSpeechRecognitionPermission();
      }
      
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
        
        // If we have a transcript from browser speech recognition, use it
        if (cleanTranscript && cleanTranscript.length > 0) {
          updateTranscript(cleanTranscript);
          console.log('✅ Browser transcript captured successfully:', cleanTranscript.substring(0, 100));
        } else if (recognitionTranscriptRef.current.trim().length > 0) {
          // Double check - if recognitionTranscript has content, use it
          updateTranscript(recognitionTranscriptRef.current.trim());
          console.log('✅ Using recognitionTranscript:', recognitionTranscriptRef.current.trim().substring(0, 100));
        } else if (transcriptRef.current.trim().length > 0 && !transcriptRef.current.includes("No transcript")) {
          // Triple check - if current transcript state has content, use it
          updateTranscript(transcriptRef.current.trim());
          console.log('✅ Using current transcript state:', transcriptRef.current.trim().substring(0, 100));
        } else {
          // Webkit speech recognition FAILED (no transcript) - show transcribe button to use AssemblyAI
          // Only show button if webkit was attempted (supported) but failed, OR if webkit is not supported
          const webkitWasAttempted = speechRecognitionSupported && (recognition || isListening);
          const webkitNotSupported = !speechRecognitionSupported;
          
          if (webkitWasAttempted || webkitNotSupported) {
            console.log('📝 Webkit speech recognition failed or not supported, showing transcribe button for AssemblyAI');
            setShowTranscribeButton(true);
            setUsingAssemblyAIFallback(true);
            updateTranscript(""); // Clear any error messages
          } else {
            console.log('⚠️ No transcript but webkit status unclear');
            updateTranscript("No transcript captured. Please try recording again.");
          }
        }
      };

      // Start speech recognition when recording starts
      if (recognition && !isListening && speechRecognitionSupported) {
        try {
          updateRecognitionTranscript("");
          updateTranscript("");
          updateCurrentTranscript("");
          recognition.start();
          console.log('✅ Speech recognition started for transcription');
        } catch (error: any) {
          console.error('Speech recognition start error:', error);
          if (error.name === 'NotAllowedError' || error.message?.includes('not-allowed')) {
            toast({
              title: "Transcription Permission Denied",
              description: "Microphone permission for transcription was denied. Audio will be recorded, but transcription may not work. Please allow microphone access in your browser settings.",
              variant: "destructive",
            });
            // Will use AssemblyAI fallback after recording
            if (isAssemblyAIAvailable()) {
              setUsingAssemblyAIFallback(true);
              console.log('🔄 Will use AssemblyAI fallback for transcription');
            }
          } else {
            // Try to restart if already started
            if (recognition) {
              try {
                recognition.stop();
                setTimeout(() => {
                  if (recognition) {
                    recognition.start();
                    console.log('🔄 Restarted speech recognition');
                  }
                }, 100);
              } catch (e) {
                console.error('Failed to restart recognition:', e);
              }
            }
          }
        }
      } else if (!speechRecognitionSupported) {
        // Will use AssemblyAI fallback after recording
        if (isAssemblyAIAvailable()) {
          setUsingAssemblyAIFallback(true);
          console.log('🔄 Will use AssemblyAI fallback for transcription');
        } else {
          toast({
            title: "Transcription Not Available",
            description: "Speech recognition is not supported in your browser. Audio will be recorded but transcription may not be available.",
            variant: "default",
          });
        }
      }

      setIsPreparing(true);
      setPrepTime(10);

      prepTimerRef.current = setInterval(() => {
        setPrepTime(prev => {
          if (prev <= 1) {
            setIsPreparing(false);
            setIsRecording(true);
            isRecordingRef.current = true;
            setRecordTime(0);
            
            // Ensure speech recognition is running before starting media recorder
            if (recognition && !isListening && speechRecognitionSupported) {
              try {
                recognition.start();
                console.log('Speech recognition started at recording start');
              } catch (e) {
                console.log('Recognition start error (may already be running):', e);
              }
            }
            // Note: AssemblyAI will be used after recording stops if needed
            
            mediaRecorder.start();
            
            recordTimerRef.current = setInterval(() => {
              setRecordTime(prev => {
                if (prev >= duration - 1) {
                  console.log('Recording time completed, stopping...');
                  mediaRecorder.stop();
                  setIsRecording(false);
                  isRecordingRef.current = false;
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
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      let errorMessage = "Please allow microphone access to record your speech.";
      
      if (error.name === 'NotAllowedError' || error.message?.includes('not-allowed')) {
        errorMessage = "Microphone permission was denied. Please click the microphone icon in your browser's address bar and allow access, then try again.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No microphone found. Please connect a microphone and try again.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Microphone is being used by another application. Please close other apps using the microphone and try again.";
      }
      
      toast({
        title: "Microphone Access Required",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
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
    isRecordingRef.current = false;
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
    setShowTranscribeButton(false);
    
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (audioRef.current) audioRef.current.pause();
  };

  // Removed startTranscription - now handled directly in onstop

  const submitRecording = async () => {
    if (audioBlob) {
      setShowLoader(true);
      
      // If still transcribing, wait a bit and try to get the transcript
      if (isTranscribing) {
        toast({
          title: "Please Wait",
          description: "Transcription is still in progress. Please wait a moment...",
          variant: "default",
        });
        
        // Wait up to 10 seconds for transcription to complete
        let waitCount = 0;
        while (isTranscribing && waitCount < 20) {
          await new Promise(resolve => setTimeout(resolve, 500));
          waitCount++;
        }
      }
      
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
        .replace(/Transcribing audio\.\.\. Please wait\./g, '')
        .replace(/Transcription.*?\./g, '')
        .trim();
      
      console.log('📤 Submitting recording:');
      console.log('  Original transcript:', finalTranscript.substring(0, 100));
      console.log('  Cleaned transcript:', cleanedForSubmit.substring(0, 100));
      console.log('  Is transcribing:', isTranscribing);
      
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
        {(hasTranscript || isTranscribing) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                {isTranscribing 
                  ? "Transcribing..." 
                  : isCompleted 
                    ? "Transcript" 
                    : "Live transcript"}
              </span>
              {!isCompleted && !isTranscribing && (
                <span className="text-xs text-muted-foreground">
                  {usingAssemblyAIFallback ? "Will transcribe with AssemblyAI after recording" : "Updating in real time"}
                </span>
              )}
              {isTranscribing && (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              )}
            </div>
            <div
              className="p-3 bg-speech-card rounded-lg border border-border text-sm text-foreground max-h-40 overflow-y-auto whitespace-pre-wrap"
              role="status"
              aria-live="polite"
            >
              {isTranscribing ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transcribing your speech using AssemblyAI...</span>
                </div>
              ) : (
                displayTranscript
              )}
            </div>
            {showTranscribeButton && !isTranscribing && (
              <p className="text-xs text-muted-foreground">
                ℹ️ Click "Transcribe" button to transcribe your audio using AssemblyAI
              </p>
            )}
            {usingAssemblyAIFallback && !isTranscribing && !showTranscribeButton && (
              <p className="text-xs text-muted-foreground">
                ℹ️ Using AssemblyAI for transcription (browser speech recognition not available)
              </p>
            )}
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
              
              {/* Show Transcribe button if no transcript and not currently transcribing */}
              {showTranscribeButton && !isTranscribing && (
                <Button
                  onClick={handleTranscribe}
                  className="w-full bg-gradient-primary hover:opacity-90 border-0 text-white font-semibold py-3 h-12"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Transcribe
                </Button>
              )}
              
              {/* Show loader while transcribing */}
              {isTranscribing && (
                <Button
                  disabled
                  className="w-full bg-gradient-primary hover:opacity-90 border-0 text-white font-semibold py-3 h-12"
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Transcribing...
                </Button>
              )}
              
              {/* Show Get My Score button only if we have a transcript */}
              {!showTranscribeButton && !isTranscribing && transcript.trim().length > 0 && (
                !showLoader ? (
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
                )
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
