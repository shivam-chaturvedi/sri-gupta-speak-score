// Add type declarations for Speech Recognition API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export class SpeechToTextService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private transcript = '';
  private interimTranscript = '';
  private onResult: ((transcript: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  constructor() {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.transcript += finalTranscript;
        console.log('Final transcript added:', finalTranscript);
        console.log('Total transcript now:', this.transcript);
      }
      
      this.interimTranscript = interimTranscript;
      
      // Always call onResult with current transcript + interim
      const currentResult = (this.transcript + ' ' + interimTranscript).trim();
      this.onResult?.(currentResult);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.onError?.(`Speech recognition error: ${event.error}`);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  startListening(onResult: (transcript: string) => void, onError: (error: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }

      this.transcript = '';
      this.onResult = onResult;
      this.onError = onError;
      
      try {
        this.recognition.start();
        this.isListening = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  stopListening(): string {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
    return this.transcript.trim();
  }

  getTranscript(): string {
    return this.transcript.trim();
  }
}

export const speechToText = new SpeechToTextService();