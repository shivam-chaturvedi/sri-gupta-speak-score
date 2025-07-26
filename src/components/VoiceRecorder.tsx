import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Play, Pause, RotateCcw, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { speechToText } from "@/services/speechToText";
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
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startPrep = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, creating blob...');
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setIsCompleted(true);
        stream.getTracks().forEach(track => track.stop());
        
        // Start transcription
        await startTranscription();
      };

      // Start speech recognition when we start preparation
      if (speechToText.isSupported()) {
        console.log('Starting speech recognition...');
        try {
          await speechToText.startListening(
            (transcript) => {
              // Real-time transcript updates during recording
              console.log('Real-time transcript update:', transcript);
            },
            (error) => {
              console.error('Speech recognition error:', error);
            }
          );
          console.log('Speech recognition started successfully');
        } catch (error) {
          console.error('Failed to start speech recognition:', error);
        }
      } else {
        console.log('Speech recognition not supported');
      }

      setIsPreparing(true);
      setPrepTime(10);

      prepTimerRef.current = setInterval(() => {
        setPrepTime(prev => {
          if (prev <= 1) {
            setIsPreparing(false);
            setIsRecording(true);
            setRecordTime(0);
            mediaRecorder.start();
            
            recordTimerRef.current = setInterval(() => {
              setRecordTime(prev => {
                if (prev >= duration - 1) {
                  console.log('Recording time completed, stopping...');
                  mediaRecorder.stop();
                  setIsRecording(false);
                  // Stop speech recognition when recording stops
                  if (speechToText.isSupported()) {
                    console.log('Stopping speech recognition...');
                    const finalTranscript = speechToText.stopListening();
                    console.log('Speech recognition stopped, final transcript:', finalTranscript);
                  }
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
      // Stop speech recognition when manually stopping
      if (speechToText.isSupported()) {
        speechToText.stopListening();
      }
    }
  };

  const playAudio = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Audio play failed:', error);
        toast({
          title: "Audio playback failed",
          description: "Could not play the recorded audio.",
          variant: "destructive",
        });
      }
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
    
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (audioRef.current) audioRef.current.pause();
  };

  const startTranscription = async () => {
    console.log('Starting transcription...');
    console.log('Speech recognition supported:', speechToText.isSupported());
    
    if (!speechToText.isSupported()) {
      toast({
        title: "Speech recognition not supported",
        description: "Your browser doesn't support speech recognition. Analysis will use recorded audio only.",
        variant: "destructive",
      });
      setTranscript("Speech recognition not available - using audio recording for analysis");
      return;
    }

    setIsTranscribing(true);
    
    try {
      // Use the speechToText service to transcribe the recording
      const finalTranscript = speechToText.getTranscript();
      console.log('Final transcript from speechToText:', finalTranscript);
      console.log('Transcript length:', finalTranscript?.length || 0);
      
      if (finalTranscript && finalTranscript.length > 10) {
        setTranscript(finalTranscript);
        console.log('Setting transcript:', finalTranscript);
        toast({
          title: "Speech transcribed",
          description: "Your speech has been converted to text for AI analysis.",
        });
      } else {
        // For now, let's use a fallback transcript to test AI analysis
        const fallbackTranscript = "This is a test speech about artificial intelligence and human creativity. AI has made remarkable progress in recent years, from generating art to composing music. However, human creativity still has unique qualities that are difficult to replicate.";
        console.log('Using fallback transcript for testing');
        setTranscript(fallbackTranscript);
        toast({
          title: "Using test transcript",
          description: "Speech detection had issues, using sample text for AI analysis demo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Transcription failed:', error);
      setTranscript("Transcription failed - analysis will use basic audio characteristics");
      toast({
        title: "Transcription failed",
        description: "Could not transcribe your speech. AI analysis may be limited.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const submitRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, transcript);
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
              
              <Button
                onClick={submitRecording}
                className="w-full bg-gradient-success hover:opacity-90 border-0 text-white font-semibold py-3 h-12"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Get My Score
              </Button>
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
            className="hidden"
          />
        )}
      </CardContent>
    </Card>
  );
}