# Audio Transcription Edge Function

This Supabase Edge Function transcribes audio files using **Hugging Face's Whisper Tiny model** - **completely FREE, no API key required!**

## Features

- ✅ **FREE** - Uses Hugging Face Inference API (no API key needed)
- ✅ Transcribes audio using OpenAI Whisper-Tiny model
- ✅ Supports multiple audio formats (WebM, MP4, MP3, WAV, OGG)
- ✅ Automatic format detection
- ✅ Handles large files with chunked processing
- ✅ Comprehensive error handling
- ✅ CORS enabled for web applications
- ✅ No costs - completely free to use!

## Setup

### 1. Deploy the Function

```bash
# From your project root
supabase functions deploy transcribe-audio
```

**That's it! No API keys needed!** 🎉

The function uses Hugging Face's public Inference API which is free for public models like whisper-tiny.

## Usage

### From Frontend (JavaScript/TypeScript)

```typescript
import { supabase } from '@/integrations/supabase/client';

// Convert audio blob to base64
const reader = new FileReader();
reader.readAsDataURL(audioBlob);
reader.onloadend = async () => {
  const base64Audio = (reader.result as string).split(',')[1];
  
  // Call the Edge Function
  const { data, error } = await supabase.functions.invoke('transcribe-audio', {
    body: { 
      audio: base64Audio,
      language: 'en', // optional, defaults to 'en'
      mimeType: 'audio/webm' // optional, for format detection
    }
  });
  
  if (error) {
    console.error('Transcription error:', error);
    return;
  }
  
  console.log('Transcription:', data.text);
  console.log('Duration:', data.duration);
  console.log('Language:', data.language);
};
```

### Request Format

```json
{
  "audio": "base64_encoded_audio_string",
  "language": "en",  // optional, ISO 639-1 language code
  "mimeType": "audio/webm"  // optional, helps with format detection
}
```

### Response Format

**Success (200):**
```json
{
  "text": "The transcribed text from the audio...",
  "duration": 45.2,
  "language": "en",
  "segments": [...]  // word-level timestamps if available
}
```

**Error (400/500):**
```json
{
  "error": "Error message describing what went wrong",
  "hint": "Helpful hint for fixing the issue"
}
```

## Supported Audio Formats

- **WebM** (`.webm`) - Default for browser recordings
- **MP4/M4A** (`.mp4`, `.m4a`)
- **MP3** (`.mp3`)
- **WAV** (`.wav`)
- **OGG** (`.ogg`)

## Limitations

- Maximum file size: **25MB** (OpenAI Whisper limit)
- Supported languages: All languages supported by Whisper
- Processing time: Depends on audio length (typically 1-5 seconds for short clips)

## Error Handling

The function handles various error scenarios:

- **400 Bad Request**: Invalid input, missing audio, file too large
- **401 Unauthorized**: Invalid OpenAI API key
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side errors, API failures

## Cost Considerations

**This implementation is completely FREE!** 🎉

- Uses Hugging Face Inference API (free tier)
- No API key required
- No per-minute charges
- Model: `openai/whisper-tiny` (lightweight, fast, free)

**Note:** 
- First request may take 10-30 seconds (model loading)
- Subsequent requests are fast
- Rate limits may apply for very high usage (but generous free tier)

## Testing

You can test the function locally:

```bash
# Start Supabase locally
supabase start

# Test the function
curl -X POST http://localhost:54321/functions/v1/transcribe-audio \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "audio": "base64_audio_string_here",
    "language": "en"
  }'
```

## Troubleshooting

### "OPENAI_API_KEY not configured"
- Make sure you've set the secret in Supabase
- Verify the secret name is exactly `OPENAI_API_KEY`
- Redeploy the function after setting secrets

### "Audio file too large"
- Reduce recording duration
- Compress audio before sending
- Maximum size is 25MB

### "Invalid base64 audio data"
- Ensure audio is properly base64 encoded
- Check that you're sending the audio data (not the data URL prefix)
- Remove `data:audio/webm;base64,` prefix if present

### Rate Limit Errors
- OpenAI has rate limits based on your plan
- Implement retry logic with exponential backoff
- Consider queuing transcriptions for high-volume usage

## Security Notes

- ✅ API key is stored securely in Supabase secrets
- ✅ Function validates input before processing
- ✅ CORS is configured for your domain
- ⚠️ Consider adding authentication checks if needed
- ⚠️ Implement rate limiting for production use

