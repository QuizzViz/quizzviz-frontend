/**
 * Security Utilities for Input Sanitization and Validation
 */

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export const sanitizeString = (input: string | null | undefined): string => {
  if (!input) return '';
  
  return input
    // Remove HTML tags
    .replace(/<[^>]*>?/gi, '')
    // Remove potentially dangerous characters
    .replace(/[<>]/g, '')
    // Remove JavaScript event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol
    .replace(/data:/gi, '')
    // Limit length to prevent DoS
    .slice(0, 1000)
    .trim();
};

/**
 * Validate and sanitize role data before storage
 */
export const sanitizeRoleData = (role: any): { role: string; company_id?: string } | null => {
  if (!role || typeof role !== 'object') {
    return null;
  }
  
  const { role: roleValue, company_id } = role;
  
  // Validate role is a string and one of allowed values
  const allowedRoles = ['OWNER', 'ADMIN', 'MEMBER'];
  if (typeof roleValue !== 'string' || !allowedRoles.includes(roleValue)) {
    return null;
  }
  
  // Sanitize company_id if present
  const sanitizedCompanyId = company_id ? sanitizeString(company_id) : undefined;
  
  return {
    role: roleValue,
    company_id: sanitizedCompanyId
  };
};

/**
 * Generate secure random token for CSRF protection
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate company ID format
 */
export const isValidCompanyId = (companyId: string): boolean => {
  if (!companyId || typeof companyId !== 'string') {
    return false;
  }
  
  // Should be alphanumeric with optional underscores/hyphens
  const companyIdRegex = /^[a-zA-Z0-9_-]+$/;
  if (!companyIdRegex.test(companyId)) {
    return false;
  }
  
  // Should be between 3 and 50 characters
  if (companyId.length < 3 || companyId.length > 50) {
    return false;
  }
  
  // Should contain at least one letter
  if (!/[a-zA-Z]/.test(companyId)) {
    return false;
  }
  
  return true;
};
