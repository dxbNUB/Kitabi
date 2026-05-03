/**
 * Shared chapter-export helpers. Used by both ChapterDisplay (raw chapter) and
 * Editor (edited HTML). Pure functions returning Blobs + a download trigger.
 */
import { pdf } from '@react-pdf/renderer';

export function fileSlug(title) {
  return (title || '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'chapter';
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTxt({ plainText, title, genre = 'Fiction' }) {
  const header = `${title}\n${genre.toUpperCase()} — Chapter One\n\n`;
  const blob = new Blob([header + plainText], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `${fileSlug(title)}-chapter-1.txt`);
}

/**
 * Word-compatible HTML doc. Opens cleanly in Word, Google Docs, Pages, LibreOffice.
 * Accepts either rich HTML (from the editor) or plain text (from raw chapter).
 */
export function exportDocx({ html, plainText, title, genre = 'Fiction' }) {
  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const bodyHtml = html ?? (plainText
    ? plainText.split(/\n\n+/).filter(Boolean)
        .map((p) => `<p>${escape(p).replace(/\n/g, '<br/>')}</p>`).join('\n')
    : '');

  const doc = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escape(title || 'Chapter')}</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
  <style>
    @page { margin: 1in; }
    body  { font-family: 'Georgia', serif; font-size: 12pt; line-height: 1.8; color: #2C2416; }
    h1    { font-family: 'Georgia', serif; font-size: 22pt; text-align: center; margin: 0 0 6pt 0; }
    h2    { font-size: 16pt; margin-top: 18pt; }
    h3    { font-size: 14pt; margin-top: 12pt; }
    .meta { text-align: center; font-style: italic; font-size: 10pt; color: #888; margin-bottom: 36pt; letter-spacing: 2pt; }
    p     { text-indent: 2em; margin: 0 0 8pt 0; text-align: justify; }
    p:first-of-type { text-indent: 0; }
    ul, ol { margin: 6pt 0 6pt 24pt; }
    blockquote { margin: 8pt 24pt; font-style: italic; color: #555; }
    em    { font-style: italic; }
    strong { font-weight: bold; }
    u     { text-decoration: underline; }
    s     { text-decoration: line-through; }
  </style>
</head>
<body>
  <h1>${escape(title || 'Untitled')}</h1>
  <p class="meta">${escape((genre || 'Fiction').toUpperCase())} — CHAPTER ONE</p>
  ${bodyHtml}
</body>
</html>`;

  // Leading BOM so Word recognises UTF-8 cleanly.
  const blob = new Blob(['﻿', doc], { type: 'application/msword' });
  triggerDownload(blob, `${fileSlug(title)}-chapter-1.doc`);
}

/**
 * @react-pdf/renderer-based PDF export. The PDFDocument component is imported
 * lazily by callers (heavy dependency tree).
 *
 * Throws on failure so callers can show a helpful error toast and fall back to
 * .docx (which is much more reliable). Common failure: Google Fonts network
 * fail during Font.register, which makes pdf() hang or throw.
 */
export async function exportPdf({ PDFDocument, title, genre, chapterText }) {
  if (!chapterText || chapterText.trim().length < 20) {
    throw new Error('Chapter is empty — nothing to export.');
  }
  if (!PDFDocument || typeof PDFDocument !== 'function') {
    throw new Error('PDF renderer not available.');
  }

  try {
    // Race against a 20s timeout so a hanging font load doesn't freeze the UI.
    const pdfPromise = pdf(PDFDocument({ title, genre, chapterText })).toBlob();
    const timeout    = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF generation timed out — try .docx instead.')), 20_000)
    );
    const blob = await Promise.race([pdfPromise, timeout]);

    if (!(blob instanceof Blob) || blob.size < 100) {
      throw new Error('Generated PDF appears empty.');
    }
    triggerDownload(blob, `${fileSlug(title)}-chapter-1.pdf`);
  } catch (err) {
    // Re-throw with a user-friendly message; caller decides how to surface
    const msg = err?.message?.includes('Network') || err?.message?.includes('font')
      ? 'PDF export needs an internet connection. Try .docx instead.'
      : err?.message || 'PDF export failed.';
    throw new Error(msg);
  }
}
