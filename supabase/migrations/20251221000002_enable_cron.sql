-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to sync trends every 6 hours
SELECT cron.schedule(
  'sync-fashion-trends',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT net.http_post(
    url := 'https://htcoujknjrlvksrnzvzg.supabase.co/functions/v1/sync-trends',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Job', 'true'
    ),
    body := '{}'::jsonb
  );
  $$
);