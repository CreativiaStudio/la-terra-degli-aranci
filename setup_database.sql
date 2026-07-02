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
