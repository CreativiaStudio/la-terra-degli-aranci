-- ==============================================================================
-- 01_services_catalog.sql
-- Migration: Create services_catalog table for central synchronization & Realtime
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.services_catalog (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    categoria TEXT NOT NULL,
    nome TEXT NOT NULL,
    titolo_base TEXT NULL,
    variante TEXT NULL,
    descrizione TEXT NULL,
    prezzo_unitario NUMERIC NOT NULL DEFAULT 0,
    costo_fornitore NUMERIC NOT NULL DEFAULT 0,
    fase_evento TEXT NOT NULL DEFAULT 'generale' CHECK (fase_evento IN ('agrumeto', 'rito', 'sala_tufo', 'torta', 'after_party', 'generale')),
    unita_misura TEXT NOT NULL DEFAULT 'corpo' CHECK (unita_misura IN ('pax', 'corpo', 'child')),
    unita_label TEXT NULL,
    split_label TEXT NULL,
    split_key TEXT NULL,
    immagine TEXT NULL,
    galleria JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high performance querying
CREATE INDEX IF NOT EXISTS idx_services_catalog_fase ON public.services_catalog(fase_evento);
CREATE INDEX IF NOT EXISTS idx_services_catalog_categoria ON public.services_catalog(categoria);
CREATE INDEX IF NOT EXISTS idx_services_catalog_code ON public.services_catalog(code);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_services_catalog_modtime() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_services_catalog_modtime ON public.services_catalog;
CREATE TRIGGER update_services_catalog_modtime 
BEFORE UPDATE ON public.services_catalog 
FOR EACH ROW EXECUTE PROCEDURE update_services_catalog_modtime();

-- Row Level Security (RLS)
ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on services_catalog" ON public.services_catalog;
CREATE POLICY "Allow public select on services_catalog" 
ON public.services_catalog FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow admin write on services_catalog" ON public.services_catalog;
CREATE POLICY "Allow admin write on services_catalog" 
ON public.services_catalog FOR ALL 
USING (true);

-- Enable Supabase Realtime for table services_catalog
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'services_catalog'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.services_catalog;
    END IF;
END $$;
