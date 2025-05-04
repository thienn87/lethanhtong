/**
 * Utility functions for formatting values
 */

/**
 * Format a number as currency with Vietnamese đồng symbol
 * @param {number|string} value - The value to format
 * @param {boolean} showSymbol - Whether to show the currency symbol
 * @return {string} Formatted currency string
 */
export const formatCurrency = (value, showSymbol = true) => {
  // Handle null, undefined or empty string
  if (value === null || value === undefined || value === '') {
    return '0 ₫';
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Format with thousand separators
  const formattedValue = new Intl.NumberFormat('vi-VN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
  
  return formattedValue;
};

/**
 * Format a number with thousand separators
 * @param {number|string} value - The value to format
 * @return {string} Formatted number string
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
};

/**
 * Format a date string to localized format
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale to use (default: 'vi-VN')
 * @return {string} Formatted date string
 */
export const formatDate = (date, locale = 'vi-VN') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};