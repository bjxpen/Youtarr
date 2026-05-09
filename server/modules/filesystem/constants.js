/**
 * Shared constants for file and path operations
 * Single source of truth for all path-related constants
 */

/**
 * Prefix added to subfolder names for namespace safety
 * Subfolders are stored without this prefix in the database
 * but always have it when on the filesystem
 */
const SUBFOLDER_PREFIX = '__';

/**
 * Sentinel value for explicitly specifying "use global default subfolder"
 * This distinguishes from NULL which means "download to root" (backwards compatible)
 */
const GLOBAL_DEFAULT_SENTINEL = '##USE_GLOBAL_DEFAULT##';

/**
 * Sentinel value for explicitly specifying "download to root directory"
 * Used in manual downloads to override channel subfolder settings and download directly to root
 */
const ROOT_SENTINEL = '##ROOT##';

/**
 * Default video file extensions in priority order
 * Used when searching for video files with unknown extensions
 */
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.m4v', '.avi'];

/**
 * Audio file extensions for MP3 downloads
 */
const AUDIO_EXTENSIONS = ['.mp3'];

/**
 * All media file extensions (video + audio)
 * Used when searching for any downloaded media
 */
const MEDIA_EXTENSIONS = [...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS];

/**
 * Truncation limits for channel and video names (in bytes)
 * Used to avoid "File name too long" errors on restricted filesystems (e.g. eCryptfs)
 */
const CHANNEL_NAME_DEFAULT_BYTES = 80;
const CHANNEL_NAME_MIN_BYTES = 32;
const VIDEO_TITLE_DEFAULT_BYTES = 76;
const VIDEO_TITLE_MIN_BYTES = 50;

/**
 * Build yt-dlp output template for channel folder name
 * Uses uploader with fallback to channel, then uploader_id
 * @param {number} byteLimit - Byte limit for truncation (default: 80)
 * @returns {string} - Template segment
 */
const getChannelTemplate = (byteLimit = CHANNEL_NAME_DEFAULT_BYTES) =>
  `%(uploader,channel,uploader_id).${byteLimit}B`;

/**
 * yt-dlp output template for channel folder name (default 80B)
 */
const CHANNEL_TEMPLATE = getChannelTemplate();

/**
 * Build yt-dlp output template for video folder name
 * Format: "ChannelName - VideoTitle - VideoID"
 * @param {number} channelLimit - Byte limit for channel uploader truncation (default: 80)
 * @param {number} titleLimit - Byte limit for title truncation (default: 76)
 * @returns {string} - Template segment
 */
const getVideoFolderTemplate = (channelLimit = CHANNEL_NAME_DEFAULT_BYTES, titleLimit = VIDEO_TITLE_DEFAULT_BYTES) =>
  `${getChannelTemplate(channelLimit)} - %(title).${titleLimit}B - %(id)s`;

/**
 * yt-dlp output template for video folder name (default 80B channel, 76B title)
 */
const VIDEO_FOLDER_TEMPLATE = getVideoFolderTemplate();

/**
 * Build yt-dlp output template for video file name
 * Format: "ChannelName - VideoTitle [VideoID].ext"
 * @param {number} channelLimit - Byte limit for channel uploader truncation (default: 80)
 * @param {number} titleLimit - Byte limit for title truncation (default: 76)
 * @returns {string} - Template segment
 */
const getVideoFileTemplate = (channelLimit = CHANNEL_NAME_DEFAULT_BYTES, titleLimit = VIDEO_TITLE_DEFAULT_BYTES) =>
  `${getChannelTemplate(channelLimit)} - %(title).${titleLimit}B [%(id)s].%(ext)s`;

/**
 * yt-dlp output template for video file name (default 80B channel, 76B title)
 */
const VIDEO_FILE_TEMPLATE = getVideoFileTemplate();

/**
 * Pattern to extract YouTube video ID from filename
 * Matches [VideoID] where VideoID is 11 alphanumeric characters (including - and _)
 */
