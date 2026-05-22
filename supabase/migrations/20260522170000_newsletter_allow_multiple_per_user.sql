-- One row per email; same user may subscribe multiple emails (no user_id uniqueness)

ALTER TABLE public.newsletter_subscriptions
  DROP CONSTRAINT IF EXISTS newsletter_subscriptions_user_id_unique;

CREATE INDEX IF NOT EXISTS newsletter_subscriptions_user_id_idx
  ON public.newsletter_subscriptions (user_id)
  WHERE user_id IS NOT NULL;
