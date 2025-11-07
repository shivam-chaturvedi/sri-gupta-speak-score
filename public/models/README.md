# Whisper Model Files

This folder contains the local Whisper model files for offline transcription.

## Model Location
Place the Whisper model files in: `public/models/whisper-tiny.en/`

## How to Download Model Files

### Option 1: Using Hugging Face CLI (Recommended)

1. Install Hugging Face CLI:
```bash
pip install huggingface-hub
```

2. Download the model:
```bash
huggingface-cli download Xenova/whisper-tiny.en --local-dir public/models/whisper-tiny.en
```

### Option 2: Manual Download

1. Visit: https://huggingface.co/Xenova/whisper-tiny.en
2. Go to "Files and versions" tab
3. Download all files (you need these files):
   - `config.json`
   - `tokenizer.json`
   - `vocab.json`
   - `merges.txt`
   - `model.onnx` (or `model_quantized.onnx` for smaller size)
   - `model.onnx.data` (if exists)
   - Any other `.onnx` or `.onnx.data` files

4. Place all downloaded files directly in: `public/models/whisper-tiny.en/`

### Option 3: Using Python Script

Create a file `download_model.py`:

```python
from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="Xenova/whisper-tiny.en",
    local_dir="public/models/whisper-tiny.en",
    local_dir_use_symlinks=False
)
```

Then run:
```bash
python download_model.py
```

## Model Files Structure

After downloading, your folder should look like:
```
public/models/whisper-tiny.en/
├── config.json
├── tokenizer.json
├── vocab.json
├── merges.txt
├── model.onnx
└── (other .onnx files if any)
```

## Alternative Models

You can also use other Whisper models:
- `Xenova/whisper-base.en` - Better accuracy, larger size
- `Xenova/whisper-small.en` - Good balance
- `Xenova/whisper-tiny.en` - Fastest, smallest (recommended for browser)

Just change the folder name and update the model path in `src/services/whisperTranscription.ts`

## File Size

- `whisper-tiny.en`: ~75 MB
- `whisper-base.en`: ~290 MB
- `whisper-small.en`: ~460 MB

## Notes

- The model files will be served from the `public` folder, so they'll be accessible at `/models/whisper-tiny.en/`
- Make sure to add `public/models/` to your `.gitignore` if the files are large
- The first load will cache the model in the browser's IndexedDB

