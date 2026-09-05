-- 1. Tabella Clienti
CREATE TABLE public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    codice_fiscale TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabella Preventivi
CREATE TABLE public.quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    tipo_evento TEXT NOT NULL, -- 'wedding', 'eventi'
    data_evento DATE,
    items JSONB DEFAULT '[]'::jsonb, -- Array di servizi/prodotti con prezzi
    sconto_percentuale NUMERIC DEFAULT 0,
    sconto_fisso NUMERIC DEFAULT 0,
    totale_calcolato NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'bozza', -- 'bozza', 'inviato', 'accettato', 'rifiutato', 'convertito'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quotes_modtime 
BEFORE UPDATE ON public.quotes 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 4. Sicurezza (Row Level Security)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Siccome per ora gestiamo tutto tramite l'Admin (che usa la Service Role Key 
-- dal backend Next.js bypassando la RLS), le policy pubbliche le creeremo in 
-- seguito quando ci sarà il login per l'Area Clienti.
-- Per permettere ai clienti di visualizzare il LORO preventivo dal link pubblico, 
-- creiamo una policy in lettura basata sull'ID del preventivo.
CREATE POLICY "Permetti lettura preventivo tramite ID" 
ON public.quotes FOR SELECT 
USING (true); -- Per ora rendiamo i preventivi leggibili pubblicamente tramite il loro UUID difficile da indovinare.

CREATE POLICY "Permetti aggiornamento status preventivo" 
ON public.quotes FOR UPDATE 
USING (true); -- Permettiamo al cliente di cliccare su "Accetta"

CREATE POLICY "Permetti lettura anagrafiche legate al preventivo"
ON public.clients FOR SELECT
USING (true);

-- 5. Modifica dinamica servizi post-firma (fino a 10gg dall'evento)
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS importo_caparra NUMERIC,
  ADD COLUMN IF NOT EXISTS importo_secondo_acconto NUMERIC;

-- Rate (caparra 30% e secondo acconto 40%) congelate una sola volta al momento
-- della prima firma del contratto (vedi /api/generate-pdf). Eventuali modifiche
-- successive ai servizi cambiano solo il saldo finale, non queste due righe.

CREATE TABLE IF NOT EXISTS public.quote_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
    initiated_by TEXT NOT NULL, -- 'cliente' | 'admin'
    items_before JSONB NOT NULL,
    items_after JSONB NOT NULL,
    totale_before NUMERIC NOT NULL,
    totale_after NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending' | 'confermato'
    firma_disegnata TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.quote_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permetti lettura modifica servizi tramite ID"
ON public.quote_changes FOR SELECT
USING (true);

CREATE POLICY "Permetti inserimento richiesta modifica servizi"
ON public.quote_changes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permetti conferma modifica servizi"
ON public.quote_changes FOR UPDATE
USING (true);

-- 6. Catalogo e Listino Servizi TDA 2026 (Sincronizzazione Centralizzata)
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

CREATE INDEX IF NOT EXISTS idx_services_catalog_fase ON public.services_catalog(fase_evento);
CREATE INDEX IF NOT EXISTS idx_services_catalog_categoria ON public.services_catalog(categoria);
CREATE INDEX IF NOT EXISTS idx_services_catalog_code ON public.services_catalog(code);

DROP TRIGGER IF EXISTS update_services_catalog_modtime ON public.services_catalog;
CREATE TRIGGER update_services_catalog_modtime 
BEFORE UPDATE ON public.services_catalog 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on services_catalog" ON public.services_catalog;
CREATE POLICY "Allow public select on services_catalog" 
ON public.services_catalog FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow admin write on services_catalog" ON public.services_catalog;
CREATE POLICY "Allow admin write on services_catalog" 
ON public.services_catalog FOR ALL 
USING (true);

-- Realtime Publication
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

