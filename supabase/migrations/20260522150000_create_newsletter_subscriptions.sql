-- Newsletter subscriptions: email + topic category preferences per user

CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_subscriptions_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS newsletter_subscriptions_email_idx
  ON public.newsletter_subscriptions (email);

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read newsletter subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Anyone can read newsletter subscriptions"
ON public.newsletter_subscriptions
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone can insert newsletter subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Anyone can insert newsletter subscriptions"
ON public.newsletter_subscriptions
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update newsletter subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Anyone can update newsletter subscriptions"
ON public.newsletter_subscriptions
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete newsletter subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Anyone can delete newsletter subscriptions"
ON public.newsletter_subscriptions
FOR DELETE
USING (true);

DROP TRIGGER IF EXISTS update_newsletter_subscriptions_updated_at ON public.newsletter_subscriptions;
CREATE TRIGGER update_newsletter_subscriptions_updated_at
BEFORE UPDATE ON public.newsletter_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
