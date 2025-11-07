# Local Whisper Model Setup Guide

This guide explains how to set up local Whisper model files for offline transcription.

## 📁 Folder Structure

Place your model files in:
```
public/models/whisper-tiny.en/
```

## 📥 How to Download Model Files

### Method 1: Using Hugging Face CLI (Easiest)

1. **Install Python** (if not already installed)
   - Download from: https://www.python.org/downloads/

2. **Install Hugging Face CLI**:
   ```bash
   pip install huggingface-hub
   ```

3. **Download the model**:
   ```bash
   huggingface-cli download Xenova/whisper-tiny.en --local-dir public/models/whisper-tiny.en
   ```

### Method 2: Manual Download

1. **Visit the model page**:
   - https://huggingface.co/Xenova/whisper-tiny.en

2. **Go to "Files and versions" tab**

3. **Download these required files**:
   - `config.json`
   - `tokenizer.json`
   - `vocab.json`
   - `merges.txt`
   - `model.onnx` (or `model_quantized.onnx`)
   - Any `.onnx.data` files

4. **Place all files in**: `public/models/whisper-tiny.en/`

### Method 3: Using Python Script

Create `download_model.py` in the project root:

```python
from huggingface_hub import snapshot_download
import os

# Create directory if it doesn't exist
os.makedirs("public/models/whisper-tiny.en", exist_ok=True)

# Download model
snapshot_download(
    repo_id="Xenova/whisper-tiny.en",
    local_dir="public/models/whisper-tiny.en",
    local_dir_use_symlinks=False
)

print("✅ Model downloaded successfully!")
```

Run it:
```bash
python download_model.py
```

## ✅ Verify Installation

After downloading, your folder should contain:
```
public/models/whisper-tiny.en/
├── config.json
├── tokenizer.json
├── vocab.json
├── merges.txt
├── model.onnx (or model_quantized.onnx)
└── (other .onnx files)
```

## 🔧 Configuration

The model path is configured in `src/services/whisperTranscription.ts`:
```typescript
const LOCAL_MODEL_PATH = '/models/whisper-tiny.en';
```

To use a different model, change this path and download the corresponding model files.

## 📊 Model Options

| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| `whisper-tiny.en` | ~75 MB | Fastest | Good |
| `whisper-base.en` | ~290 MB | Fast | Better |
| `whisper-small.en` | ~460 MB | Medium | Best |

**Recommended**: `whisper-tiny.en` for browser use (fastest loading)

## 🚀 Testing

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open browser console and check for:
   - `🔄 Loading Whisper model from local files...`
   - `✅ Whisper model loaded successfully from local files`

3. If you see errors, check:
   - Model files are in the correct folder
   - All required files are present
   - Browser console for specific error messages

## ⚠️ Troubleshooting

### Error: "Model not found"
- Check that files are in `public/models/whisper-tiny.en/`
- Verify all required files are downloaded
- Check browser console for exact path being requested

### Error: "Failed to load model"
- Ensure `model.onnx` file is present
- Check file permissions
- Try clearing browser cache

### Model loads but transcription fails
- Check browser console for audio processing errors
- Verify audio format is supported
- Check that audio is not empty

## 📝 Notes

- Model files are large (~75MB+), so they're excluded from git (see `.gitignore`)
- First load will cache the model in browser's IndexedDB
- Subsequent loads will be faster due to caching
- Models are served from the `public` folder, accessible at `/models/`

## 🔗 Useful Links

- Model Repository: https://huggingface.co/Xenova/whisper-tiny.en
- Transformers.js Docs: https://huggingface.co/docs/transformers.js
- Hugging Face Hub: https://huggingface.co/docs/hub

