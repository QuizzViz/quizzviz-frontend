/**
 * Company ID Validation Utility
 * Prevents hardcoded company IDs and ensures data consistency
 */

export const INVALID_COMPANY_IDS = [
  'quizzviz',
  'test',
  'demo',
  'example',
  'default'
];

export const isValidCompanyId = (companyId: string): boolean => {
  if (!companyId || typeof companyId !== 'string') {
    return false;
  }

  // Check against invalid IDs
  if (INVALID_COMPANY_IDS.includes(companyId.toLowerCase().trim())) {
    return false;
  }

  // Basic validation - should be meaningful identifier
  if (companyId.length < 2 || companyId.length > 100) {
    return false;
  }

  // Should contain at least one letter (not just numbers/symbols)
  if (!/[a-zA-Z]/.test(companyId)) {
    return false;
  }

  return true;
};

export const sanitizeCompanyId = (companyId: string): string => {
  if (!companyId) return '';
  
  return companyId
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-') // Replace invalid chars with hyphen
    .replace(/-+/g, '-') // Multiple hyphens to single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

export const generateCompanyId = (companyName: string): string => {
  if (!companyName) {
    throw new Error('Company name is required to generate company ID');
  }

  const sanitized = sanitizeCompanyId(companyName);
  
  if (!isValidCompanyId(sanitized)) {
    throw new Error(`Invalid company ID generated: ${sanitized}`);
  }

  return sanitized;
};

export const validateCompanyData = (companyData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!companyData) {
    errors.push('Company data is required');
    return { isValid: false, errors };
  }

  // Validate company_id
  if (!companyData.company_id) {
    errors.push('Company ID is required');
  } else if (!isValidCompanyId(companyData.company_id)) {
    errors.push(`Invalid company ID: ${companyData.company_id}`);
  }

  // Validate company name
  if (!companyData.name || companyData.name.trim().length < 2) {
    errors.push('Company name must be at least 2 characters');
  }

  // Check for hardcoded values
  if (companyData.name.toLowerCase().includes('quizzviz')) {
    errors.push('Company name cannot contain reserved words');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
