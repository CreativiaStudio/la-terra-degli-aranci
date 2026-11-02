import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Route di Keep-Alive Anti-Pausa per Supabase.
 *
 * Richiamata in automatico da Vercel Cron ogni 3 giorni (schedule: "0 8 * /3 * *").
 * Invia una query reale a Supabase mantenendo il progetto costantemente attivo
 * ed evitando l'auto-pausa programmata di Supabase sui piani gratuiti/dormienti.
 */
export async function GET(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const start = Date.now();
    
    // Esegue una query reale e leggera sulla tabella clients
    const { data, error } = await supabase.from('clients').select('id').limit(1);
    const latencyMs = Date.now() - start;

    if (error) {
      console.error('[CRON KEEP-ALIVE] Errore ping Supabase:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase Keep-Alive OK: database attivo e operativo.',
      recordsFound: data ? data.length : 0,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[CRON KEEP-ALIVE] Errore inatteso:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Errore keep-alive' },
      { status: 500 }
    );
  }
}
