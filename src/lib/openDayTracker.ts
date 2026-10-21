import { getStore, saveStore } from "@/lib/localDb";

export interface OpenDayScanEvent {
  timestamp: string;
  source: string; // es: 'qr_tavolo', 'qr', 'direct'
  userAgent?: string;
}

export function recordOpenDayScan(source: string = "qr", userAgent?: string) {
  try {
    const store: any = getStore();
    if (!store.openday_stats) {
      store.openday_stats = {
        total_scans: 0,
        unique_devices: 0,
        scans_history: [],
      };
    }

    store.openday_stats.total_scans = (store.openday_stats.total_scans || 0) + 1;
    if (!store.openday_stats.scans_history) {
      store.openday_stats.scans_history = [];
    }

    // Mantieni gli ultimi 500 eventi per analisi
    store.openday_stats.scans_history.unshift({
      timestamp: new Date().toISOString(),
      source,
      userAgent: userAgent ? userAgent.slice(0, 150) : "Mobile Browser",
    });

    if (store.openday_stats.scans_history.length > 500) {
      store.openday_stats.scans_history = store.openday_stats.scans_history.slice(0, 500);
    }

    saveStore(store);
    return { success: true, count: store.openday_stats.total_scans };
  } catch (e) {
    console.warn("Avviso tracciamento scansione Open Day:", e);
    return { success: false, count: 0 };
  }
}

export function getOpenDayStats() {
  try {
    const store: any = getStore();
    const stats = store.openday_stats || { total_scans: 0, scans_history: [] };
    const clients = store.clients || [];
    const openDayLeads = clients.filter(
      (c: any) =>
        c?.provenienza === "QR Code Open Day" ||
        (c?.tags && c.tags.includes("Open Day"))
    );

    const conversionRate =
      stats.total_scans > 0
        ? Math.round((openDayLeads.length / stats.total_scans) * 100)
        : 0;

    return {
      totalScans: stats.total_scans,
      totalRegistered: openDayLeads.length,
      conversionRate,
      recentScans: (stats.scans_history || []).slice(0, 10),
    };
  } catch {
    return { totalScans: 0, totalRegistered: 0, conversionRate: 0, recentScans: [] };
  }
}
