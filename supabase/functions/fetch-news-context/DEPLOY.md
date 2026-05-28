# fetch-news-context

Edge function used by the Admin "Write with AI" newsletter composer.

## Deploy

```bash
supabase functions deploy fetch-news-context
```

## Invoke (example)

```bash
supabase functions invoke fetch-news-context --body '{"topics":["technology","business"],"days":7,"perTopicLimit":6}'
```

