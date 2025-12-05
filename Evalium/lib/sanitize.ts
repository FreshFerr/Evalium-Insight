/**
 * M-3: Input sanitization utilities
 * 
 * NOTE: Currently the codebase does not use dangerouslySetInnerHTML
 * and relies on React's built-in XSS protection (auto-escaping).
 * 
 * This file provides sanitization helpers for future use cases where
 * raw HTML might need to be rendered (e.g., rich text from CMS, markdown).
 */

/**
 * Remove HTML tags from a string
 * Use this when you want to display user input as plain text
 * 
 * @param input - String that may contain HTML
 * @returns Plain text with all HTML tags removed
 */
export function stripHtml(input: string): string {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML special characters to prevent XSS
 * Use this when you need to display user input in contexts
 * where React's auto-escaping doesn't apply
 * 
 * @param input - String that may contain HTML special characters
 * @returns String with HTML entities escaped
 */
export function escapeHtml(input: string): string {
  if (!input) return '';
  
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return input.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitize a string for safe use in attributes
 * Removes potentially dangerous characters
 * 
 * @param input - String to sanitize
 * @returns Sanitized string safe for attribute use
 */
export function sanitizeAttribute(input: string): string {
  if (!input) return '';
  // Remove characters that could break out of attribute context
  return input.replace(/[<>"'&]/g, '');
}

/**
 * Sanitize a filename for safe download
 * Removes path traversal and special characters
 * 
 * @param filename - Proposed filename
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'file';
  
  // Remove path traversal attempts and special chars
  return filename
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\./, '')
    .substring(0, 100); // Limit length
}

/**
 * Basic URL sanitization to prevent javascript: and data: URLs
 * Use when accepting URLs from user input
 * 
 * @param url - URL to validate
 * @returns Sanitized URL or empty string if dangerous
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '';
  }
  
  return url;
}

