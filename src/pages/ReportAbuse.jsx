import { useState } from 'react';
import { motion } from 'framer-motion';
import LegalLayout from '../components/LegalLayout';
import { toast } from '../lib/toast';

const ABUSE_EMAIL = 'abuse@kitabi.ink';

/**
 * Report Abuse — collects details and opens a pre-filled mailto: as a fallback
 * delivery channel. If VITE_FORMSPREE_ID is set, the form POSTs to Formspree
 * instead so reports land in your inbox without the user opening their mail client.
 */
export default function ReportAbuse() {
  const [form, setForm] = useState({
    reporterEmail: '',
    targetUrl: '',
    category: 'illegal',
    description: '',
  });
  const [status, setStatus] = useState('idle');

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error('Please describe what you saw.');
      return;
    }
    // Reject obviously dangerous URI schemes in the location field
    if (/^\s*(javascript|data|vbscript|file):/i.test(form.targetUrl)) {
      toast.error('Invalid URL — drop the link and describe the location in plain text.');
      return;
    }
    if (form.description.length > 5000) {
      toast.error('Description is too long (5000 characters max).');
      return;
    }
    setStatus('loading');

    const formspreeId = import.meta.env.VITE_FORMSPREE_ID;
    const subject = `[Abuse Report] ${form.category}`;
    const bodyText =
      `Reporter: ${form.reporterEmail || '(anonymous)'}\n` +
      `Target URL or location: ${form.targetUrl || '(not specified)'}\n` +
      `Category: ${form.category}\n\nDescription:\n${form.description}`;

    try {
      if (formspreeId) {
        const res = await fetch(`https://formspree.io/f/${formspreeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ subject, message: bodyText, source: 'kitabi-abuse-report', ...form }),
        });
        if (res.ok) {
          setStatus('success');
          toast.success('Report received. We respond within 24 hours.');
          return;
        }
      }
      // Fallback: open the user's mail client with a pre-filled message
      const href = `mailto:${ABUSE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      window.location.href = href;
      setStatus('success');
    } catch {
      setStatus('error');
      toast.error('Could not submit report. Email us directly.');
    }
  };

  return (
    <LegalLayout
      eyebrow="Trust & Safety"
      title="Report abuse"
      intro="See content that breaks our rules or UAE law? Tell us. We review every report within 24 hours and act within 48."
      lastUpdated="2026-05-02"
    >
      {status === 'success' ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl border border-emerald-300 bg-emerald-50"
        >
          <h2 style={{ marginTop: 0 }}>Report received</h2>
          <p className="text-emerald-900">
            Thank you. Our trust & safety team will review your report and take action within 48 hours.
            For illegal content, we will preserve evidence and may cooperate with UAE law-enforcement.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={submit} className="space-y-5 not-prose">
          <div>
            <label htmlFor="reporterEmail" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
              Your email <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="reporterEmail"
              type="email"
              value={form.reporterEmail}
              onChange={update('reporterEmail')}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-[#1A1A1A]
                         placeholder:text-gray-400 focus:border-[#C8964D] transition shadow-sm"
            />
            <p className="text-xs text-gray-500 mt-1">We may contact you if we need more detail.</p>
          </div>

          <div>
            <label htmlFor="targetUrl" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
              Where did you see it?
            </label>
            <input
              id="targetUrl"
              type="text"
              value={form.targetUrl}
              onChange={update('targetUrl')}
              placeholder="URL, account name, or page where you encountered the content"
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-[#1A1A1A]
                         placeholder:text-gray-400 focus:border-[#C8964D] transition shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
              What kind of issue?
            </label>
            <select
              id="category"
              value={form.category}
              onChange={update('category')}
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-[#1A1A1A]
                         focus:border-[#C8964D] transition shadow-sm"
            >
              <option value="illegal">Illegal content (UAE law)</option>
              <option value="hate">Hate speech / discrimination</option>
              <option value="csam">Child safety concern</option>
              <option value="violence">Violence / self-harm / weapons</option>
              <option value="religious">Religious or cultural offence</option>
              <option value="copyright">Copyright / IP infringement</option>
              <option value="impersonation">Impersonation / fraud</option>
              <option value="privacy">Privacy violation / doxxing</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
              Describe what you saw <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={update('description')}
              rows={5}
              required
              placeholder="What was the content? Why does it violate our terms or UAE law? Include quotes or screenshots if you can."
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-[#1A1A1A]
                         placeholder:text-gray-400 focus:border-[#C8964D] transition shadow-sm resize-y"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center pt-2">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-2.5 bg-[#C8964D] hover:bg-[#b88340] text-white font-semibold rounded-lg
                         transition disabled:opacity-60 shadow-sm"
            >
              {status === 'loading' ? 'Sending…' : 'Submit report'}
            </button>
            <p className="text-xs text-gray-500">
              Or email <a href={`mailto:${ABUSE_EMAIL}`} className="text-[#C8964D]">{ABUSE_EMAIL}</a> directly.
            </p>
          </div>
        </form>
      )}

      <hr />

      <h2>What happens next</h2>
      <ul>
        <li>We review every report within 24 hours.</li>
        <li>Confirmed violations are removed within 48 hours.</li>
        <li>Illegal content is reported to UAE authorities and evidence preserved.</li>
        <li>Repeat violators are permanently banned.</li>
      </ul>

      <h2>Emergencies</h2>
      <p>
        If you believe someone is in immediate danger, contact local emergency services first.
        For child safety concerns in the UAE, contact the Child Protection Centre (116111).
      </p>
    </LegalLayout>
  );
}
