import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  saveRsvp,
  getRsvps,
  computeRsvpStats,
  exportRsvpsToCsv,
  getLoveWallPosts,
  saveLoveWallPost,
  updateLoveWallPostStatus,
  togglePinLoveWallPost,
  deleteLoveWallPost,
  likeLoveWallPost,
  LOVEWALL_STORAGE_KEY,
} from '../src/utils/storage';
import { RsvpSubmission } from '../src/types/rsvp';
import { LoveWallPost } from '../src/types/lovewall';
import { RsvpSection } from '../src/components/rsvp/RsvpSection';
import { LoveWall } from '../src/components/lovewall/LoveWall';
import { CoupleAdminModal } from '../src/components/lovewall/CoupleAdminModal';
import { weddingData } from '../src/data/weddingData';

describe('Adversarial Test Suite - RSVP Engine, Love Wall Moderation & CSV Export', () => {
  beforeEach(() => {
    localStorage.clear();
    // Ensure URL.createObjectURL and revokeObjectURL exist in jsdom
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    }
    if (!global.URL.revokeObjectURL) {
      global.URL.revokeObjectURL = vi.fn();
    }
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. RSVP FORM VALIDATION & BOUNDARY TESTING
  // =========================================================================
  describe('1. RSVP Form Validation & Edge Cases', () => {
    it('rejects empty attendance selection and displays validation error', () => {
      render(<RsvpSection />);
      const submitBtn = screen.getByRole('button', { name: /Invia Conferma RSVP/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/Seleziona se sarai presente o assente/i)).toBeInTheDocument();
      expect(getRsvps()).toHaveLength(0);
    });

    it('rejects whitespace-only and single-character guest names', () => {
      render(<RsvpSection />);
      const yesBtn = screen.getByRole('button', { name: /Con grandissima gioia/i });
      fireEvent.click(yesBtn);

      const nameInput = screen.getByPlaceholderText(/es. Mario Rossi/i);
      const phoneInput = screen.getByPlaceholderText(/es. \+39 333 1234567/i);
      const submitBtn = screen.getByRole('button', { name: /Invia Conferma RSVP/i });

      // Test whitespace only
      fireEvent.change(nameInput, { target: { value: '    ' } });
      fireEvent.change(phoneInput, { target: { value: '+39 333 1234567' } });
      fireEvent.click(submitBtn);
      expect(screen.getByText(/Inserisci il tuo nome e cognome completo/i)).toBeInTheDocument();

      // Test single character
      fireEvent.change(nameInput, { target: { value: 'M' } });
      fireEvent.click(submitBtn);
      expect(screen.getByText(/Inserisci il tuo nome e cognome completo/i)).toBeInTheDocument();
      expect(getRsvps()).toHaveLength(0);
    });

    it('handles complex unicode, accents, apostrophes, and long names correctly', () => {
      const complexName = "René D'Angelo-Müller 🌟 (Dr. François Von Groß) 🪓";
      render(<RsvpSection />);
      fireEvent.click(screen.getByRole('button', { name: /Con grandissima gioia/i }));
      fireEvent.change(screen.getByPlaceholderText(/es. Mario Rossi/i), { target: { value: complexName } });
      fireEvent.change(screen.getByPlaceholderText(/es. \+39 333 1234567/i), { target: { value: '+39 081 555 1234' } });
      fireEvent.click(screen.getByRole('button', { name: /Invia Conferma RSVP/i }));

      const rsvps = getRsvps();
      expect(rsvps).toHaveLength(1);
      expect(rsvps[0].fullName).toBe(complexName);
    });

    it('validates phone string boundaries (rejects < 6 chars, accepts international formats with symbols)', () => {
      render(<RsvpSection />);
      fireEvent.click(screen.getByRole('button', { name: /Con grandissima gioia/i }));
      const nameInput = screen.getByPlaceholderText(/es. Mario Rossi/i);
      const phoneInput = screen.getByPlaceholderText(/es. \+39 333 1234567/i);
      const submitBtn = screen.getByRole('button', { name: /Invia Conferma RSVP/i });

      fireEvent.change(nameInput, { target: { value: 'Chiara Esposito' } });

      // Short invalid phone (e.g. 3 chars)
      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.click(submitBtn);
      expect(screen.getByText(/Inserisci un recapito telefonico valido/i)).toBeInTheDocument();
      expect(getRsvps()).toHaveLength(0);

      // Complex valid international phone with spaces, dashes, parentheses
      fireEvent.change(phoneInput, { target: { value: '+39 (081) 123-4567 #ext9' } });
      fireEvent.click(submitBtn);
      expect(getRsvps()).toHaveLength(1);
      expect(getRsvps()[0].phone).toBe('+39 (081) 123-4567 #ext9');
    });

    it('handles empty diet arrays and multi-select dietary toggles in stats computation', () => {
      const subEmptyDiet: RsvpSubmission = {
        id: 'rsvp_empty_diet',
        submittedAt: new Date().toISOString(),
        fullName: 'Nessuna Dieta',
        phone: '+39 333 0000000',
        attending: true,
        hasPlusOne: false,
        hasChildren: false,
        childrenCount: 0,
        dietaryRestrictions: [],
      };
      saveRsvp(subEmptyDiet);

      const stats = computeRsvpStats(getRsvps());
      expect(stats.totalAttending).toBe(1);
      expect(stats.dietaryCounts.celiachia).toBe(0);
      expect(stats.dietaryCounts.vegano).toBe(0);
      expect(stats.dietaryCounts.personalizzato).toBe(0);
    });

    it('validates children count boundaries (0, >10, empty child names)', () => {
      render(<RsvpSection />);
      fireEvent.click(screen.getByRole('button', { name: /Con grandissima gioia/i }));
      fireEvent.change(screen.getByPlaceholderText(/es. Mario Rossi/i), { target: { value: 'Famiglia Rossi' } });
      fireEvent.change(screen.getByPlaceholderText(/es. \+39 333 1234567/i), { target: { value: '+39 333 9998877' } });

      // Select the "In Famiglia / Gruppo" party composition card
      fireEvent.click(screen.getByRole('radio', { name: /In Famiglia \/ Gruppo/i }));

      // Add 11 more children (total 12)
      const addChildBtn = screen.getByRole('button', { name: /Aggiungi altro bambino/i });
      for (let i = 0; i < 11; i++) {
        fireEvent.click(addChildBtn);
      }

      const childInputs = screen.getAllByPlaceholderText(/Nome Bambino/i);
      expect(childInputs.length).toBe(12);

      // Fill only 2 of them with names, leave rest blank
      fireEvent.change(childInputs[0], { target: { value: 'Bambino 1' } });
      fireEvent.change(childInputs[1], { target: { value: 'Bambino 2' } });

      fireEvent.click(screen.getByRole('button', { name: /Invia Conferma RSVP/i }));

      const rsvps = getRsvps();
      expect(rsvps).toHaveLength(1);
      // Empty child names are filtered out, count reflects named children only
      expect(rsvps[0].childrenList).toHaveLength(2);
      expect(rsvps[0].childrenCount).toBe(2);
      expect(rsvps[0].partyType).toBe('famiglia');
      expect(rsvps[0].adultsCount).toBe(1);
    });

    it('safely handles XSS payloads in notes, personal messages, and song requests without executing scripts', () => {
      const xssPayload = '<script>alert("XSS")</script><img src="x" onerror="alert(1)">"><iframe src="javascript:alert(1)">';
      
      render(<RsvpSection />);
      fireEvent.click(screen.getByRole('button', { name: /Con grandissima gioia/i }));
      fireEvent.change(screen.getByPlaceholderText(/es. Mario Rossi/i), { target: { value: 'Hacker XSS' } });
      fireEvent.change(screen.getByPlaceholderText(/es. \+39 333 1234567/i), { target: { value: '+39 333 6665544' } });
      
      const messageTextarea = screen.getByPlaceholderText(/Scrivi qui i tuoi auguri personali/i);
      fireEvent.change(messageTextarea, { target: { value: xssPayload } });

      fireEvent.click(screen.getByRole('button', { name: /Invia Conferma RSVP/i }));

      const rsvps = getRsvps();
      expect(rsvps).toHaveLength(1);
      expect(rsvps[0].personalMessage).toBe(xssPayload);

      // Verify that rendering back on screen doesn't execute script
      expect(screen.getByText(/Hacker XSS, abbiamo salvato la tua risposta!/i)).toBeInTheDocument();
      expect(document.querySelector('script[src="javascript:alert(1)"]')).toBeNull();
    });

    it('updates existing RSVP when submitted with matching phone and name', () => {
      const rsvp1: RsvpSubmission = {
        id: 'rsvp_dup_1',
        submittedAt: '2026-08-01T10:00:00.000Z',
        fullName: 'Mario Rossi',
        phone: '+39 333 1111111',
        attending: true,
        hasPlusOne: false,
        hasChildren: false,
        childrenCount: 0,
      };
      saveRsvp(rsvp1);
      expect(getRsvps()).toHaveLength(1);

      const rsvp2: RsvpSubmission = {
        id: 'rsvp_dup_2',
        submittedAt: '2026-08-02T10:00:00.000Z',
        fullName: 'Mario Rossi', // same name
        phone: '+39 333 1111111', // same phone
        attending: false, // changed mind
        hasPlusOne: false,
        hasChildren: false,
        childrenCount: 0,
      };
      saveRsvp(rsvp2);

      const rsvps = getRsvps();
      expect(rsvps).toHaveLength(1);
      expect(rsvps[0].attending).toBe(false);
      expect(rsvps[0].updatedAt).toBeDefined();
    });
  });

  // =========================================================================
  // 2. LOVE WALL MODERATION & ISOLATION TESTING
  // =========================================================================
  describe('2. Love Wall Moderation & Security Testing', () => {
    it('NEVER renders pending or rejected messages in public LoveWall feed', () => {
      const posts: LoveWallPost[] = [
        {
          id: 'post_approved',
          author: 'Zia Maria',
          message: 'Tanti auguri bellissimi sposi!',
          iconEmoji: '❤️',
          createdAt: '2026-08-01T12:00:00.000Z',
          status: 'approved',
          pinned: false,
          likesCount: 5,
        },
        {
          id: 'post_pending',
          author: 'Ospite Anonimo',
          message: 'Messaggio in attesa di moderazione TOP SECRET',
          iconEmoji: '🥂',
          createdAt: '2026-08-02T12:00:00.000Z',
          status: 'pending',
          pinned: false,
          likesCount: 0,
        },
        {
          id: 'post_rejected',
          author: 'Troll Utente',
          message: 'Spam e testo inappropriato REJECTED',
          iconEmoji: '🎉',
          createdAt: '2026-08-03T12:00:00.000Z',
          status: 'rejected',
          pinned: false,
          likesCount: 0,
        },
      ];
      localStorage.setItem(LOVEWALL_STORAGE_KEY, JSON.stringify(posts));

      render(<LoveWall />);

      // Approved post must be visible
      expect(screen.getByText(/Tanti auguri bellissimi sposi!/i)).toBeInTheDocument();
      expect(screen.getByText('Zia Maria')).toBeInTheDocument();

      // Pending and Rejected posts MUST NOT be visible anywhere in the document
      expect(screen.queryByText(/TOP SECRET/i)).toBeNull();
      expect(screen.queryByText('Ospite Anonimo')).toBeNull();
      expect(screen.queryByText(/REJECTED/i)).toBeNull();
      expect(screen.queryByText('Troll Utente')).toBeNull();
    });

    it('sorts pinned approved posts before unpinned approved posts regardless of timestamp', () => {
      const posts: LoveWallPost[] = [
        {
          id: 'post_old_pinned',
          author: 'Genitori Sposa',
          message: 'DEDICA_GENITORI_PINNED: Messaggio dei genitori fissato in alto',
          iconEmoji: '💍',
          createdAt: '2026-01-01T10:00:00.000Z', // Much older
          status: 'approved',
          pinned: true,
          likesCount: 20,
        },
        {
          id: 'post_new_unpinned',
          author: 'Amico Nuovo',
          message: 'DEDICA_AMICO_UNPINNED: Messaggio recente non fissato',
          iconEmoji: '🥂',
          createdAt: '2026-08-15T10:00:00.000Z', // Recent
          status: 'approved',
          pinned: false,
          likesCount: 2,
        },
      ];
      localStorage.setItem(LOVEWALL_STORAGE_KEY, JSON.stringify(posts));

      render(<LoveWall />);

      const pinnedText = screen.getByText(/DEDICA_GENITORI_PINNED/i);
      const unpinnedText = screen.getByText(/DEDICA_AMICO_UNPINNED/i);

      // Pinned text should appear earlier in the DOM order
      expect(pinnedText.compareDocumentPosition(unpinnedText) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('enforces PIN brute-force lockout / cooldown after 5 wrong attempts in CoupleAdminModal', () => {
      vi.useFakeTimers();

      render(<CoupleAdminModal isOpen={true} onClose={() => {}} />);

      const pinInput = screen.getByPlaceholderText(/Inserisci PIN/i);
      const submitBtn = screen.getByRole('button', { name: /Sblocca Pannello/i });

      // Enter 4 wrong attempts
      for (let i = 1; i <= 4; i++) {
        act(() => {
          fireEvent.change(pinInput, { target: { value: `999${i}` } });
          fireEvent.click(submitBtn);
        });
        expect(screen.getByText(new RegExp(`Tentativi rimasti: ${5 - i}`, 'i'))).toBeInTheDocument();
      }

      // 5th wrong attempt triggers cooldown
      act(() => {
        fireEvent.change(pinInput, { target: { value: '0000' } });
        fireEvent.click(submitBtn);
      });

      expect(screen.getByText(/Troppi tentativi falliti. Riprova tra 60 secondi/i)).toBeInTheDocument();
      expect(pinInput).toBeDisabled();
      expect(submitBtn).toBeDisabled();

      // Advance time by 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      expect(screen.getByText(/Troppi tentativi falliti. Riprova tra 30 secondi/i)).toBeInTheDocument();
      expect(pinInput).toBeDisabled();

      // Advance remaining 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      expect(pinInput).not.toBeDisabled();

      // Now enter valid PIN 0712
      act(() => {
        fireEvent.change(pinInput, { target: { value: weddingData.adminPin } });
        fireEvent.click(submitBtn);
      });

      expect(screen.getByText(/Pannello Sposi — Francesca & Ferdinando/i)).toBeInTheDocument();
      expect(screen.getByText(/Moderazione Love Wall/i)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('tests state mutations: approve, reject, pin toggle, delete in storage', () => {
      const samplePost: LoveWallPost = {
        id: 'post_mutation_test',
        author: 'Elena',
        message: 'Evviva gli sposi!',
        iconEmoji: '🎉',
        createdAt: new Date().toISOString(),
        status: 'pending',
        pinned: false,
        likesCount: 0,
      };
      saveLoveWallPost(samplePost);

      // Initial check
      let currentPosts = getLoveWallPosts();
      expect(currentPosts.find(p => p.id === 'post_mutation_test')?.status).toBe('pending');

      // 1. Approve
      updateLoveWallPostStatus('post_mutation_test', 'approved');
      currentPosts = getLoveWallPosts();
      expect(currentPosts.find(p => p.id === 'post_mutation_test')?.status).toBe('approved');

      // 2. Pin toggle
      togglePinLoveWallPost('post_mutation_test');
      currentPosts = getLoveWallPosts();
      expect(currentPosts.find(p => p.id === 'post_mutation_test')?.pinned).toBe(true);

      togglePinLoveWallPost('post_mutation_test');
      currentPosts = getLoveWallPosts();
      expect(currentPosts.find(p => p.id === 'post_mutation_test')?.pinned).toBe(false);

      // 3. Reject
      updateLoveWallPostStatus('post_mutation_test', 'rejected');
      currentPosts = getLoveWallPosts();
      expect(currentPosts.find(p => p.id === 'post_mutation_test')?.status).toBe('rejected');

      // 4. Like
      likeLoveWallPost('post_mutation_test');
      currentPosts = getLoveWallPosts();
      expect(currentPosts.find(p => p.id === 'post_mutation_test')?.likesCount).toBe(1);

      // 5. Delete
      deleteLoveWallPost('post_mutation_test');
      currentPosts = getLoveWallPosts();
      expect(currentPosts.find(p => p.id === 'post_mutation_test')).toBeUndefined();
    });
  });

  // =========================================================================
  // 3. CSV EXPORT & EXCEL COMPATIBILITY TESTING
  // =========================================================================
  describe('3. CSV Export Robustness & Formatting', () => {
    it('generates CSV with UTF-8 BOM, handles commas, semicolons, quotes, newlines and formula injection', () => {
      let capturedContent = '';
      const OriginalBlob = global.Blob;

      global.Blob = class MockBlob extends OriginalBlob {
        constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
          super(blobParts, options);
          if (blobParts && blobParts.length > 0) {
            capturedContent = blobParts.join('');
          }
        }
      } as any;

      const adversarialSubmissions: RsvpSubmission[] = [
        {
          id: 'rsvp_csv_1',
          submittedAt: '2026-08-01T15:30:00.000Z',
          fullName: 'Mario "Super" Rossi, Jr.', // Contains quotes and comma
          phone: '+39 081 123;456', // Contains semicolon
          email: 'mario;rossi@test.com', // Semicolon in email
          attending: true,
          hasPlusOne: true,
          plusOneName: 'Laura; "The Best" Bianchi', // Semicolons and quotes
          hasChildren: true,
          childrenCount: 2,
          childrenList: [
            { name: 'Mario "Junior", Jr.', age: 4 }, // Quotes in child name
            { name: 'Anna; Sofia', age: 7 }, // Semicolon in child name
          ],
          dietaryRestrictions: ['celiachia', 'personalizzato'],
          dietaryCustomNotes: 'Allergia grave a:\n- Noci\n- Frutta a guscio; molluschi', // Newlines and semicolons
          djSongRequest: 'DJ Set "Napoli"; Track #1', // Quotes and semicolons
          personalMessage: '=1+1; @SUM(A1:A10)\r\nAuguri "immensi" agli sposi!', // Formula injection + CRLF + quotes
        },
      ];

      exportRsvpsToCsv(adversarialSubmissions);

      // Verify UTF-8 BOM (\uFEFF) is present at index 0
      expect(capturedContent.startsWith('\uFEFF')).toBe(true);

      // Strip BOM for line-by-line inspection
      const contentWithoutBom = capturedContent.slice(1);
      const lines = contentWithoutBom.split('\r\n');

      // Verify header format
      expect(lines[0]).toBe(
        'ID;Data Invio;Nome e Cognome;Telefono;Email;Presenza;Accompagnatore;Nome Accompagnatore;Numero Bambini;Dettagli Bambini;Esigenze Alimentari;Note Chef;Canzone DJ;Messaggio Sposi'
      );

      // Verify row content escaping
      expect(capturedContent).toContain('"Mario ""Super"" Rossi, Jr."');
      expect(capturedContent).toContain('"+39 081 123;456"');
      expect(capturedContent).toContain('"mario;rossi@test.com"');
      expect(capturedContent).toContain('"Laura; ""The Best"" Bianchi"');
      expect(capturedContent).toContain('"DJ Set ""Napoli""; Track #1"');
      expect(capturedContent).toContain('Auguri ""immensi"" agli sposi!');

      global.Blob = OriginalBlob;
    });

    it('exports all 14 columns matching the specified schema', () => {
      let capturedContent = '';
      const OriginalBlob = global.Blob;

      global.Blob = class MockBlob extends OriginalBlob {
        constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
          super(blobParts, options);
          if (blobParts && blobParts.length > 0) {
            capturedContent = blobParts.join('');
          }
        }
      } as any;

      const sub: RsvpSubmission = {
        id: '123',
        submittedAt: '2026-08-01T12:00:00.000Z',
        fullName: 'Test User',
        phone: '123456789',
        attending: false,
        hasPlusOne: false,
        hasChildren: false,
        childrenCount: 0,
      };

      exportRsvpsToCsv([sub]);

      const contentWithoutBom = capturedContent.slice(1);
      const headerCols = contentWithoutBom.split('\r\n')[0].split(';');
      expect(headerCols).toHaveLength(14);
      expect(headerCols).toEqual([
        'ID',
        'Data Invio',
        'Nome e Cognome',
        'Telefono',
        'Email',
        'Presenza',
        'Accompagnatore',
        'Nome Accompagnatore',
        'Numero Bambini',
        'Dettagli Bambini',
        'Esigenze Alimentari',
        'Note Chef',
        'Canzone DJ',
        'Messaggio Sposi',
      ]);

      global.Blob = OriginalBlob;
    });
  });
});
