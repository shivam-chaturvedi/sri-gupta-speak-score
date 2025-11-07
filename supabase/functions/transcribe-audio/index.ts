import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Hugging Face Model - Using whisper-tiny (free, no API key required for public models)
const HF_MODEL = "openai/whisper-tiny";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

/**
 * Process base64 string in chunks to prevent memory issues with large audio files
 */
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Detect audio format from base64 data or MIME type
 */
function detectAudioFormat(base64String: string, mimeType?: string): { extension: string; mime: string } {
  // Check MIME type first
  if (mimeType) {
    if (mimeType.includes('webm')) {
      return { extension: 'webm', mime: 'audio/webm' };
    }
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
      return { extension: 'm4a', mime: 'audio/mp4' };
    }
    if (mimeType.includes('mp3')) {
      return { extension: 'mp3', mime: 'audio/mpeg' };
    }
    if (mimeType.includes('wav')) {
      return { extension: 'wav', mime: 'audio/wav' };
    }
    if (mimeType.includes('ogg')) {
      return { extension: 'ogg', mime: 'audio/ogg' };
    }
  }

  // Default to webm (most common for browser recordings)
  return { extension: 'webm', mime: 'audio/webm' };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const requestBody = await req.json();
    const { audio, mimeType, language } = requestBody;
    
    // Validate input
    if (!audio) {
      return new Response(
        JSON.stringify({ error: 'No audio data provided. Please send base64 encoded audio in the "audio" field.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (typeof audio !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Audio data must be a base64 string.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🎤 Processing audio transcription with Whisper Tiny...');
    console.log('📊 Audio data length:', audio.length, 'characters');
    console.log('🤖 Model: openai/whisper-tiny (free, no API key required)');
    
    // Detect audio format
    const audioFormat = detectAudioFormat(audio, mimeType);
    console.log('🎵 Detected audio format:', audioFormat);

    // Process base64 audio in chunks to prevent memory issues
    let binaryAudio: Uint8Array;
    try {
      binaryAudio = processBase64Chunks(audio);
      console.log('✅ Audio decoded, binary size:', binaryAudio.length, 'bytes');
    } catch (error) {
      console.error('❌ Failed to decode base64 audio:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid base64 audio data. Please check your audio encoding.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate audio size (Hugging Face has limits, but we'll use 25MB as safe limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (binaryAudio.length > maxSize) {
      return new Response(
        JSON.stringify({ 
          error: `Audio file too large. Maximum size is 25MB, received ${(binaryAudio.length / 1024 / 1024).toFixed(2)}MB.`,
          hint: 'Please record shorter audio or compress the audio file.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🚀 Sending to Hugging Face Whisper Tiny API...');
    console.log('📝 Language:', language || 'en (auto-detect)');
    console.log('📁 Format:', audioFormat.mime);

    // Send to Hugging Face Inference API
    const startTime = Date.now();
    
    // Hugging Face Inference API accepts audio as FormData or raw bytes
    // Using FormData is more reliable
    const formData = new FormData();
    // Convert Uint8Array to ArrayBuffer for Blob
    const audioArrayBuffer = binaryAudio.buffer.slice(
      binaryAudio.byteOffset,
      binaryAudio.byteOffset + binaryAudio.byteLength
    );
    const blob = new Blob([audioArrayBuffer], { type: audioFormat.mime });
    const filename = `audio.${audioFormat.extension}`;
    formData.append('file', blob, filename);
    
    // Optional: Add language parameter if needed
    if (language && language !== 'en') {
      formData.append('language', language);
    }
    
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      body: formData,
    });

    const requestDuration = Date.now() - startTime;
    console.log(`⏱️  Hugging Face API request took ${requestDuration}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Hugging Face API error:', response.status, errorText);
      
      let errorMessage = 'Transcription service error';
      let statusCode = 500;

      if (response.status === 503) {
        // Model is loading (first request)
        errorMessage = 'Model is loading. Please wait a moment and try again. The model loads on first request and may take 10-30 seconds.';
        statusCode = 503;
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
        statusCode = 429;
      } else if (response.status === 413) {
        errorMessage = 'Audio file too large. Maximum size is 25MB.';
        statusCode = 400;
      } else {
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch {
          errorMessage = errorText || `API error: ${response.status}`;
        }
      }

      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          status: response.status,
          hint: response.status === 503 
            ? 'The Whisper model is loading for the first time. This usually takes 10-30 seconds. Please try again in a moment.'
            : 'Please check your audio format and try again.'
        }),
        {
          status: statusCode,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let result: any;
    try {
      result = await response.json();
    } catch (parseError) {
      const textResult = await response.text();
      console.log('Response was text, not JSON:', textResult.substring(0, 200));
      result = { text: textResult };
    }
    
    const transcriptionDuration = Date.now() - startTime;
    
    console.log('✅ Transcription successful!');
    console.log('📝 Raw result:', JSON.stringify(result).substring(0, 200));
    
    // Hugging Face returns the text in various formats depending on the model
    // Try different possible response formats
    let transcriptionText = '';
    
    if (typeof result === 'string') {
      transcriptionText = result;
    } else if (result.text) {
      transcriptionText = result.text;
    } else if (Array.isArray(result) && result[0]?.text) {
      transcriptionText = result[0].text;
    } else if (Array.isArray(result) && typeof result[0] === 'string') {
      transcriptionText = result[0];
    } else if (result.chunks && Array.isArray(result.chunks)) {
      // Some models return chunks
      transcriptionText = result.chunks.map((chunk: any) => chunk.text || chunk).join(' ');
    } else if (result.transcription) {
      transcriptionText = result.transcription;
    } else {
      // Last resort: try to find any text field
      const textFields = Object.keys(result).filter(key => 
        key.toLowerCase().includes('text') || 
        key.toLowerCase().includes('transcript')
      );
      if (textFields.length > 0) {
        transcriptionText = result[textFields[0]];
      } else {
        // Log the full result for debugging
        console.log('⚠️ Unexpected response format:', JSON.stringify(result));
        transcriptionText = '';
      }
    }
    
    console.log('📝 Extracted text length:', transcriptionText?.length || 0, 'characters');
    console.log('⏱️  Total processing time:', transcriptionDuration, 'ms');

    if (!transcriptionText || transcriptionText.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Transcription returned empty result. Please ensure the audio contains clear speech.',
          hint: 'Try speaking more clearly or check your microphone.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return successful response
    return new Response(
      JSON.stringify({ 
        text: transcriptionText.trim(),
        duration: null, // Hugging Face doesn't return duration
        language: language || 'en',
        model: 'whisper-tiny',
        provider: 'huggingface'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Transcription error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred during transcription';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        hint: 'Please check that your audio data is valid and try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
