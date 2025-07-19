import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Play, Pause, RotateCcw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startPrep = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setIsCompleted(true);
        stream.getTracks().forEach(track => track.stop());
      };

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
                  mediaRecorder.stop();
                  setIsRecording(false);
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
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
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

  const submitRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
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