# How to Deploy the Audio Transcription Function

## Choose Your Method

- 📱 **Using Supabase Dashboard (Web UI)** → See [DEPLOY-DASHBOARD.md](./DEPLOY-DASHBOARD.md)
- 💻 **Using Supabase CLI** → Follow steps below

---

## Prerequisites (CLI Method)

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **That's it!** No API keys needed - this uses free Hugging Face API! 🎉

## Deployment Steps (CLI Method)

### Step 1: Login to Supabase CLI

```bash
supabase login
```

### Step 2: Link Your Project

```bash
supabase link --project-ref imfcjckmkrqbwitmqarf
```

### Step 3: Deploy the Function

```bash
supabase functions deploy transcribe-audio
```

**That's all!** No API keys, no secrets, no costs! 🚀

### Step 4: Verify Deployment

Check the Supabase Dashboard:
1. Go to **Edge Functions** section
2. You should see `transcribe-audio` function listed
3. Check the logs to ensure it's working

**Note:** First transcription request may take 10-30 seconds as the model loads. Subsequent requests are fast!

## Testing the Function

After deployment, test it from your frontend:

```typescript
// This should work automatically in your VoiceRecorder component
// But you can test manually:

const { data, error } = await supabase.functions.invoke('transcribe-audio', {
  body: { 
    audio: base64AudioString,
    language: 'en'
  }
});

console.log('Transcription:', data?.text);
```

## Troubleshooting

### Function not found
- Make sure you've deployed: `supabase functions deploy transcribe-audio`
- Check function name matches exactly: `transcribe-audio`

### Model Loading (503 Error)
- First request takes 10-30 seconds to load the model
- This is normal! Just wait and retry
- Subsequent requests are fast
- Consider showing a loading message to users

### CORS Errors
- The function already includes CORS headers
- Make sure you're calling from an allowed origin

### Function Timeout
- Edge Functions have a 60-second timeout
- For longer audio, consider chunking or using async processing

## Cost Monitoring

**No costs to monitor!** This uses Hugging Face's free Inference API.

- ✅ Completely free
- ✅ No API key needed
- ✅ No billing required
- ⚠️ Rate limits may apply for very high usage (but generous free tier)

## Production Recommendations

1. **Add Rate Limiting**
   - Limit requests per user
   - Implement request queuing

2. **Add Authentication**
   - Verify user is logged in
   - Check user permissions

3. **Add Caching**
   - Cache transcriptions for identical audio
   - Reduce API costs

4. **Monitor Usage**
   - Track transcription requests
   - Set up alerts for high usage

