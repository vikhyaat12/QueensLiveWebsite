/**
 * Production HTML Sanitizer — Queens Care Laboratories
 * Validates and cleans untrusted HTML content before rendering via dangerouslySetInnerHTML.
 * Prevents Cross-Site Scripting (XSS) by stripping executable scripts, frames, objects,
 * event handlers (onclick, onerror, etc.), and dangerous URI schemes (javascript:, data:).
 */

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty || typeof dirty !== "string") return "";

  // 1. Strip script tags and their inner content
  let clean = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 2. Strip style tags and their inner content to prevent CSS injection
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // 3. Strip dangerous structural and active elements
  clean = clean.replace(/<\/?(iframe|object|embed|applet|form|input|button|textarea|select|meta|link|base)\b[^>]*>/gi, "");

  // 4. Strip all event handlers (on*) with quotes or unquoted
  clean = clean.replace(/\son\w+\s*=\s*(["']).*?\1/gi, "");
  clean = clean.replace(/\son\w+\s*=\s*[^>\s]+/gi, "");

  // 5. Neutralize dangerous pseudo-protocols in links and sources
  clean = clean.replace(/(href|src)\s*=\s*(["'])\s*(javascript|vbscript|data):.*?\2/gi, '$1="#"');

  return clean;
}

export default sanitizeHtml;
