export function formatCompanyIdToName(companyId: string): string {
  // If the ID contains underscores, it's a multi-word name with spaces
  if (companyId.includes('_')) {
    return companyId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  // If it's a single word, just capitalize the first letter
  return companyId.charAt(0).toUpperCase() + companyId.slice(1);
}
