
export const attemptDataFix = (record: any): any => {
  const fixed = { ...record };

  // Trim whitespace
  Object.keys(fixed).forEach(key => {
    if (typeof fixed[key] === 'string') {
      fixed[key] = fixed[key].trim();
    }
  });

  // Fix email case
  if (fixed.email) {
    fixed.email = fixed.email.toLowerCase();
  }

  // Fix phone format
  if (fixed.phone) {
    fixed.phone = fixed.phone.replace(/\D/g, ''); // Remove non-digits
    if (fixed.phone.length >= 10) {
      // Add + if missing for international format
      if (!fixed.phone.startsWith('+')) {
        fixed.phone = '+' + fixed.phone;
      }
    }
  }

  // Fix status case
  if (fixed.status) {
    fixed.status = fixed.status.toLowerCase();
  }

  // Fix KYC status case
  if (fixed.kyc_status) {
    fixed.kyc_status = fixed.kyc_status.toLowerCase();
  }

  // Set default values
  if (!fixed.status) {
    fixed.status = 'new';
  }

  if (!fixed.kyc_status) {
    fixed.kyc_status = 'not_submitted';
  }

  return fixed;
};