const YOUTUBE_ID_BRACKET_PATTERN = /\[([a-zA-Z0-9_-]{11})\]/;

/**
 * Pattern to extract YouTube video ID from directory name
 * Matches " - VideoID" at the end of directory name
 */
const YOUTUBE_ID_DASH_PATTERN = / - ([a-zA-Z0-9_-]{10,12})$/;

/**
 * Pattern to validate a YouTube video ID string
 */
const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{10,12}$/;

/**
 * Pattern to identify main video files (not fragments)
 * Matches [VideoID].mp4/mkv/webm but NOT .fXXX.mp4
 */
const MAIN_VIDEO_FILE_PATTERN = /\[[a-zA-Z0-9_-]{10,12}\]\.(mp4|mkv|webm)$/;

/**
 * Pattern to identify main audio files (MP3 downloads)
 * Matches [VideoID].mp3
 */
const MAIN_AUDIO_FILE_PATTERN = /\[[a-zA-Z0-9_-]{10,12}\]\.mp3$/;

/**
 * Pattern to identify any main media file (video or audio)
 * Matches [VideoID].mp4/mkv/webm/mp3
 */
const MAIN_MEDIA_FILE_PATTERN = /\[[a-zA-Z0-9_-]{10,12}\]\.(mp4|mkv|webm|mp3)$/;

/**
 * Pattern to identify video fragment files (to exclude)
 */
const FRAGMENT_FILE_PATTERN = /\.f[\d-]+\.(mp4|m4a|webm|mkv)$/;

/**
 * Files that can be ignored when deciding whether a channel directory is empty
 * If a channel directory contains ONLY these files (and no actual video content),
 * it is considered "effectively empty" and eligible for cleanup
 */
const CHANNEL_CLEANUP_IGNORABLE_FILES = [
  'poster.jpg',
  'poster.png',
  'poster.jpeg',
  '.ds_store',
  'thumbs.db',
  'desktop.ini',
];

/**
 * AppleDouble metadata files written by macOS SMB clients (e.g., "._video.mp4").
 * These are sidecar metadata for an underlying file; once the underlying file
 * is gone, the sidecar is orphaned junk and safe to remove. Mac SMB also tends
 * to write these into a directory in response to other operations, which can
 * race with rmdir and cause spurious ENOTEMPTY (issue #370).
 */
const APPLEDOUBLE_FILE_PATTERN = /^\._/;

module.exports = {
  SUBFOLDER_PREFIX,
  GLOBAL_DEFAULT_SENTINEL,
  ROOT_SENTINEL,
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
  MEDIA_EXTENSIONS,
  CHANNEL_NAME_DEFAULT_BYTES,
  CHANNEL_NAME_MIN_BYTES,
  VIDEO_TITLE_DEFAULT_BYTES,
  VIDEO_TITLE_MIN_BYTES,
  getChannelTemplate,
  getVideoFolderTemplate,
  getVideoFileTemplate,
  CHANNEL_TEMPLATE,
  VIDEO_FOLDER_TEMPLATE,
  VIDEO_FILE_TEMPLATE,
  YOUTUBE_ID_BRACKET_PATTERN,
  YOUTUBE_ID_DASH_PATTERN,
  YOUTUBE_ID_PATTERN,
  MAIN_VIDEO_FILE_PATTERN,
  MAIN_AUDIO_FILE_PATTERN,
  MAIN_MEDIA_FILE_PATTERN,
  FRAGMENT_FILE_PATTERN,
  CHANNEL_CLEANUP_IGNORABLE_FILES,
  APPLEDOUBLE_FILE_PATTERN,
  PATH_TRUNCATION_TIERS: [
    { channel: 80, title: 76 }, // Tier 1: Default
    { channel: 80, title: 50 }, // Tier 2: Shortened title
    { channel: 32, title: 50 }  // Tier 3: Shortened both
  ]
};
