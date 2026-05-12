-- Topics table (challenge prompts) + permissive RLS policies

CREATE TABLE IF NOT EXISTS public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'stance' CHECK (type IN ('opinion', 'stance')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS topics_theme_idx ON public.topics(theme);
CREATE INDEX IF NOT EXISTS topics_is_featured_idx ON public.topics(is_featured);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read topics" ON public.topics;
CREATE POLICY "Anyone can read topics"
ON public.topics
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone can insert topics" ON public.topics;
CREATE POLICY "Anyone can insert topics"
ON public.topics
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update topics" ON public.topics;
CREATE POLICY "Anyone can update topics"
ON public.topics
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete topics" ON public.topics;
CREATE POLICY "Anyone can delete topics"
ON public.topics
FOR DELETE
USING (true);

-- Reuse existing timestamp trigger function if present (defined in earlier migrations)
DROP TRIGGER IF EXISTS update_topics_updated_at ON public.topics;
CREATE TRIGGER update_topics_updated_at
BEFORE UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a few starter topics (safe to run multiple times)
INSERT INTO public.topics (topic, description, theme, type, is_featured)
SELECT *
FROM (
  VALUES
    (
      'Is it ethical to eat meat in modern society?',
      'Consider animal welfare, environment, and cultural practices',
      'Ethics',
      'stance',
      true
    ),
    (
      'Should voting be mandatory in democratic elections?',
      'Consider the impact on democratic participation vs. personal freedom',
      'Politics',
      'stance',
      false
    ),
    (
      'Will artificial intelligence replace human creativity?',
      'Explore AI capabilities vs. human imagination and emotion',
      'Technology',
      'stance',
      false
    ),
    (
      'Should college education be free for everyone?',
      'Consider accessibility, quality, and economic implications',
      'Education',
      'stance',
      false
    )
) AS v(topic, description, theme, type, is_featured)
WHERE NOT EXISTS (
  SELECT 1 FROM public.topics t
  WHERE t.topic = v.topic
);

