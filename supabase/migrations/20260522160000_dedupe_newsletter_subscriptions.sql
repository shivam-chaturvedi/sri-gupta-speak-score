-- Remove duplicate newsletter rows (keep the most recently updated per email)

DELETE FROM public.newsletter_subscriptions older
USING public.newsletter_subscriptions newer
WHERE lower(older.email) = lower(newer.email)
  AND older.id <> newer.id
  AND older.updated_at < newer.updated_at;

-- If same email has rows with same timestamp, keep one arbitrary row
DELETE FROM public.newsletter_subscriptions a
USING public.newsletter_subscriptions b
WHERE lower(a.email) = lower(b.email)
  AND a.id < b.id;
