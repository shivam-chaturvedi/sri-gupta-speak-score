import { supabase } from "@/integrations/supabase/client";

export class WhisperService {
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      console.log('Converting audio blob to base64...');
      const base64Audio = await this.blobToBase64(audioBlob);
      
      console.log('Calling Whisper transcription service...');
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (error) {
        console.error('Whisper service error:', error);
        throw new Error(`Transcription failed: ${error.message}`);
      }

      if (!data?.text) {
        throw new Error('No transcription text returned');
      }

      console.log('Transcription successful:', data.text.substring(0, 100) + '...');
      return data.text;
    } catch (error) {
      console.error('Whisper transcription error:', error);
      throw error;
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const whisperService = new WhisperService();
