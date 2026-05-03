/**
 * Lightweight markdown handling for AI output.
 * Two flavours:
 *   - markdownToHtml(text)        → safe HTML for browser rendering
 *   - cleanMarkdownToPlainText(text) → stripped text for PDF / plain contexts
 *
 * AI output sometimes leaks template scaffolding like "[TITLE SUGGESTION]" or
 * raw **bold** / *italic* markers. We strip placeholders and render emphasis.
 */

const PLACEHOLDER_PATTERNS = [
  /\[TITLE SUGGESTION[^\]]*\]/gi,
  /\[Chapter \d+ text[^\]]*\]/gi,
  /\[AUTHOR'?S NOTE[^\]]*\]/gi,
  /\[Author'?s Note[^\]]*\]/gi,
];

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripPlaceholders(s) {
  let out = s;
  for (const re of PLACEHOLDER_PATTERNS) out = out.replace(re, '');
  return out;
}

/**
 * Convert AI markdown → safe HTML.
 * Supports: **bold**, *italic*, _italic_, `code`, # headers (light), and
 * removes template placeholders.
 */
export function markdownToHtml(text) {
  if (!text) return '';
  let s = stripPlaceholders(text);
  s = escapeHtml(s);

  // Headers (single-line) → bold paragraph
  s = s.replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>');

  // Bold (greedy-safe, non-newline)
  s = s.replace(/\*\*([^*\n][^*]*?)\*\*/g, '<strong>$1</strong>');

  // Italic with single-asterisk (avoid matching the inside of bold we already replaced)
  s = s.replace(/(^|[\s(.,;:!?\-])\*([^*\n]+?)\*(?=[\s).,;:!?\-]|$)/g, '$1<em>$2</em>');

  // Italic with single-underscore
  s = s.replace(/(^|[\s(.,;:!?\-])_([^_\n]+?)_(?=[\s).,;:!?\-]|$)/g, '$1<em>$2</em>');

  // Inline code
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Collapse 3+ blank lines to 2
  s = s.replace(/\n{3,}/g, '\n\n');

  return s.trim();
}

/**
 * Strip markdown to plain text (for PDF rendering, etc).
 * Removes bold/italic markers, headers, code ticks, and placeholders.
 */
export function cleanMarkdownToPlainText(text) {
  if (!text) return '';
  let s = stripPlaceholders(text);
  s = s.replace(/^#{1,6}\s+/gm, '');
  s = s.replace(/\*\*([^*\n][^*]*?)\*\*/g, '$1');
  s = s.replace(/(^|[\s(.,;:!?\-])\*([^*\n]+?)\*(?=[\s).,;:!?\-]|$)/g, '$1$2');
  s = s.replace(/(^|[\s(.,;:!?\-])_([^_\n]+?)_(?=[\s).,;:!?\-]|$)/g, '$1$2');
  s = s.replace(/`([^`\n]+)`/g, '$1');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}
