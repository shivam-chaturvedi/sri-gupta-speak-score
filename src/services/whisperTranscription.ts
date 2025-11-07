import { pipeline, env } from '@huggingface/transformers';

// Configure Transformers.js for local models
env.allowLocalModels = true;
env.allowRemoteModels = false; // Disable remote models to force local usage

// Set the local model path - models should be in public/models/
const LOCAL_MODEL_PATH = '/models/whisper-tiny.en';

let whisperPipeline: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;
let hasFailed = false;

/**
 * Load the Whisper model for speech-to-text transcription
 */
async function loadWhisperModel() {
  if (whisperPipeline) {
    return whisperPipeline;
  }

  if (hasFailed) {
    throw new Error('Whisper model failed to load previously');
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = (async () => {
    try {
      console.log('🔄 Loading Whisper model from local files...');
      console.log(`  Model path: ${LOCAL_MODEL_PATH}`);
      
      // Load from local model path
      whisperPipeline = await pipeline(
        'automatic-speech-recognition',
        LOCAL_MODEL_PATH, // Use local path instead of HuggingFace model ID
        {
          // Local models don't need device specification
        }
      );
      console.log('✅ Whisper model loaded successfully from local files');
      isLoading = false;
      return whisperPipeline;
    } catch (error) {
      console.error('❌ Error loading Whisper model:', error);
      console.error('Make sure model files are in:', LOCAL_MODEL_PATH);
      console.error('See public/models/README.md for download instructions');
      isLoading = false;
      loadPromise = null;
      hasFailed = true;
      throw error;
    }
  })();

  return loadPromise;
}

/**
 * Transcribe audio blob using Whisper model
 * @param audioBlob - The audio blob to transcribe
 * @returns The transcribed text
 */
export async function transcribeWithWhisper(audioBlob: Blob): Promise<string> {
  try {
    // Load model if not already loaded
    const pipeline = await loadWhisperModel();

    console.log('🔄 Converting audio blob to format for Whisper...');
    
    // Convert blob to audio buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Error decoding audio:', error);
      throw new Error('Failed to decode audio. Please ensure the audio format is supported.');
    }

    // Convert AudioBuffer to format expected by Whisper
    // Whisper expects mono 16kHz audio
    const targetSampleRate = 16000;
    const sourceSampleRate = audioBuffer.sampleRate;
    const audioData = audioBuffer.getChannelData(0); // Get mono channel (or first channel)
    
    // Resample if needed
    let resampledAudio: Float32Array;
    if (sourceSampleRate !== targetSampleRate) {
      const ratio = sourceSampleRate / targetSampleRate;
      const newLength = Math.floor(audioData.length / ratio);
      resampledAudio = new Float32Array(newLength);
      
      // Simple linear interpolation for resampling
      for (let i = 0; i < newLength; i++) {
        const index = i * ratio;
        const indexFloor = Math.floor(index);
        const indexCeil = Math.min(indexFloor + 1, audioData.length - 1);
        const fraction = index - indexFloor;
        resampledAudio[i] = audioData[indexFloor] * (1 - fraction) + audioData[indexCeil] * fraction;
      }
    } else {
      resampledAudio = new Float32Array(audioData);
    }

    console.log('🔄 Transcribing with Whisper...');
    console.log(`  Audio length: ${resampledAudio.length} samples`);
    console.log(`  Sample rate: ${targetSampleRate} Hz`);
    console.log(`  Duration: ${(resampledAudio.length / targetSampleRate).toFixed(2)}s`);
    
    // Ensure audio is not empty
    if (resampledAudio.length === 0) {
      throw new Error('Audio is empty after processing');
    }
    
    // Run transcription - Transformers.js expects the audio as Float32Array
    // The pipeline function should be called directly with the audio data
    const result = await pipeline(resampledAudio, {
      return_timestamps: false,
      language: 'en',
    });

    const transcript = result?.text || '';
    
    if (transcript && transcript.trim().length > 0) {
      console.log('✅ Whisper transcription successful, length:', transcript.length);
      return transcript.trim();
    }

    throw new Error('No transcript returned from Whisper');
  } catch (error) {
    console.error('❌ Whisper transcription failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Whisper transcription failed: ' + String(error));
  }
}

/**
 * Check if Whisper is available (browser supports required APIs)
 */
export function isWhisperAvailable(): boolean {
  return typeof window !== 'undefined' && 
         (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined');
}

