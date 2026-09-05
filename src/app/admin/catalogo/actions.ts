'use server';

import { revalidatePath } from 'next/cache';
import { getServiceSupabase } from '@/lib/supabase';
import {
  getServicesCatalogLocal,
  saveServicesCatalogLocal,
  updateServiceCatalogItemLocal,
  resetServicesCatalogLocal
} from '@/lib/localDb';
import {
  getServicesCatalogFast,
  mapServiceCatalogItemToSupabaseRow,
  mapSupabaseRowToServiceCatalogItem
} from '@/lib/dataHelper';
import { SERVICES_CATALOG, ServiceCatalogItem } from '@/lib/servicesCatalog';

/**
 * Recupera l'intero catalogo servizi sincronizzato (Supabase con fallback locale).
 */
export async function fetchCatalogAction(): Promise<{ success: boolean; data: ServiceCatalogItem[]; error?: string }> {
  try {
    const items = await getServicesCatalogFast();
    return { success: true, data: items };
  } catch (err: any) {
    console.error('Error in fetchCatalogAction:', err);
    return { success: true, data: getServicesCatalogLocal() };
  }
}

/**
 * Salva o aggiorna un singolo servizio nel catalogo (sia su Supabase che nel DB locale).
 */
export async function saveServiceItemAction(item: ServiceCatalogItem): Promise<{ success: boolean; data?: ServiceCatalogItem; error?: string }> {
  try {
    // 1. Aggiornamento nel DB Locale di sicurezza immediato
    const updatedLocal = updateServiceCatalogItemLocal(item);

    // 2. Sincronizzazione su Supabase
    try {
      const supabase = getServiceSupabase();
      const row = mapServiceCatalogItemToSupabaseRow(item);

      const { data, error } = await supabase
        .from('services_catalog')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.warn('Supabase upsert warning (fallback active):', error.message);
      }
    } catch (sbError: any) {
      console.warn('Supabase network unreachable, saved to local fallback:', sbError.message);
    }

    revalidatePath('/admin/catalogo');
    revalidatePath('/admin/simulatore');
    revalidatePath('/admin');

    return {
      success: true,
      data: updatedLocal || item
    };
  } catch (err: any) {
    console.error('Error in saveServiceItemAction:', err);
    return {
      success: false,
      error: err.message || 'Errore durante il salvataggio del servizio'
    };
  }
}

/**
 * Inizializza il catalogo con i 129 servizi ufficiali se la tabella Supabase è vuota.
 */
export async function seedCatalogIfEmptyAction(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const supabase = getServiceSupabase();
    const { count, error } = await supabase
      .from('services_catalog')
      .select('*', { count: 'exact', head: true });

    if (!error && (count === null || count === 0)) {
      const rows = SERVICES_CATALOG.map(mapServiceCatalogItemToSupabaseRow);
      const { error: insertError } = await supabase
        .from('services_catalog')
        .upsert(rows, { onConflict: 'id' });

      if (insertError) {
        console.error('Error seeding Supabase catalog:', insertError.message);
      } else {
        console.log(`Successfully seeded ${rows.length} items to Supabase services_catalog.`);
      }
    }

    // Assicura anche il DB locale
    const localItems = getServicesCatalogLocal();
    revalidatePath('/admin/catalogo');

    return { success: true, count: localItems.length };
  } catch (err: any) {
    console.warn('Seed action error (local fallback active):', err.message);
    return { success: true, count: getServicesCatalogLocal().length };
  }
}

/**
 * Salva l'intero catalogo in bulk.
 */
export async function saveBulkCatalogAction(items: ServiceCatalogItem[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    saveServicesCatalogLocal(items);

    try {
      const supabase = getServiceSupabase();
      const rows = items.map(mapServiceCatalogItemToSupabaseRow);
      await supabase
        .from('services_catalog')
        .upsert(rows, { onConflict: 'id' });
    } catch (sbError: any) {
      console.warn('Supabase bulk save warning:', sbError.message);
    }

    revalidatePath('/admin/catalogo');
    return { success: true, count: items.length };
  } catch (err: any) {
    console.error('Error in saveBulkCatalogAction:', err);
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Ripristina il catalogo ai 129 servizi originali di fabbrica TDA.
 */
export async function resetCatalogAction(): Promise<{ success: boolean; data: ServiceCatalogItem[]; error?: string }> {
  try {
    const resetItems = resetServicesCatalogLocal();

    try {
      const supabase = getServiceSupabase();
      const rows = resetItems.map(mapServiceCatalogItemToSupabaseRow);
      await supabase
        .from('services_catalog')
        .upsert(rows, { onConflict: 'id' });
    } catch (sbError: any) {
      console.warn('Supabase reset warning:', sbError.message);
    }

    revalidatePath('/admin/catalogo');
    return { success: true, data: resetItems };
  } catch (err: any) {
    return { success: false, data: getServicesCatalogLocal(), error: err.message };
  }
}
