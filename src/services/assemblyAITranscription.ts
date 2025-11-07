/**
 * AssemblyAI REST API Transcription Service
 * Fallback transcription service for browsers without webkit speech recognition
 */

const ASSEMBLYAI_API_KEY = "f51919e6f0e34dc497bf5b4e5217f097"; // Replace with your API key
const BASE_URL = "https://api.assemblyai.com/v2";

/**
 * Transcribe audio blob using AssemblyAI REST API
 * @param audioBlob - The audio blob to transcribe
 * @returns The transcribed text
 */
export async function transcribeWithAssemblyAI(audioBlob: Blob): Promise<string> {
  return transcribeWithAssemblyAIREST(audioBlob);
}

/**
 * Transcribe audio blob using AssemblyAI REST API
 * @param audioBlob - The audio blob to transcribe
 * @returns The transcribed text
 */
async function transcribeWithAssemblyAIREST(audioBlob: Blob): Promise<string> {
  try {
    console.log('🔄 Uploading audio to AssemblyAI...');
    
    // Step 1: Upload audio file
    const uploadResponse = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
      },
      body: audioBlob,
    });
    
    if (!uploadResponse.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await uploadResponse.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = await uploadResponse.text();
      }
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorMessage}`);
    }
    
    const uploadData = await uploadResponse.json();
    const uploadUrl = uploadData.upload_url;
    
    if (!uploadUrl) {
      throw new Error('No upload URL returned from AssemblyAI');
    }
    
    console.log('✅ Audio uploaded, starting transcription...');
    
    // Step 2: Start transcription
    const transcriptResponse = await fetch(`${BASE_URL}/transcript`, {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: uploadUrl,
        language_code: 'en',
      }),
    });
    
    if (!transcriptResponse.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await transcriptResponse.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = await transcriptResponse.text();
      }
      throw new Error(`Transcription request failed: ${transcriptResponse.status} - ${errorMessage}`);
    }
    
    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;
    
    if (!transcriptId) {
      throw new Error('No transcript ID returned from AssemblyAI');
    }
    
    console.log(`🔄 Transcription ID: ${transcriptId}, polling for results...`);
    
    // Step 3: Poll for results
    const pollingEndpoint = `${BASE_URL}/transcript/${transcriptId}`;
    
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds between polls
      
      const pollingResponse = await fetch(pollingEndpoint, {
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
        },
      });
      
      if (!pollingResponse.ok) {
        throw new Error(`Status check failed: ${pollingResponse.status}`);
      }
      
      const transcriptionResult = await pollingResponse.json();
      
      if (transcriptionResult.status === 'completed') {
        const transcript = transcriptionResult.text || '';
        if (transcript.trim().length > 0) {
          console.log('✅ AssemblyAI transcription successful, length:', transcript.length);
          return transcript.trim();
        } else {
          throw new Error('Transcription completed but text is empty');
        }
      } else if (transcriptionResult.status === 'error') {
        throw new Error(`Transcription failed: ${transcriptionResult.error || 'Unknown error'}`);
      }
      
      // Continue polling if status is 'queued' or 'processing'
      console.log(`⏳ Transcription status: ${transcriptionResult.status}, waiting...`);
    }
  } catch (error) {
    console.error('❌ AssemblyAI REST transcription failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('AssemblyAI transcription failed: ' + String(error));
  }
}

/**
 * Check if AssemblyAI is available (requires API key and network)
 */
export function isAssemblyAIAvailable(): boolean {
  return typeof window !== 'undefined' && 
         typeof fetch !== 'undefined' &&
         ASSEMBLYAI_API_KEY && 
         ASSEMBLYAI_API_KEY.length > 0;
}

/**
 * Set AssemblyAI API key (if you want to make it configurable)
 */
export function setAssemblyAIAPIKey(apiKey: string) {
  // This would need to be stored in a way that the functions can access it
  // For now, update the constant above
  console.warn('To set API key, update ASSEMBLYAI_API_KEY in assemblyAITranscription.ts');
}

