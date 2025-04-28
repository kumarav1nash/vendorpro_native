/**
 * Format a number as currency (₹) with 2 decimal places
 */
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toFixed(2)}`;
};

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Truncate a string if it's longer than maxLength
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

/**
 * Format a phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Format as +91 XXXXX XXXXX
  if (phoneNumber.length === 10) {
    return `+91 ${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`;
  }
  return phoneNumber;
}; 