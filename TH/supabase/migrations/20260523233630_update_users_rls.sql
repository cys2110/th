GRANT SELECT ON TABLE public.users TO anon;

DROP POLICY IF EXISTS "Authenticated can select" ON public.users;
DROP POLICY IF EXISTS "Anyone can select" ON public.users;

CREATE POLICY "Anyone can select"
ON public.users
FOR SELECT
TO anon, authenticated
USING (true);
