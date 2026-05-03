import { useState } from 'react';
import { useSession } from '../store/session';
import { analytics } from '../lib/analytics';

const COPY_VARIANTS = [
  "That's your one free chapter. Drop your email — you'll be first in line.",
  "Your story has legs. Full access lets you write the whole thing.",
];

export default function WaitlistPrompt({ variant = 0 }) {
  const { genre, mode } = useSession();
  const [email, setEmail]     = useState('');
  const [status, setStatus]   = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');

    // Prefer Formspree if VITE_FORMSPREE_ID is set in .env.local; fall back to /api/waitlist (Supabase)
    const formspreeId = import.meta.env.VITE_FORMSPREE_ID;

    try {
      if (formspreeId) {
        const res = await fetch(`https://formspree.io/f/${formspreeId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            genre: genre || 'unknown',
            mode:  mode  || 'nonwriter',
            source: 'kitabi-waitlist',
          }),
        });
        if (res.ok) {
          setStatus('success');
          setMessage("You're on the list. We'll be in touch.");
          analytics.waitlistJoined(genre, mode);
          return;
        }
        const errBody = await res.json().catch(() => ({}));
        setStatus('error');
        setMessage(errBody?.error || 'Could not save email. Try again.');
        return;
      }

      // Fallback path
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, genre, mode }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        analytics.waitlistJoined(genre, mode);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Could not connect. Try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="p-4 rounded-lg border border-[#C8964D]/40 bg-[#FFF7EB] text-center">
        <p className="text-[#8b6a2f] font-medium">{message}</p>
      </div>
    );
  }

  return (
    <div className="text-left">
      <p className="text-gray-700 text-sm mb-3 text-center">
        {COPY_VARIANTS[variant % COPY_VARIANTS.length]}
      </p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="waitlist-email" className="sr-only">Email address</label>
        <input
          id="waitlist-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-[#1A1A1A] text-sm
                     placeholder:text-gray-400 focus:border-[#C8964D] transition shadow-sm"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-5 py-2.5 bg-[#C8964D] text-white font-semibold text-sm rounded-lg
                     hover:bg-[#b88340] transition disabled:opacity-60 shadow-sm"
        >
          {status === 'loading' ? '...' : 'Notify Me →'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-red-600 text-xs mt-2 text-center">{message}</p>
      )}
    </div>
  );
}
