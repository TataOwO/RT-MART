/**
 * Normalize phone number to XXXX-XXX-XXX format
 */
export function formatPhoneNumber(phoneNumber?: string): string | undefined {
  if (!phoneNumber) return phoneNumber;

  // If already in correct format, return as is
  if (/^\d{4}-\d{3}-\d{3}$/.test(phoneNumber)) {
    return phoneNumber;
  }

  // Extract only digits
  const digits = phoneNumber.replace(/\D/g, '');

  // If we have exactly 10 digits, format them
  if (digits.length === 10) {
    return digits.replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3');
  }

  return phoneNumber;
}
