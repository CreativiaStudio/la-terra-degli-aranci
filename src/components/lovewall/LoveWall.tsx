import React, { useState, useEffect } from 'react';
import { SectionHeading } from '../common/SectionHeading';
import { DeckledCard } from '../common/DeckledCard';
import { LoveWallPost } from '../../types/lovewall';
import { getLoveWallPosts, saveLoveWallPost, likeLoveWallPost } from '../../utils/storage';
import { Heart, Send, Pin, Clock, MessageSquare } from 'lucide-react';

interface LoveWallProps {
  onNotify?: (text: string) => void;
  onOpenAdmin?: () => void;
}

const emojiList = ['🥂', '💍', '❤️', '✨', '🕊️', '🌿', '🎉', '💐'];

export const LoveWall: React.FC<LoveWallProps> = ({ onNotify, onOpenAdmin }) => {
  void onOpenAdmin;
  const [posts, setPosts] = useState<LoveWallPost[]>([]);
  const [author, setAuthor] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🥂');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [pendingNotice, setPendingNotice] = useState<boolean>(false);

  const loadPosts = () => {
    setPosts(getLoveWallPosts());
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !message.trim()) return;

    setIsSubmitting(true);
    const newPost: LoveWallPost = {
      id: `post_${Date.now()}`,
      author: author.trim(),
      message: message.trim(),
      iconEmoji: selectedEmoji,
      createdAt: new Date().toISOString(),
      status: 'pending', // Submissions default to pending
      pinned: false,
      likesCount: 0,
    };

    saveLoveWallPost(newPost);
    setAuthor('');
    setMessage('');
    setIsSubmitting(false);
    setPendingNotice(true);
    loadPosts();

    if (onNotify) {
      onNotify('Grazie! La tua dedica è stata inviata ed è in attesa di approvazione dagli sposi! 💌');
    }
  };

  const handleLike = (id: string) => {
    likeLoveWallPost(id);
    loadPosts();
  };

  // Only approved posts appear in the public wall feed
  const approvedPosts = posts.filter(p => p.status === 'approved');
  const sortedPosts = [...approvedPosts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <section id="lovewall" className="py-12 md:py-16 px-4 max-w-4xl mx-auto">
      <SectionHeading
        subtitle="Pensieri & Dediche"
        title="Love Wall"
        description="Lascia un pensiero speciale o un augurio per Francesca e Ferdinando."
      />

      {/* Dedication Form */}
      <div className="mb-12">
        <DeckledCard variant="gold-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-serif text-xl font-semibold text-wedding-charcoal mb-2">
              Scrivi la tua Dedica agli Sposi
            </h3>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-600 font-medium mb-1">
                Il tuo Nome *
              </label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="es. Marco & Giulia"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-gold-accent text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs uppercase tracking-wider text-gray-600 font-medium">
                  Il tuo Messaggio d'Auguri *
                </label>
                <span className="text-[10px] text-gray-400">
                  {message.length}/500 caratteri
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Scrivi qui le tue parole per gli sposi..."
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-gold-accent text-sm"
              />
            </div>

            {/* Emoji Selector */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-600 font-medium mb-1.5">
                Scegli un simbolo
              </label>
              <div className="flex gap-2">
                {emojiList.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${
                      selectedEmoji === emoji
                        ? 'bg-gold-champagne/40 border-2 border-gold-accent scale-110 shadow-sm'
                        : 'bg-white/80 border border-gray-200 hover:bg-gold-champagne/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {pendingNotice && (
              <div className="p-3 rounded-lg bg-toile-light/60 border border-toile-blue/20 flex items-center gap-2 text-xs text-toile-deep">
                <Clock className="w-4 h-4 text-toile-slate shrink-0" />
                <span>Grazie! Il tuo messaggio è stato registrato ed è in attesa di approvazione dagli sposi.</span>
              </div>
            )}

            <div className="text-right pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-cta-bg text-cta-text hover:bg-cta-hover hover:text-cta-hover-text transition-all text-xs font-medium uppercase tracking-wider shadow-md cursor-pointer"
              >
                <span>Invia Dedica</span>
                <Send className="w-3.5 h-3.5 text-gold-foil" />
              </button>
            </div>
          </form>
        </DeckledCard>
      </div>

      {/* Public Dedications Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 mb-4">
          <h3 className="font-serif text-2xl font-light text-wedding-charcoal uppercase">
            Le Vostre Parole d'Amore ({sortedPosts.length})
          </h3>
        </div>

        {sortedPosts.length === 0 ? (
          <div className="text-center py-12 bg-white/40 rounded-2xl border border-dashed border-gray-300 p-8">
            <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-light">
              Sii il primo a dedicare un pensiero agli sposi!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedPosts.map(post => (
              <DeckledCard
                key={post.id}
                variant={post.pinned ? 'gold-border' : 'light'}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{post.iconEmoji}</span>
                      <div>
                        <h4 className="font-serif text-lg font-semibold text-wedding-charcoal leading-tight">
                          {post.author}
                        </h4>
                        <span className="text-[10px] text-gray-400">
                          {new Date(post.createdAt).toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {post.pinned && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-champagne/40 border border-gold-accent/40 text-gold-dark text-[10px] font-semibold uppercase">
                        <Pin className="w-2.5 h-2.5" />
                        <span>Fissato</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs md:text-sm text-gray-700 font-light leading-relaxed whitespace-pre-wrap italic">
                    "{post.message}"
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-amalfi-border/60 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors p-1"
                  >
                    <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
                    <span>{post.likesCount || 0}</span>
                  </button>
                </div>
              </DeckledCard>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
