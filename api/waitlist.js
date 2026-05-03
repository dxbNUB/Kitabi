import { createClient } from '@supabase/supabase-js';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Common disposable / temporary-mail domains. Not exhaustive — just the
// big offenders. Update from disposable-email-domains GitHub list periodically.
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'yopmail.com', 'throwawaymail.com', 'getnada.com', 'sharklasers.com',
  'maildrop.cc', 'tempmailaddress.com', 'fakeinbox.com', 'mintemail.com',
  'temp-mail.org', 'temp-mail.io', 'mohmal.com', 'dispostable.com',
  'mytemp.email', 'tempinbox.com', 'trashmail.com', 'spamgourmet.com',
]);

function isDisposable(email) {
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  return DISPOSABLE_DOMAINS.has(email.slice(at + 1).toLowerCase());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, genre, mode } = req.body;
  if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Valid email required.' });
  if (isDisposable(email))            return res.status(400).json({ error: 'Please use a real email address.' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  const safeEmail = email.trim().toLowerCase().slice(0, 254);
  const safeGenre = ['thriller','fantasy','scifi','historical','business'].includes(genre) ? genre : 'unknown';
  const safeMode  = ['nonwriter','writer'].includes(mode) ? mode : 'nonwriter';

  const { error } = await supabase.from('waitlist').insert([{
    email: safeEmail,
    genre: safeGenre,
    mode:  safeMode,
    timestamp: new Date().toISOString(),
  }]);

  if (error?.code === '23505') {
    return res.status(200).json({ success: true, message: "You're already on the list. We haven't forgotten you." });
  }
  if (error) return res.status(500).json({ error: 'Could not save email. Try again.' });

  return res.status(200).json({ success: true, message: "You're on the list. We'll be in touch." });
}
