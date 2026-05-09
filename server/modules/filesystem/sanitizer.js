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
 * Truncate a string to a maximum number of bytes without breaking UTF-8 characters
 * This replicates yt-dlp's .NB template behavior
 *
 * @param {string} str - String to truncate
 * @param {number} maxBytes - Maximum allowed bytes
 * @returns {string} - Truncated string
 */
function truncateToBytes(str, maxBytes) {
  if (!str || maxBytes <= 0) return '';

  const buf = Buffer.from(str);
  if (buf.length <= maxBytes) return str;

  // Truncate the buffer
  const truncatedBuf = buf.subarray(0, maxBytes);

  // Buffer.toString('utf8') automatically handles partial characters at the end
  // by replacing them with the replacement character (U+FFFD).
  // We want to avoid that and instead slice until we have a valid UTF-8 string.
  let result = truncatedBuf.toString('utf8');

  // If the last character is the replacement character, it means we cut in the middle of a multi-byte char
  while (result.endsWith('\uFFFD') && result.length > 0) {
    result = result.slice(0, -1);
  }

  return result;
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
 * @param {number|null} maxBytes - Optional byte limit for truncation
 * @returns {string} - The sanitized name
 */
function sanitizeNameLikeYtDlp(name, maxBytes = null) {
  if (!name || typeof name !== 'string') {
    return '_';
  }

  let processedName = name;
  if (maxBytes !== null && maxBytes > 0) {
    processedName = truncateToBytes(name, maxBytes);
  }

  // Use the exact same regex as yt-dlp's _sanitize_path_parts
  // [/<>:"|\\?*] matches Windows-forbidden characters
  // [\s.]$ matches a single trailing whitespace or dot
  const sanitized = processedName.replace(/[/<>:"|\\?*]|[\s.]$/g, '#');

  return sanitized || '_';
}

module.exports = {
  sanitizePathLikeYtDlp,
  sanitizeNameLikeYtDlp,
  sanitizePathParts,
  truncateToBytes
};
