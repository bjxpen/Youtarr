/**
 * Path/filename sanitization that exactly replicates yt-dlp's --windows-filenames behavior
 *
 * This is a direct port of yt-dlp's sanitize_path() and _sanitize_path_parts() functions
 * from yt_dlp/utils/_utils.py
 *
 * Reference: https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/utils/_utils.py
 */

/**
 * Sanitize individual path parts for Windows compatibility
 * Direct port of yt-dlp's _sanitize_path_parts()
 *
 * @param {string[]} parts - Array of path segments
 * @returns {string[]} - Sanitized path segments
 */
function sanitizePathParts(parts) {
  const sanitizedParts = [];

  for (const part of parts) {
    // Skip empty parts and single dots
    if (!part || part === '.') {
      continue;
    }

    // Handle parent directory references
    if (part === '..') {
      if (sanitizedParts.length > 0 && sanitizedParts[sanitizedParts.length - 1] !== '..') {
        sanitizedParts.pop();
      } else {
        sanitizedParts.push('..');
      }
      continue;
    }

    // Replace invalid segments with `#`
    // - trailing dots and spaces (`asdf...` => `asdf..#`)
    // - invalid chars (`<>` => `##`)
    // Regex: [/<>:"\|\\?\*] matches Windows-forbidden characters
    //        [\s.]$ matches trailing whitespace or dots
    const sanitizedPart = part.replace(/[/<>:"|\\?*]|[\s.]$/g, '#');
    sanitizedParts.push(sanitizedPart);
  }

  return sanitizedParts;
}

/**
 * Sanitize a path for Windows compatibility, exactly like yt-dlp does with --windows-filenames
 *
 * Direct port of yt-dlp's sanitize_path(s, force=True) behavior on non-Windows systems
 *
 * @param {string} s - The path string to sanitize
 * @returns {string} - The sanitized path
 */
function sanitizePathLikeYtDlp(s) {
  if (!s || typeof s !== 'string') {
    return '.';
  }

  // Preserve leading slash for absolute paths (Unix behavior with force=True)
  const root = s.startsWith('/') ? '/' : '';

  // Split by forward slash and sanitize each part
  const parts = s.split('/');
  const sanitizedPath = sanitizePathParts(parts).join('/');

  // Return root + path, or '.' if both are empty
  return (root || sanitizedPath) ? (root + sanitizedPath) : '.';
}

/**
 * Sanitize just a single filename/folder name component (not a full path)
 * This applies the same character replacement rules but doesn't handle path separators
 *
 * Uses the exact same regex as yt-dlp's _sanitize_path_parts():
 *   re.sub(r'[/<>:"\|\\?\*]|[\s.]$', '#', part)
 *
 * Note: [\s.]$ only replaces a SINGLE trailing space/dot, not all of them.
 * Example: "asdf..." => "asdf..#" (only last dot replaced)
 *
 * @param {string} name - The filename or folder name to sanitize
 * @returns {string} - The sanitized name
 */
function sanitizeNameLikeYtDlp(name) {
  if (!name || typeof name !== 'string') {
    return '_';
  }

  // Use the exact same regex as yt-dlp's _sanitize_path_parts
  // [/<>:"|\\?*] matches Windows-forbidden characters
  // [\s.]$ matches a single trailing whitespace or dot
  const sanitized = name.replace(/[/<>:"|\\?*]|[\s.]$/g, '#');

  return sanitized || '_';
}

/**
 * Truncate a string to a maximum number of bytes while ensuring it remains valid UTF-8
 * Replicates yt-dlp's byte-based truncation logic
 *
 * @param {string} s - The string to truncate
 * @param {number} maxBytes - The maximum allowed bytes
 * @returns {string} - The truncated string
 */
function truncateToBytes(s, maxBytes) {
  if (!s || typeof s !== 'string' || maxBytes <= 0) {
    return s;
  }

  const buf = Buffer.from(s, 'utf8');
  if (buf.length <= maxBytes) {
    return s;
  }

  // Truncate the buffer
  const truncatedBuf = buf.slice(0, maxBytes);

  // Convert back to string. This might end with a partial multi-byte character.
  // The 'utf8' decoder will handle partial characters by replacing them with the replacement character U+FFFD.
  let truncatedStr = truncatedBuf.toString('utf8');

  // If the last character is the replacement character, it means we cut in the middle of a multi-byte character.
  // We need to remove it until we have a valid string.
  while (truncatedStr.length > 0 && truncatedStr.endsWith('\uFFFD')) {
    truncatedStr = truncatedStr.slice(0, -1);
  }

  return truncatedStr;
}

module.exports = {
  sanitizePathLikeYtDlp,
  sanitizeNameLikeYtDlp,
  sanitizePathParts,
  truncateToBytes
};
