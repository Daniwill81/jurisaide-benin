/**
 * Formatting utilities for display
 */

/**
 * Format a number as currency (FCFA - West African CFA franc)
 */
export function formatCurrency(value: number): string {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('fr-BJ', {
    style: 'currency',
    currency: 'XOF', // West African CFA franc
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a date string to readable format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-BJ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format a short date (without time)
 */
export function formatDateShort(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-BJ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(value: number, decimals = 0): string {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('fr-BJ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Format a phone number
 */
export function formatPhone(phone: string): string {
  if (!phone) return '-';
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX
  if (digits.length >= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return phone;
}

/**
 * Format an email address with truncation
 */
export function formatEmail(email: string): string {
  return truncate(email, 30);
}
