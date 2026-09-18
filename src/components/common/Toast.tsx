import React from 'react';
import { CheckCircle, Info, Sparkles, Heart } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'gold' | 'heart';
}

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ messages, onDismiss }) => {
  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
      {messages.map(msg => {
        const Icon =
          msg.type === 'heart'
            ? Heart
            : msg.type === 'gold'
            ? Sparkles
            : msg.type === 'info'
            ? Info
            : CheckCircle;

        return (
          <div
            key={msg.id}
            onClick={() => onDismiss(msg.id)}
            className="pointer-events-auto cursor-pointer flex items-center gap-3 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-gold-accent/40 shadow-2xl text-wedding-charcoal transition-all transform animate-bounce-short hover:scale-[1.02]"
          >
            <div className="p-2 rounded-full bg-gold-accent/15 text-gold-dark shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium flex-1 leading-snug">{msg.text}</p>
            <button
              onClick={e => {
                e.stopPropagation();
                onDismiss(msg.id);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};
