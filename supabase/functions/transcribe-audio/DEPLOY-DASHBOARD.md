# Deploy Audio Transcription Function via Supabase Dashboard

This guide shows you how to deploy the transcription function using **only the Supabase Dashboard** (no CLI required).

## Prerequisites

- ✅ Supabase account
- ✅ Access to your project dashboard
- ✅ That's it! No API keys or CLI needed! 🎉

## Quick Summary

1. Go to Supabase Dashboard → Edge Functions
2. Create new function named `transcribe-audio`
3. Copy code from `index.ts` file
4. Paste into dashboard editor
5. Click Deploy
6. Done! ✅

---

## Step-by-Step Instructions

### Step 1: Access Your Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: **imfcjckmkrqbwitmqarf**

### Step 2: Navigate to Edge Functions

1. In the left sidebar, click on **Edge Functions**
2. If you don't see it, click **More** to expand the menu
3. You should see the Edge Functions page

### Step 3: Create New Function

1. Click the **"Create a new function"** or **"New Function"** button
2. You'll see a dialog or page to create a function

### Step 4: Set Function Details

1. **Function Name**: Enter `transcribe-audio`
   - ⚠️ **Important**: Use exactly this name (lowercase, with hyphen)
   
2. **Template**: Select **"Blank Function"** or **"Empty"**

3. Click **"Create Function"** or **"Continue"**

### Step 5: Copy the Function Code

1. You'll see a code editor with a template function
2. **Delete all the existing code** in the editor (Select All → Delete)
3. Open the file `supabase/functions/transcribe-audio/index.ts` from your project
   - You can find it in: `YourProject/supabase/functions/transcribe-audio/index.ts`
4. **Copy the entire contents** of that file (Ctrl+A / Cmd+A, then Ctrl+C / Cmd+C)
5. **Paste it** into the Supabase Dashboard code editor (Ctrl+V / Cmd+V)

**Tip**: The file should be about 320+ lines. Make sure you copied everything!

### Step 6: Verify the Code

Make sure the code includes:
- ✅ Import statements at the top
- ✅ `HF_MODEL = "openai/whisper-tiny"` constant
- ✅ `serve(async (req) => { ... })` function
- ✅ All the helper functions (processBase64Chunks, detectAudioFormat)

### Step 7: Deploy the Function

1. Look for a **"Deploy"** or **"Save"** button (usually at the top right)
2. Click **"Deploy"**
3. Wait for deployment to complete (usually 10-30 seconds)
4. You should see a success message: **"Function deployed successfully"**

### Step 8: Verify Deployment

1. You should see `transcribe-audio` in your functions list
2. The status should show as **"Active"** or **"Deployed"**
3. Click on the function name to view details

### Step 9: Test the Function (Optional)

1. In the function details page, look for a **"Test"** or **"Invoke"** tab
2. You can test with sample data, but the real test will be from your frontend

## Alternative: Upload Function File

If the dashboard allows file upload:

1. In the Edge Functions page, look for **"Upload"** or **"Import"** option
2. Select the file: `supabase/functions/transcribe-audio/index.ts`
3. Set the function name as: `transcribe-audio`
4. Click **"Deploy"** or **"Upload"**

## Troubleshooting

### Function Not Appearing
- Make sure you're in the correct project
- Check that the function name is exactly `transcribe-audio`
- Refresh the page

### Deployment Failed
- Check for syntax errors in the code
- Make sure all imports are correct
- Look at the error message in the dashboard

### Function Not Working
- Check the function logs in the dashboard
- Look for error messages
- Verify the code was copied completely

## What Happens Next?

Once deployed:
1. ✅ Your frontend will automatically use this function
2. ✅ No API keys needed - it's completely free!
3. ✅ Works in all browsers (Firefox, Safari, Chrome, etc.)
4. ✅ First request may take 10-30 seconds (model loading)
5. ✅ Subsequent requests are fast

## Function Details

- **Name**: `transcribe-audio`
- **Model**: `openai/whisper-tiny` (via Hugging Face)
- **Cost**: FREE (no API key required)
- **Timeout**: 60 seconds (Supabase default)
- **Memory**: Automatic (Supabase manages)

## Need Help?

If you encounter issues:
1. Check the **Logs** tab in the function details
2. Look for error messages
3. Verify the code matches the file in your project
4. Try redeploying the function

## Success Checklist

- [ ] Function created in dashboard
- [ ] Code copied and pasted correctly
- [ ] Function deployed successfully
- [ ] Function shows as "Active"
- [ ] Ready to use from frontend!

---

**That's it!** Your transcription function is now live and ready to use. No CLI, no API keys, completely free! 🚀

