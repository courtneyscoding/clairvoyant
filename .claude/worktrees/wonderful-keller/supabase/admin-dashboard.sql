CREATE TABLE IF NOT EXISTS public.admin_users (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );
$$;

DROP POLICY IF EXISTS "Users can view own admin row" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin rows" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all readings" ON public.readings;

CREATE POLICY "Users can view own admin row"
  ON public.admin_users
  FOR SELECT
  USING (lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

CREATE POLICY "Admins can view admin rows"
  ON public.admin_users
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all readings"
  ON public.readings
  FOR SELECT
  USING (public.is_admin());

INSERT INTO public.admin_users (email)
VALUES ('creamycourtneys@gmail.com')
ON CONFLICT (email) DO NOTHING;
