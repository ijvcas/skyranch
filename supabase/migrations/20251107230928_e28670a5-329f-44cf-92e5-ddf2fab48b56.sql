-- Backfill missing subscription records for existing users
INSERT INTO public.subscriptions (user_id, tier, status, auto_renew_status, created_at, updated_at)
SELECT 
  u.id, 
  'free' as tier, 
  'active' as status,
  false as auto_renew_status,
  now() as created_at,
  now() as updated_at
FROM auth.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
WHERE s.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Backfill missing usage records for existing users with actual counts
INSERT INTO public.subscription_usage (user_id, animals_count, users_count, last_updated)
SELECT 
  u.id,
  COALESCE((SELECT COUNT(*) FROM public.animals WHERE user_id = u.id AND lifecycle_status != 'deceased'), 0) as animals_count,
  1 as users_count,
  now() as last_updated
FROM auth.users u
LEFT JOIN public.subscription_usage su ON u.id = su.user_id
WHERE su.id IS NULL
ON CONFLICT (user_id) DO NOTHING;