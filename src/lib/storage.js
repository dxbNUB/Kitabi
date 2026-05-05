import { supabase } from './supabase';

/**
 * Persistent storage for chats and chapters via Supabase.
 *
 * Why this exists: the in-memory Zustand session is sessionStorage-backed
 * (lost on tab close), and the localStorage editor backup is editor-only.
 * Closing the browser before saving used to lose the work. This module
 * persists every chat and every chapter to Supabase per-user, so a user
 * can come back later and pick up where they left off — and rewrites
 * preserve the previous version instead of overwriting it.
 *
 * All functions are no-ops if the Supabase client is missing (anonymous
 * mode / build-time without env vars). RLS policies on the chats and
 * chapters tables enforce per-user isolation; security doesn't depend
 * on this client code.
 */

// ─── Chats ─────────────────────────────────────────────────────────

/**
 * Insert a new chat row, return the row's id.
 * Called the first time a user sends a message in a new conversation.
 */
export async function createChat({ title, genre, mode, messages, context }) {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('chats')
    .insert({
      user_id: user.id,
      title:   title  || 'Untitled chat',
      genre:   genre  || null,
      mode:    mode   || null,
      messages: messages || [],
      context:  context  || {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('[storage] createChat failed:', error.message);
    return null;
  }
  return data.id;
}

/**
 * Update an existing chat by id. Used for autosave on every message.
 * Caller debounces this; we don't.
 */
export async function updateChat(id, { title, genre, mode, messages, context }) {
  if (!supabase || !id) return false;

  const patch = { updated_at: new Date().toISOString() };
  if (title    !== undefined) patch.title    = title;
  if (genre    !== undefined) patch.genre    = genre;
  if (mode     !== undefined) patch.mode     = mode;
  if (messages !== undefined) patch.messages = messages;
  if (context  !== undefined) patch.context  = context;

  const { error } = await supabase.from('chats').update(patch).eq('id', id);
  if (error) {
    console.error('[storage] updateChat failed:', error.message);
    return false;
  }
  return true;
}

/**
 * List all ACTIVE chats for the current user, newest first.
 * Excludes soft-deleted chats (deleted_at IS NOT NULL).
 */
export async function listChats() {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('chats')
    .select('id, title, genre, mode, created_at, updated_at, messages')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[storage] listChats failed:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Load a single chat by id (full messages + context).
 * Returns null if not found or not authorized (RLS will reject).
 */
export async function loadChat(id) {
  if (!supabase || !id) return null;

  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[storage] loadChat failed:', error.message);
    return null;
  }
  return data;
}

// ─── Chapters ──────────────────────────────────────────────────────

/**
 * Save a generated chapter. NEVER overwrites existing rows — every
 * generation creates a new row, so rewrites preserve the previous
 * chapter as a separate version (sortable by created_at).
 */
export async function saveChapter({
  chatId,
  title,
  content,
  editedHtml,
  wordCount,
  genre,
  versionNumber,
  parentChapterId,
}) {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('chapters')
    .insert({
      user_id:           user.id,
      chat_id:           chatId          || null,
      title:             title           || 'Untitled chapter',
      content,
      edited_html:       editedHtml      || null,
      word_count:        wordCount       || null,
      genre:             genre           || null,
      version_number:    versionNumber   || 1,
      parent_chapter_id: parentChapterId || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[storage] saveChapter failed:', error.message);
    return null;
  }
  return data.id;
}

/**
 * Update the edited HTML of an existing chapter (after editor save).
 */
export async function updateChapterEdit(id, editedHtml) {
  if (!supabase || !id) return false;
  const { error } = await supabase
    .from('chapters')
    .update({ edited_html: editedHtml })
    .eq('id', id);
  if (error) {
    console.error('[storage] updateChapterEdit failed:', error.message);
    return false;
  }
  return true;
}

/**
 * List all ACTIVE chapters for the current user, newest first.
 * Includes all versions of any rewritten chapter.
 * Excludes soft-deleted chapters (deleted_at IS NOT NULL).
 */
export async function listChapters() {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('chapters')
    .select('id, chat_id, title, word_count, genre, version_number, parent_chapter_id, created_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[storage] listChapters failed:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Load the full content of a single chapter by id.
 */
export async function loadChapter(id) {
  if (!supabase || !id) return null;
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[storage] loadChapter failed:', error.message);
    return null;
  }
  return data;
}

// ─── Soft delete + Recently Deleted (Trash) ───────────────────────
//
// Pattern: every chat/chapter has a nullable `deleted_at` timestamp.
// "Delete" = set deleted_at = now(). Item disappears from active lists
// but stays in the DB for 90 days, listable via listDeletedItems().
// Restore = null out deleted_at. Permanent delete = actual DELETE row.
// After 90 days an item is functionally invisible (filter cuts it from
// the trash query) — we don't auto-purge from the DB yet, that can be
// a scheduled job later.

const TRASH_RETENTION_DAYS = 90;

/** Move a chat to Recently Deleted. */
export async function softDeleteChat(id) {
  if (!supabase || !id) return false;
  const { error } = await supabase
    .from('chats')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    console.error('[storage] softDeleteChat failed:', error.message);
    return false;
  }
  return true;
}

/** Move a chapter to Recently Deleted. */
export async function softDeleteChapter(id) {
  if (!supabase || !id) return false;
  const { error } = await supabase
    .from('chapters')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    console.error('[storage] softDeleteChapter failed:', error.message);
    return false;
  }
  return true;
}

/** Restore a chat from Recently Deleted. */
export async function restoreChat(id) {
  if (!supabase || !id) return false;
  const { error } = await supabase
    .from('chats')
    .update({ deleted_at: null })
    .eq('id', id);
  if (error) {
    console.error('[storage] restoreChat failed:', error.message);
    return false;
  }
  return true;
}

/** Restore a chapter from Recently Deleted. */
export async function restoreChapter(id) {
  if (!supabase || !id) return false;
  const { error } = await supabase
    .from('chapters')
    .update({ deleted_at: null })
    .eq('id', id);
  if (error) {
    console.error('[storage] restoreChapter failed:', error.message);
    return false;
  }
  return true;
}

/** Permanently delete a chat — bypasses the 90-day trash, gone immediately. */
export async function permanentDeleteChat(id) {
  if (!supabase || !id) return false;
  const { error } = await supabase.from('chats').delete().eq('id', id);
  if (error) {
    console.error('[storage] permanentDeleteChat failed:', error.message);
    return false;
  }
  return true;
}

/** Permanently delete a chapter — bypasses the 90-day trash, gone immediately. */
export async function permanentDeleteChapter(id) {
  if (!supabase || !id) return false;
  const { error } = await supabase.from('chapters').delete().eq('id', id);
  if (error) {
    console.error('[storage] permanentDeleteChapter failed:', error.message);
    return false;
  }
  return true;
}

/**
 * List soft-deleted chats and chapters within the 90-day retention window.
 * Returns { chats, chapters } each newest-deleted first.
 */
export async function listDeletedItems() {
  if (!supabase) return { chats: [], chapters: [] };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { chats: [], chapters: [] };

  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [chatsRes, chaptersRes] = await Promise.all([
    supabase
      .from('chats')
      .select('id, title, genre, mode, deleted_at, updated_at, messages')
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .gte('deleted_at', cutoff)
      .order('deleted_at', { ascending: false }),
    supabase
      .from('chapters')
      .select('id, chat_id, title, word_count, genre, version_number, parent_chapter_id, deleted_at, created_at')
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .gte('deleted_at', cutoff)
      .order('deleted_at', { ascending: false }),
  ]);

  if (chatsRes.error)    console.error('[storage] listDeletedItems chats:',    chatsRes.error.message);
  if (chaptersRes.error) console.error('[storage] listDeletedItems chapters:', chaptersRes.error.message);

  return {
    chats:    chatsRes.data    || [],
    chapters: chaptersRes.data || [],
  };
}

/** Days remaining before a deleted item auto-purges. Returns 0 if already past. */
export function daysUntilPurge(deletedAt) {
  if (!deletedAt) return 0;
  const elapsed = (Date.now() - new Date(deletedAt).getTime()) / (24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil(TRASH_RETENTION_DAYS - elapsed));
}

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Debounce wrapper for autosave. Returns a function that delays the
 * actual save until `wait` ms have passed since the last call.
 */
export function debounceSave(fn, wait = 1500) {
  let t = null;
  let pending = null;
  const run = () => { fn(...pending); pending = null; t = null; };
  return (...args) => {
    pending = args;
    if (t) clearTimeout(t);
    t = setTimeout(run, wait);
  };
}
