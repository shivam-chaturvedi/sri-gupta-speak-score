-- Extend debate_sessions for personalized feedback + recordings vault

ALTER TABLE public.debate_sessions
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS feedback_length_minutes INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS selected_criteria TEXT[] DEFAULT ARRAY['logic','rhetoric','empathy','delivery']::TEXT[];

-- Storage bucket for debate recordings (public read for playback URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('debate-recordings', 'debate-recordings', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own debate recordings" ON storage.objects;
CREATE POLICY "Users can upload own debate recordings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'debate-recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own debate recordings" ON storage.objects;
CREATE POLICY "Users can update own debate recordings"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'debate-recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Public can read debate recordings" ON storage.objects;
CREATE POLICY "Public can read debate recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'debate-recordings');
