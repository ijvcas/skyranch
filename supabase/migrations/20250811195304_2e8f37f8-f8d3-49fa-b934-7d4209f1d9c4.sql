-- Tighten RLS policies to least-privilege and ownership-based access

-- ANIMALS: remove permissive policies and add ownership-specific ones
DROP POLICY IF EXISTS "All authenticated users can delete animals" ON public.animals;
DROP POLICY IF EXISTS "All authenticated users can insert animals" ON public.animals;
DROP POLICY IF EXISTS "All authenticated users can update animals" ON public.animals;
DROP POLICY IF EXISTS "All authenticated users can view all animals" ON public.animals;
DROP POLICY IF EXISTS "Shared access - create animals" ON public.animals;
DROP POLICY IF EXISTS "Shared access - delete all animals" ON public.animals;
DROP POLICY IF EXISTS "Shared access - update all animals" ON public.animals;
DROP POLICY IF EXISTS "Shared access - view all animals" ON public.animals;

-- Ensure users can fully manage only their own animals
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'animals' AND policyname = 'Users can view their own animals'
  ) THEN
    CREATE POLICY "Users can view their own animals"
    ON public.animals
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'animals' AND policyname = 'Users can update their own animals'
  ) THEN
    CREATE POLICY "Users can update their own animals"
    ON public.animals
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'animals' AND policyname = 'Users can delete their own animals'
  ) THEN
    CREATE POLICY "Users can delete their own animals"
    ON public.animals
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- HEALTH RECORDS: remove permissive policies (own policies already exist)
DROP POLICY IF EXISTS "All authenticated users can delete health records" ON public.health_records;
DROP POLICY IF EXISTS "All authenticated users can insert health records" ON public.health_records;
DROP POLICY IF EXISTS "All authenticated users can update health records" ON public.health_records;
DROP POLICY IF EXISTS "All authenticated users can view all health records" ON public.health_records;

-- BREEDING RECORDS: remove permissive policies (own policies already exist)
DROP POLICY IF EXISTS "All authenticated users can delete breeding records" ON public.breeding_records;
DROP POLICY IF EXISTS "All authenticated users can insert breeding records" ON public.breeding_records;
DROP POLICY IF EXISTS "All authenticated users can update breeding records" ON public.breeding_records;
DROP POLICY IF EXISTS "All authenticated users can view all breeding records" ON public.breeding_records;

-- OFFSPRING: remove permissive policies (own policies already exist)
DROP POLICY IF EXISTS "All authenticated users can delete offspring" ON public.offspring;
DROP POLICY IF EXISTS "All authenticated users can insert offspring" ON public.offspring;
DROP POLICY IF EXISTS "All authenticated users can update offspring" ON public.offspring;
DROP POLICY IF EXISTS "All authenticated users can view all offspring" ON public.offspring;

-- ANIMAL ATTACHMENTS: remove permissive policies (own policies already exist)
DROP POLICY IF EXISTS "All authenticated users can delete animal attachments" ON public.animal_attachments;
DROP POLICY IF EXISTS "All authenticated users can insert animal attachments" ON public.animal_attachments;
DROP POLICY IF EXISTS "All authenticated users can update animal attachments" ON public.animal_attachments;
DROP POLICY IF EXISTS "All authenticated users can view all animal attachments" ON public.animal_attachments;

-- CALENDAR EVENTS: remove permissive policies (own policies already exist)
DROP POLICY IF EXISTS "All authenticated users can delete calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "All authenticated users can insert calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "All authenticated users can update calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "All authenticated users can view all calendar events" ON public.calendar_events;

-- REPORTS: remove permissive policies (own policies already exist)
DROP POLICY IF EXISTS "All authenticated users can delete reports" ON public.reports;
DROP POLICY IF EXISTS "All authenticated users can insert reports" ON public.reports;
DROP POLICY IF EXISTS "All authenticated users can update reports" ON public.reports;
DROP POLICY IF EXISTS "All authenticated users can view all reports" ON public.reports;

-- LOTS: remove permissive policy (own policies already exist)
DROP POLICY IF EXISTS "All authenticated users can access all lots" ON public.lots;

-- LOT POLYGONS: replace permissive policy with ownership-based policies via related lot
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.lot_polygons;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lot_polygons' AND policyname = 'Users can view polygons for their lots'
  ) THEN
    CREATE POLICY "Users can view polygons for their lots"
    ON public.lot_polygons
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.lots l
      WHERE l.id = lot_polygons.lot_id AND l.user_id = auth.uid()
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lot_polygons' AND policyname = 'Users can insert polygons for their lots'
  ) THEN
    CREATE POLICY "Users can insert polygons for their lots"
    ON public.lot_polygons
    FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.lots l
      WHERE l.id = lot_polygons.lot_id AND l.user_id = auth.uid()
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lot_polygons' AND policyname = 'Users can update polygons for their lots'
  ) THEN
    CREATE POLICY "Users can update polygons for their lots"
    ON public.lot_polygons
    FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM public.lots l
      WHERE l.id = lot_polygons.lot_id AND l.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.lots l
      WHERE l.id = lot_polygons.lot_id AND l.user_id = auth.uid()
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lot_polygons' AND policyname = 'Users can delete polygons for their lots'
  ) THEN
    CREATE POLICY "Users can delete polygons for their lots"
    ON public.lot_polygons
    FOR DELETE
    USING (EXISTS (
      SELECT 1 FROM public.lots l
      WHERE l.id = lot_polygons.lot_id AND l.user_id = auth.uid()
    ));
  END IF;
END $$;