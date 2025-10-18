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
        
        // Stop speech recognition and get final transcript
        let finalTranscript = '';
        if (speechToText.isSupported()) {
          console.log('Stopping speech recognition...');
          finalTranscript = speechToText.stopListening();
          console.log('Final transcript:', finalTranscript);
        }
        
        if (chunks.length === 0) {
          console.error('No audio data was recorded!');
          toast({
            title: "Recording failed",
            description: "No audio data was captured. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        const blob = new Blob(chunks, { type: 'audio/webm' });
        console.log('Audio blob created, size:', blob.size);
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setIsCompleted(true);
        stream.getTracks().forEach(track => track.stop());
        
        // Use browser transcript
        if (finalTranscript && finalTranscript.length > 0) {
          setTranscript(finalTranscript);
          console.log('Transcription successful:', finalTranscript);
          toast({
            title: "Speech transcribed",
            description: `Successfully transcribed ${finalTranscript.split(' ').length} words.`,
          });
        } else {
          toast({
            title: "Transcription unavailable",
            description: "Could not transcribe speech. Analysis will be limited.",
            variant: "destructive",
          });
          setTranscript("Transcription unavailable");
        }
      };

      // Start speech recognition when we start preparation
      if (speechToText.isSupported()) {
        console.log('Starting speech recognition...');
        try {
          await speechToText.startListening(
            (transcript) => {
              // Real-time transcript updates during recording
              console.log('Real-time transcript update:', transcript);
              // Update transcript in real-time so user can see progress
              setTranscript(transcript);
            },
            (error) => {
              console.error('Speech recognition error:', error);
              toast({
                title: "Speech recognition error",
                description: error,
                variant: "destructive",
              });
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
    
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (audioRef.current) audioRef.current.pause();
  };

  // Removed startTranscription - now handled directly in onstop

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