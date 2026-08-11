// Formatting utility functions

/**
 * Format number with commas (e.g., 1000 -> 1,000)
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
};

/**
 * Format number to K/M notation (e.g., 1000 -> 1K, 1000000 -> 1M)
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatCompactNumber = (num) => {
    if (num === null || num === undefined) return '0';

    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

/**
 * Format file size (bytes to MB/KB)
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    if (!date) return '';

    const d = new Date(date);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
};

/**
 * Format a USD amount, optionally converting to another currency.
 *
 * Basic usage (backward-compatible):
 *   formatCurrency(100)               => "$100"
 *
 * With CurrencyContext:
 *   formatCurrency(100, 'TZS', 'TSh', 2580)  => "TSh258,000"
 *
 * @param {number} amount       - Amount in USD
 * @param {string} [currencyCode='USD'] - ISO currency code
 * @param {string} [symbol='$'] - Currency symbol
 * @param {number} [rate=1]     - Conversion rate (1 USD = rate units)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD', symbol = '$', rate = 1) => {
    if (amount === null || amount === undefined) return `${symbol}0`;
    const converted = amount * rate;
    const decimals = currencyCode === 'USD' ? 2 : 0;
    const formatted = converted.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    return `${symbol}${formatted}`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Resolve a backend-relative media URL (e.g. "/api/files/profilePictures/xxx.jpg")
 * into a full absolute URL using VITE_API_URL as the server root.
 * Absolute URLs (http/https) and empty values are passed through unchanged.
 * @param {string} url - Relative or absolute media URL
 * @returns {string} Absolute URL, or '' if url is falsy
 */
export const resolveMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiBase = import.meta.env.VITE_API_URL || '';
    const serverRoot = apiBase.replace(/\/api$/, '');
    return `${serverRoot}${url}`;
};

export default {
    formatNumber,
    formatCompactNumber,
    formatFileSize,
    formatDate,
    formatCurrency,
    truncateText,
    resolveMediaUrl
};
