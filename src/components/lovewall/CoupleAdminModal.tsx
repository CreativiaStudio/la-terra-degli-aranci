import React, { useState } from 'react';
import { LoveWallPost, PostStatus } from '../../types/lovewall';
import { RsvpSubmission } from '../../types/rsvp';
import {
  getLoveWallPosts,
  updateLoveWallPostStatus,
  deleteLoveWallPost,
  togglePinLoveWallPost,
  getRsvps,
  computeRsvpStats,
  exportRsvpsToCsv,
} from '../../utils/storage';
import { weddingData } from '../../data/weddingData';
import { Lock, Shield, Check, X, Pin, Trash2, Download } from 'lucide-react';

interface CoupleAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (text: string) => void;
}

export const CoupleAdminModal: React.FC<CoupleAdminModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [pin, setPin] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'moderation' | 'rsvp'>('moderation');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [posts, setPosts] = useState<LoveWallPost[]>(() => getLoveWallPosts());
  const [rsvps, setRsvps] = useState<RsvpSubmission[]>(() => getRsvps());

  if (!isOpen) return null;

  const refreshData = () => {
    setPosts(getLoveWallPosts());
    setRsvps(getRsvps());
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownRemaining > 0) return;

    if (pin.trim() === weddingData.adminPin) {
      setIsAuthenticated(true);
      setFailedAttempts(0);
      refreshData();
    } else {
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      if (nextFailed >= 5) {
        setCooldownRemaining(60);
        const interval = setInterval(() => {
          setCooldownRemaining(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const handleStatusChange = (id: string, status: PostStatus) => {
    updateLoveWallPostStatus(id, status);
    refreshData();
    if (onNotify) onNotify(`Stato messaggio aggiornato: ${status}`);
  };

  const handleTogglePin = (id: string) => {
    togglePinLoveWallPost(id);
    refreshData();
  };

  const handleDelete = (id: string) => {
    deleteLoveWallPost(id);
    refreshData();
    if (onNotify) onNotify('Messaggio eliminato.');
  };

  const handleExportCsv = () => {
    exportRsvpsToCsv(rsvps);
    if (onNotify) onNotify('File CSV esportato con successo!');
  };

  const stats = computeRsvpStats(rsvps);

  const filteredPosts = posts.filter(p => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-amalfi-card amalfi-paper rounded-2xl border border-gold-accent/50 shadow-2xl p-6 md:p-8 max-h-[90vh] flex flex-col relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amalfi-border">
          <div className="flex items-center gap-2 text-gold-dark">
            <Shield className="w-6 h-6" />
            <h3 className="font-serif text-xl md:text-2xl text-wedding-charcoal font-semibold">
              Pannello Sposi — Francesca & Ferdinando
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {!isAuthenticated ? (
          /* PIN Authentication Form */
          <div className="py-12 px-4 text-center max-w-sm mx-auto space-y-6">
            <div className="w-14 h-14 rounded-full bg-gold-accent/20 text-gold-dark flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-serif text-xl text-wedding-charcoal font-semibold">
                Accesso Riservato
              </h4>
              <p className="text-xs text-gray-500 font-light mt-1">
                Inserisci il PIN per moderare le dediche e gestire gli RSVP. (Demo PIN: 0712)
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <input
                type="password"
                maxLength={8}
                value={pin}
                disabled={cooldownRemaining > 0}
                onChange={e => setPin(e.target.value)}
                placeholder="Inserisci PIN (0712)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-center font-mono text-lg tracking-widest bg-white focus:outline-none focus:border-gold-accent"
              />

              {failedAttempts > 0 && cooldownRemaining === 0 && (
                <p className="text-xs text-red-600">PIN errato. Tentativi rimasti: {5 - failedAttempts}</p>
              )}

              {cooldownRemaining > 0 && (
                <p className="text-xs text-red-600 font-medium">
                  Troppi tentativi falliti. Riprova tra {cooldownRemaining} secondi.
                </p>
              )}

              <button
                type="submit"
                disabled={cooldownRemaining > 0 || !pin}
                className="w-full py-3 rounded-full bg-cta-bg text-cta-text hover:bg-cta-hover font-medium text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
              >
                Sblocca Pannello
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
              <button
                onClick={() => setActiveTab('moderation')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'moderation'
                    ? 'bg-cta-bg text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Moderazione Love Wall ({posts.filter(p => p.status === 'pending').length} in attesa)
              </button>
              <button
                onClick={() => setActiveTab('rsvp')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'rsvp'
                    ? 'bg-cta-bg text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Registro RSVP ({stats.totalAdults + stats.totalChildren} ospiti)
              </button>
            </div>

            {activeTab === 'moderation' ? (
              /* Love Wall Moderation Tab */
              <div className="space-y-4">
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  {['all', 'pending', 'approved', 'rejected'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${
                        filterStatus === status
                          ? 'bg-gold-accent text-white border-gold-accent'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {status === 'all'
                        ? 'Tutti'
                        : status === 'pending'
                        ? 'In Attesa'
                        : status === 'approved'
                        ? 'Approvati'
                        : 'Rifiutati'}
                    </button>
                  ))}
                </div>

                {filteredPosts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Nessuna dedica trovata per questo filtro.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredPosts.map(post => (
                      <div
                        key={post.id}
                        className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{post.iconEmoji}</span>
                            <span className="font-semibold text-sm text-wedding-charcoal">
                              {post.author}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                post.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : post.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {post.status}
                            </span>
                            {post.pinned && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-champagne/40 text-gold-dark font-medium">
                                Fissato
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-700 italic">"{post.message}"</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {post.status !== 'approved' && (
                            <button
                              onClick={() => handleStatusChange(post.id, 'approved')}
                              className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-xs font-medium flex items-center gap-1"
                              title="Approva"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approva</span>
                            </button>
                          )}

                          {post.status !== 'rejected' && (
                            <button
                              onClick={() => handleStatusChange(post.id, 'rejected')}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-medium flex items-center gap-1"
                              title="Nascondi"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Nascondi</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleTogglePin(post.id)}
                            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 ${
                              post.pinned
                                ? 'bg-gold-accent text-white border-gold-accent'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                            }`}
                            title="Fissa in alto"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs"
                            title="Elimina"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* RSVP Metrics & Export Tab */
              <div className="space-y-6">
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">
                      Adulti Confermati
                    </span>
                    <p className="font-serif text-2xl font-bold text-wedding-charcoal">
                      {stats.totalAdults}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">
                      Bambini
                    </span>
                    <p className="font-serif text-2xl font-bold text-wedding-charcoal">
                      {stats.totalChildren}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">
                      Accompagnatori (+1)
                    </span>
                    <p className="font-serif text-2xl font-bold text-wedding-charcoal">
                      {stats.totalPlusOnes}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">
                      Declinati
                    </span>
                    <p className="font-serif text-2xl font-bold text-wedding-burgundy">
                      {stats.totalDeclined}
                    </p>
                  </div>
                </div>

                {/* Dietary Summary */}
                <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-2">
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    Riepilogo Esigenze Alimentari
                  </h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded bg-toile-light text-toile-deep">
                      Celiachia: {stats.dietaryCounts.celiachia}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-toile-light text-toile-deep">
                      Lattosio: {stats.dietaryCounts.lattosio}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-toile-light text-toile-deep">
                      Vegetariani: {stats.dietaryCounts.vegetariano}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-toile-light text-toile-deep">
                      Vegani: {stats.dietaryCounts.vegano}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-toile-light text-toile-deep">
                      Crostacei: {stats.dietaryCounts.crostacei}
                    </span>
                  </div>
                </div>

                {/* Export CSV Button */}
                <div className="text-center pt-2">
                  <button
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cta-bg text-white hover:bg-cta-hover transition-all text-xs font-semibold uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-gold-foil" />
                    <span>Esporta Registro RSVP in formato CSV (Excel)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
